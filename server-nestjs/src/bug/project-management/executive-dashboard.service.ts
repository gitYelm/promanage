import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PM_DASHBOARD_GROUPS, PM_RISK_LEVEL } from '../constants/project-management.constants'
import { ProjectDashboardQueryDto } from '../dto/project-dashboard.dto'
import { type RequestUserLike } from '../bug-access.service'
import { ProjectDashboardQueryService } from './project-dashboard-query.service'

@Injectable()
export class ExecutiveDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly query: ProjectDashboardQueryService,
  ) {}

  async summary(input: ProjectDashboardQueryDto, user: RequestUserLike) {
    const projectIds = await this.query.visibleProjectIds(user, input)
    const now = new Date()
    const [totalProjects, riskProjects, delayedProjects, upcomingMilestones, counts] =
      await Promise.all([
        this.prisma.bugProject.count({ where: await this.query.projectWhere(user, input) }),
        this.prisma.bugProject.count({
          where: {
            AND: [
              await this.query.projectWhere(user, input),
              {
                riskLevel: {
                  in: [PM_RISK_LEVEL.MEDIUM, PM_RISK_LEVEL.HIGH, PM_RISK_LEVEL.DELAYED],
                },
              },
            ],
          },
        }),
        this.prisma.bugProject.count({
          where: {
            AND: [
              await this.query.projectWhere(user, input),
              {
                plannedEndTime: { lt: now },
                projectStage: { notIn: ['released', 'maintenance', 'archived'] },
              },
            ],
          },
        }),
        this.prisma.projectMilestone.count({
          where: {
            projectId: { in: projectIds },
            delFlag: '0',
            targetDate: { gte: now, lte: this.daysLater(7) },
          },
        }),
        this.query.workCounts(user, projectIds, input),
      ])
    return {
      totalProjects,
      normalProjects: Math.max(totalProjects - riskProjects - delayedProjects, 0),
      riskProjects,
      delayedProjects,
      upcomingMilestones,
      ...counts,
      lastUpdatedAt: new Date(),
    }
  }

  async projects(input: ProjectDashboardQueryDto, user: RequestUserLike) {
    const projects = await this.prisma.bugProject.findMany({
      where: await this.query.projectWhere(user, input),
      include: { owner: true },
      orderBy: [{ riskLevel: 'desc' }, { plannedEndTime: 'asc' }],
      take: Number(input.pageSize ?? 50),
    })
    return Promise.all(
      projects.map(async (project) => {
        const baseBugWhere = await this.query.scopedBugWhere(
          user,
          [project.projectId],
          undefined,
          input,
        )
        const [totalReq, doneReq, totalBug, closedBug, blockerBugs, delayedMilestones] =
          await Promise.all([
            this.prisma.projectRequirement.count({
              where: { projectId: project.projectId, delFlag: '0' },
            }),
            this.prisma.projectRequirement.count({
              where: {
                projectId: project.projectId,
                delFlag: '0',
                status: { in: this.query.requirementDoneStatuses() },
              },
            }),
            this.prisma.bugTicket.count({ where: baseBugWhere }),
            this.prisma.bugTicket.count({ where: { AND: [baseBugWhere, { status: 'closed' }] } }),
            this.prisma.bugTicket.count({
              where: {
                AND: [
                  baseBugWhere,
                  { severity: { in: ['blocker', 'critical'] }, status: { not: 'closed' } },
                ],
              },
            }),
            this.query.milestoneRisk(project.projectId),
          ])
        return {
          project,
          // 与项目概览一致：这里展示项目表维护的综合进度；需求完成率仍由其他指标单独体现。
          progress: project.progress ?? 0,
          requirementDoneRate: this.query.progress(totalReq, doneReq),
          bugCloseRate: this.query.progress(totalBug, closedBug),
          blockerBugs,
          delayedMilestones,
          health: this.health(project.riskLevel, blockerBugs, delayedMilestones),
        }
      }),
    )
  }

  async risks(input: ProjectDashboardQueryDto, user: RequestUserLike) {
    const projectIds = await this.query.visibleProjectIds(user, input)
    const [blockingBugs, delayedMilestones, pendingRequirements] = await Promise.all([
      this.prisma.bugTicket.findMany({
        where: {
          AND: [
            await this.query.scopedBugWhere(user, projectIds),
            { severity: { in: ['blocker', 'critical'] }, status: { not: 'closed' } },
          ],
        },
        include: { project: true, assignee: true },
        take: 20,
      }),
      this.prisma.projectMilestone.findMany({
        where: {
          projectId: { in: projectIds },
          delFlag: '0',
          status: { notIn: ['achieved', 'cancelled'] },
          targetDate: { lt: new Date() },
        },
        include: { project: true, owner: true },
        take: 20,
      }),
      this.prisma.projectRequirement.findMany({
        where: this.query.requirementWhere(
          projectIds,
          PM_DASHBOARD_GROUPS.requirementPending,
          input,
        ),
        include: { project: true, owner: true },
        take: 20,
      }),
    ])
    return { blockingBugs, delayedMilestones, pendingRequirements }
  }

  async upcoming(input: ProjectDashboardQueryDto, user: RequestUserLike) {
    const projectIds = await this.query.visibleProjectIds(user, input)
    return this.prisma.projectMilestone.findMany({
      where: {
        projectId: { in: projectIds },
        delFlag: '0',
        targetDate: { gte: new Date(), lte: this.daysLater(30) },
      },
      include: { project: true, owner: true },
      orderBy: { targetDate: 'asc' },
      take: 30,
    })
  }

  async currentWork(input: ProjectDashboardQueryDto, user: RequestUserLike) {
    const projectIds = await this.query.visibleProjectIds(user, input)
    const [requirements, bugs] = await Promise.all([
      this.query.requirementRows(projectIds, PM_DASHBOARD_GROUPS.requirementCurrent, input),
      this.query.bugRows(user, projectIds, PM_DASHBOARD_GROUPS.bugCurrent, input),
    ])
    return { requirements, bugs }
  }

  async completedHistory(input: ProjectDashboardQueryDto, user: RequestUserLike) {
    const projectIds = await this.query.visibleProjectIds(user, input)
    const [requirements, bugs] = await Promise.all([
      this.query.requirementRows(projectIds, PM_DASHBOARD_GROUPS.requirementCompleted, input),
      this.query.bugRows(user, projectIds, PM_DASHBOARD_GROUPS.bugCompleted, input),
    ])
    return { requirements, bugs }
  }

  async pendingWork(input: ProjectDashboardQueryDto, user: RequestUserLike) {
    const projectIds = await this.query.visibleProjectIds(user, input)
    const [requirements, bugs] = await Promise.all([
      this.query.requirementRows(projectIds, PM_DASHBOARD_GROUPS.requirementPending, input),
      this.query.bugRows(user, projectIds, PM_DASHBOARD_GROUPS.bugPending, input),
    ])
    return { requirements, bugs }
  }

  async actions(input: ProjectDashboardQueryDto, user: RequestUserLike) {
    const summary = await this.summary(input, user)
    const actions = [] as Array<{ level: string; message: string }>
    if (summary.delayedProjects > 0)
      actions.push({
        level: 'high',
        message: `已有 ${summary.delayedProjects} 个项目延期，建议重新确认排期。`,
      })
    if (summary.blockerBugs > 0)
      actions.push({
        level: 'high',
        message: `存在 ${summary.blockerBugs} 个阻断缺陷，建议协调研发优先处理。`,
      })
    if (summary.pendingRequirements > 0)
      actions.push({
        level: 'medium',
        message: `仍有 ${summary.pendingRequirements} 个未处理需求，建议产品负责人确认排期。`,
      })
    if (!actions.length)
      actions.push({ level: 'low', message: '当前项目整体推进正常，暂无需要管理层介入事项。' })
    return actions
  }

  private daysLater(days: number) {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date
  }

  private health(riskLevel: string | null, blockerBugs: number, delayedMilestones: number) {
    if (riskLevel === PM_RISK_LEVEL.DELAYED || delayedMilestones > 0) return 'delayed'
    if (riskLevel === PM_RISK_LEVEL.HIGH || blockerBugs > 0) return 'risk'
    if (riskLevel === PM_RISK_LEVEL.MEDIUM) return 'watch'
    return 'healthy'
  }
}

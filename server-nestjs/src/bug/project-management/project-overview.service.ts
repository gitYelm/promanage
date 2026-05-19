import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { BusinessException } from '../../common/exceptions/business.exception'
import { BugAccessService, type RequestUserLike } from '../bug-access.service'
import { PM_ACTIVITY_ACTION, PM_ACTIVITY_TARGET, PM_DASHBOARD_GROUPS } from '../constants/project-management.constants'
import { UpdateProjectProgressDto } from '../dto/project-management.dto'
import { ProjectActivityService } from './project-activity.service'
import { ProjectDashboardQueryService } from './project-dashboard-query.service'

@Injectable()
export class ProjectOverviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: BugAccessService,
    private readonly query: ProjectDashboardQueryService,
    private readonly activity: ProjectActivityService,
  ) {}

  async overview(projectId: string, user: RequestUserLike) {
    await this.assertVisible(projectId, user)
    const id = BigInt(projectId)
    const project = await this.prisma.bugProject.findUnique({ where: { projectId: id }, include: { owner: true } })
    if (!project) throw BusinessException.notFound('项目不存在')
    const [requirementTotal, requirementDone, bugTotal, bugClosed, counts, currentRequirements, currentBugs, pendingRequirements, pendingBugs, completedRequirements, completedBugs, activities, nextMilestone] = await Promise.all([
      this.prisma.projectRequirement.count({ where: { projectId: id, delFlag: '0' } }),
      this.prisma.projectRequirement.count({ where: { projectId: id, delFlag: '0', status: { in: this.query.requirementDoneStatuses() } } }),
      this.prisma.bugTicket.count({ where: { projectId: id, delFlag: '0' } }),
      this.prisma.bugTicket.count({ where: { projectId: id, delFlag: '0', status: 'closed' } }),
      this.query.workCounts(user, [id]),
      this.query.requirementRows([id], PM_DASHBOARD_GROUPS.requirementCurrent),
      this.query.bugRows(user, [id], PM_DASHBOARD_GROUPS.bugCurrent),
      this.query.requirementRows([id], PM_DASHBOARD_GROUPS.requirementPending),
      this.query.bugRows(user, [id], PM_DASHBOARD_GROUPS.bugPending),
      this.query.requirementRows([id], PM_DASHBOARD_GROUPS.requirementCompleted),
      this.query.bugRows(user, [id], PM_DASHBOARD_GROUPS.bugCompleted),
      this.activity.list(projectId, 20),
      this.prisma.projectMilestone.findFirst({ where: { projectId: id, delFlag: '0', status: { notIn: ['achieved', 'cancelled'] } }, orderBy: { targetDate: 'asc' } }),
    ])
    return {
      project,
      // 项目进度以“更新进度”中维护的项目表进度为准；需求完成度单独用 requirementDone/requirementTotal 展示，避免口径混淆。
      progress: project.progress ?? 0,
      requirementTotal,
      requirementDone,
      bugTotal,
      bugClosed,
      bugCloseRate: this.query.progress(bugTotal, bugClosed),
      counts,
      currentRequirements,
      currentBugs,
      pendingRequirements,
      pendingBugs,
      completedRequirements,
      completedBugs,
      nextMilestone,
      activities,
    }
  }

  async updateProgress(projectId: string, dto: UpdateProjectProgressDto, user: RequestUserLike) {
    await this.assertVisible(projectId, user)
    await this.access.assertAnyPermission(user.userId, ['pm:project:update'])
    const existing = await this.prisma.bugProject.findFirst({ where: { projectId: BigInt(projectId), delFlag: '0' } })
    if (!existing) throw BusinessException.notFound('项目不存在')
    const updated = await this.prisma.bugProject.update({
      where: { projectId: BigInt(projectId) },
      data: this.progressData(dto, user.username),
    })
    await this.activity.record({
      projectId: updated.projectId,
      targetType: PM_ACTIVITY_TARGET.PROJECT,
      targetId: updated.projectId,
      action: PM_ACTIVITY_ACTION.UPDATE,
      operatorId: BigInt(user.userId),
      fromValue: existing.projectStage || '',
      toValue: updated.projectStage || '',
      remark: dto.remark || '更新项目进度',
    })
    return this.overview(projectId, user)
  }

  private progressData(dto: UpdateProjectProgressDto, username: string) {
    return {
      updateBy: username,
      ...(dto.projectStage !== undefined ? { projectStage: dto.projectStage } : {}),
      ...(dto.plannedStartTime !== undefined ? { plannedStartTime: dto.plannedStartTime ? new Date(dto.plannedStartTime) : null } : {}),
      ...(dto.plannedEndTime !== undefined ? { plannedEndTime: dto.plannedEndTime ? new Date(dto.plannedEndTime) : null } : {}),
      ...(dto.actualStartTime !== undefined ? { actualStartTime: dto.actualStartTime ? new Date(dto.actualStartTime) : null } : {}),
      ...(dto.actualEndTime !== undefined ? { actualEndTime: dto.actualEndTime ? new Date(dto.actualEndTime) : null } : {}),
      ...(dto.progress !== undefined ? { progress: Number(dto.progress) } : {}),
      ...(dto.riskLevel !== undefined ? { riskLevel: dto.riskLevel } : {}),
      ...(dto.riskNote !== undefined ? { riskNote: dto.riskNote } : {}),
    }
  }

  private async assertVisible(projectId: string, user: RequestUserLike) {
    const ids = await this.access.getVisibleProjectIds(user.userId)
    if (!ids.some((id) => id === BigInt(projectId))) throw BusinessException.forbidden('无权访问该项目')
  }
}

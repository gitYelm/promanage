import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { BugAccessService, type RequestUserLike } from '../bug-access.service'
import { BUG_STATUS } from '../constants/bug.constants'
import {
  MILESTONE_STATUS,
  PM_DASHBOARD_GROUPS,
  REQUIREMENT_STATUS,
} from '../constants/project-management.constants'
import { ProjectDashboardQueryDto } from '../dto/project-dashboard.dto'

@Injectable()
export class ProjectDashboardQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: BugAccessService,
  ) {}

  async projectWhere(user: RequestUserLike, query: ProjectDashboardQueryDto = {}) {
    const visibleIds = await this.access.getVisibleProjectIds(user.userId)
    const where: Prisma.BugProjectWhereInput = { delFlag: '0', projectId: { in: visibleIds } }
    if (query.projectId) {
      const id = BigInt(query.projectId)
      where.projectId = visibleIds.some((item) => item === id) ? id : { in: [] }
    }
    if (query.projectStage) where.projectStage = query.projectStage
    if (query.ownerId) where.ownerId = BigInt(query.ownerId)
    if (query.riskLevel) where.riskLevel = query.riskLevel
    return where
  }

  async visibleProjectIds(user: RequestUserLike, query: ProjectDashboardQueryDto = {}) {
    const projects = await this.prisma.bugProject.findMany({
      where: await this.projectWhere(user, query),
      select: { projectId: true },
    })
    return projects.map((project) => project.projectId)
  }

  requirementWhere(
    projectIds: bigint[],
    statuses?: readonly string[],
    query: ProjectDashboardQueryDto = {},
  ) {
    const where: Prisma.ProjectRequirementWhereInput = {
      delFlag: '0',
      projectId: { in: projectIds },
    }
    if (statuses) where.status = { in: [...statuses] }
    if (query.beginTime || query.endTime) {
      where.updateTime = {
        ...(query.beginTime ? { gte: new Date(query.beginTime) } : {}),
        ...(query.endTime ? { lte: new Date(query.endTime) } : {}),
      }
    }
    return where
  }

  bugWhere(
    projectIds: bigint[],
    statuses?: readonly string[],
    query: ProjectDashboardQueryDto = {},
  ) {
    const where: Prisma.BugTicketWhereInput = { delFlag: '0', projectId: { in: projectIds } }
    if (statuses) where.status = { in: [...statuses] }
    if (query.beginTime || query.endTime) {
      where.updateTime = {
        ...(query.beginTime ? { gte: new Date(query.beginTime) } : {}),
        ...(query.endTime ? { lte: new Date(query.endTime) } : {}),
      }
    }
    return where
  }

  async scopedBugWhere(
    user: RequestUserLike,
    projectIds: bigint[],
    statuses?: readonly string[],
    query: ProjectDashboardQueryDto = {},
  ): Promise<Prisma.BugTicketWhereInput> {
    return {
      AND: [
        await this.access.buildTicketWhere(user.userId),
        this.bugWhere(projectIds, statuses, query),
      ],
    }
  }

  async workCounts(
    user: RequestUserLike,
    projectIds: bigint[],
    query: ProjectDashboardQueryDto = {},
  ) {
    const blockerWhere: Prisma.BugTicketWhereInput = {
      delFlag: '0',
      projectId: { in: projectIds },
      severity: { in: ['blocker', 'critical'] },
      status: { not: BUG_STATUS.CLOSED },
    }
    const [
      currentRequirements,
      completedRequirements,
      pendingRequirements,
      currentBugs,
      completedBugs,
      pendingBugs,
      blockerBugs,
    ] = await Promise.all([
      this.prisma.projectRequirement.count({
        where: this.requirementWhere(projectIds, PM_DASHBOARD_GROUPS.requirementCurrent, query),
      }),
      this.prisma.projectRequirement.count({
        where: this.requirementWhere(projectIds, PM_DASHBOARD_GROUPS.requirementCompleted, query),
      }),
      this.prisma.projectRequirement.count({
        where: this.requirementWhere(projectIds, PM_DASHBOARD_GROUPS.requirementPending, query),
      }),
      this.prisma.bugTicket.count({
        where: await this.scopedBugWhere(user, projectIds, PM_DASHBOARD_GROUPS.bugCurrent, query),
      }),
      this.prisma.bugTicket.count({
        where: await this.scopedBugWhere(user, projectIds, PM_DASHBOARD_GROUPS.bugCompleted, query),
      }),
      this.prisma.bugTicket.count({
        where: await this.scopedBugWhere(user, projectIds, PM_DASHBOARD_GROUPS.bugPending, query),
      }),
      this.prisma.bugTicket.count({
        where: { AND: [await this.access.buildTicketWhere(user.userId), blockerWhere] },
      }),
    ])
    return {
      currentRequirements,
      completedRequirements,
      pendingRequirements,
      currentBugs,
      completedBugs,
      pendingBugs,
      blockerBugs,
    }
  }

  async requirementRows(
    projectIds: bigint[],
    statuses: readonly string[],
    query: ProjectDashboardQueryDto = {},
  ) {
    return this.prisma.projectRequirement.findMany({
      where: this.requirementWhere(projectIds, statuses, query),
      include: {
        project: true,
        module: true,
        owner: true,
        developer: true,
        iteration: true,
        milestone: true,
      },
      orderBy: [{ priority: 'asc' }, { plannedEndTime: 'asc' }, { requirementId: 'desc' }],
      take: Number(query.pageSize ?? 20),
    })
  }

  async bugRows(
    user: RequestUserLike,
    projectIds: bigint[],
    statuses: readonly string[],
    query: ProjectDashboardQueryDto = {},
  ) {
    return this.prisma.bugTicket.findMany({
      where: await this.scopedBugWhere(user, projectIds, statuses, query),
      include: { project: true, module: true, assignee: true },
      orderBy: [{ priority: 'asc' }, { dueTime: 'asc' }, { ticketId: 'desc' }],
      take: Number(query.pageSize ?? 20),
    })
  }

  progress(total: number, done: number) {
    return total > 0 ? Math.round((done / total) * 100) : 0
  }

  milestoneRisk(projectId: bigint) {
    const now = new Date()
    return this.prisma.projectMilestone.count({
      where: {
        projectId,
        delFlag: '0',
        status: {
          in: [MILESTONE_STATUS.PENDING, MILESTONE_STATUS.IN_PROGRESS, MILESTONE_STATUS.DELAYED],
        },
        targetDate: { lt: now },
      },
    })
  }

  requirementDoneStatuses() {
    return [REQUIREMENT_STATUS.ACCEPTED, REQUIREMENT_STATUS.RELEASED, REQUIREMENT_STATUS.CLOSED]
  }
}

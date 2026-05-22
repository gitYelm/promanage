import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { BugAccessService, type RequestUserLike } from '../bug-access.service'

@Injectable()
export class BugStatisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: BugAccessService,
  ) {}

  async overview(user: RequestUserLike) {
    const where = await this.access.buildTicketWhere(user.userId)
    const [total, byStatus, bySeverity, byProject, byAssignee] = await Promise.all([
      this.prisma.bugTicket.count({ where }),
      this.prisma.bugTicket.groupBy({ by: ['status'], where, _count: { status: true } }),
      this.prisma.bugTicket.groupBy({ by: ['severity'], where, _count: { severity: true } }),
      this.projectStats(where),
      this.assigneeStats(where),
    ])
    return { total, byStatus, bySeverity, byProject, byAssignee }
  }

  private async projectStats(where: Prisma.BugTicketWhereInput) {
    const grouped = await this.prisma.bugTicket.groupBy({
      by: ['projectId'],
      where,
      _count: { projectId: true },
      orderBy: { _count: { projectId: 'desc' } },
    })
    const projects = await this.prisma.bugProject.findMany({
      where: { projectId: { in: grouped.map((item) => item.projectId) } },
      select: { projectId: true, projectName: true },
    })
    return grouped.map((item) => ({
      projectId: item.projectId,
      projectName:
        projects.find((project) => project.projectId === item.projectId)?.projectName || '',
      _count: item._count,
    }))
  }

  private async assigneeStats(where: Prisma.BugTicketWhereInput) {
    const grouped = await this.prisma.bugTicket.groupBy({
      by: ['assigneeId'],
      where: { AND: [where, { assigneeId: { not: null } }] },
      _count: { assigneeId: true },
      orderBy: { _count: { assigneeId: 'desc' } },
    })
    const users = await this.prisma.sysUser.findMany({
      where: {
        userId: {
          in: grouped.map((item) => item.assigneeId).filter((id): id is bigint => Boolean(id)),
        },
      },
      select: { userId: true, userName: true, nickName: true },
    })
    return grouped.map((item) => ({
      assigneeId: item.assigneeId,
      user: users.find((user) => user.userId === item.assigneeId) || null,
      _count: item._count,
    }))
  }
}

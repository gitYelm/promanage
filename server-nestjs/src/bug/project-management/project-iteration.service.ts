import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { BusinessException } from '../../common/exceptions/business.exception'
import { BugAccessService, type RequestUserLike } from '../bug-access.service'
import { BUG_MEMBER_ROLE } from '../constants/bug.constants'
import { PM_ACTIVITY_ACTION, PM_ACTIVITY_TARGET } from '../constants/project-management.constants'
import {
  ITERATION_TRANSITIONS,
  findTransition,
} from '../constants/project-management-workflow.config'
import {
  CreateIterationDto,
  PmStatusActionDto,
  QueryIterationDto,
  UpdateIterationDto,
} from '../dto/project-management.dto'
import { RoleSecurityService } from '../security/role-security.service'
import { ProjectActivityService } from './project-activity.service'

@Injectable()
export class ProjectIterationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: BugAccessService,
    private readonly roleSecurity: RoleSecurityService,
    private readonly activity: ProjectActivityService,
  ) {}

  async list(query: QueryIterationDto, user: RequestUserLike) {
    const where = await this.where(query, user)
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.projectIteration.count({ where }),
      this.prisma.projectIteration.findMany({
        where,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: { project: true, owner: true },
        orderBy: this.buildOrderBy(query),
      }),
    ])
    return { total, rows }
  }

  async create(dto: CreateIterationDto, user: RequestUserLike) {
    await this.assertProjectVisible(user.userId, BigInt(dto.projectId))
    await this.assertOwnerAllowed(user, BigInt(dto.projectId), dto.ownerId)
    const row = await this.prisma.projectIteration.create({ data: this.createData(dto) })
    await this.activity.record({
      projectId: row.projectId,
      targetType: PM_ACTIVITY_TARGET.ITERATION,
      targetId: row.iterationId,
      action: PM_ACTIVITY_ACTION.CREATE,
      operatorId: BigInt(user.userId),
      toValue: row.status,
    })
    return row
  }

  async update(iterationId: string, dto: UpdateIterationDto, user: RequestUserLike) {
    const row = await this.ensure(iterationId, user)
    const projectId = dto.projectId ? BigInt(dto.projectId) : row.projectId
    await this.assertProjectVisible(user.userId, projectId)
    await this.assertOwnerAllowed(user, projectId, this.nextUserId(dto.ownerId, row.ownerId))
    const updated = await this.prisma.projectIteration.update({
      where: { iterationId: row.iterationId },
      data: this.updateData(dto),
    })
    await this.activity.record({
      projectId: updated.projectId,
      targetType: PM_ACTIVITY_TARGET.ITERATION,
      targetId: updated.iterationId,
      action: PM_ACTIVITY_ACTION.UPDATE,
      operatorId: BigInt(user.userId),
    })
    return updated
  }

  async action(iterationId: string, action: string, dto: PmStatusActionDto, user: RequestUserLike) {
    const row = await this.ensure(iterationId, user)
    const transition = findTransition(ITERATION_TRANSITIONS, action, row.status)
    if (!transition) throw BusinessException.denied('当前迭代状态不允许执行该操作')
    await this.access.assertAnyPermission(user.userId, transition.permissions)
    const updated = await this.prisma.projectIteration.update({
      where: { iterationId: row.iterationId },
      data: { status: transition.to },
    })
    await this.activity.record({
      projectId: updated.projectId,
      targetType: PM_ACTIVITY_TARGET.ITERATION,
      targetId: updated.iterationId,
      action: PM_ACTIVITY_ACTION.STATUS,
      operatorId: BigInt(user.userId),
      fromValue: row.status,
      toValue: updated.status,
      remark: dto.remark,
    })
    return updated
  }

  async remove(ids: string[], user: RequestUserLike) {
    const idList = ids.map((id) => BigInt(id))
    const rows = await this.prisma.projectIteration.findMany({
      where: { iterationId: { in: idList }, delFlag: '0' },
    })
    await Promise.all(rows.map((row) => this.assertProjectVisible(user.userId, row.projectId)))
    await this.prisma.projectIteration.updateMany({
      where: { iterationId: { in: idList } },
      data: { delFlag: '2' },
    })
    return {}
  }

  private async where(
    query: QueryIterationDto,
    user: RequestUserLike,
  ): Promise<Prisma.ProjectIterationWhereInput> {
    const projectIds = await this.access.getVisibleProjectIds(user.userId)
    const where: Prisma.ProjectIterationWhereInput = { delFlag: '0', projectId: { in: projectIds } }
    if (query.keyword) where.iterationName = { contains: query.keyword }
    if (query.projectId) {
      const id = BigInt(query.projectId)
      where.projectId = projectIds.some((item) => item === id) ? id : { in: [] }
    }
    if (query.status) where.status = query.status
    if (query.ownerId) where.ownerId = BigInt(query.ownerId)
    this.applyDateRange(where, 'startDate', query.startDateStart, query.startDateEnd, '开始日期')
    this.applyDateRange(where, 'endDate', query.endDateStart, query.endDateEnd, '结束日期')
    return where
  }

  private applyDateRange(
    where: Prisma.ProjectIterationWhereInput,
    field: 'startDate' | 'endDate',
    start?: string,
    end?: string,
    label?: string,
  ) {
    if (!start && !end) return
    const startDate = start ? this.parseDate(start, `${label}起`) : undefined
    const endDate = end ? this.parseDate(end, `${label}止`) : undefined
    if (startDate && endDate && startDate > endDate)
      throw BusinessException.invalidParams(`${label}起不能晚于${label}止`)
    const range = { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) }
    if (field === 'startDate') where.startDate = range
    else where.endDate = range
  }

  private parseDate(value: string, label: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) throw BusinessException.invalidParams(`${label}格式不正确`)
    return date
  }

  private buildOrderBy(
    query: QueryIterationDto,
  ): Prisma.ProjectIterationOrderByWithRelationInput[] {
    const direction =
      query.sortOrder === 'asc' ? 'asc' : query.sortOrder === 'desc' ? 'desc' : undefined
    const sortMap: Record<string, Prisma.ProjectIterationOrderByWithRelationInput> = {
      iterationName: { iterationName: direction },
      projectId: { projectId: direction },
      ownerId: { ownerId: direction },
      status: { status: direction },
      startDate: { startDate: direction },
      endDate: { endDate: direction },
    }
    if (direction && query.sortBy && sortMap[query.sortBy])
      return [sortMap[query.sortBy], { iterationId: 'desc' }]
    return [{ iterationId: 'desc' }]
  }

  private createData(dto: CreateIterationDto): Prisma.ProjectIterationUncheckedCreateInput {
    return {
      projectId: BigInt(dto.projectId),
      iterationName: dto.iterationName,
      goal: dto.goal ?? '',
      status: dto.status ?? 'planned',
      ownerId: this.bigIntOrUndefined(dto.ownerId),
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      summary: dto.summary ?? '',
      riskNote: dto.riskNote ?? '',
    }
  }

  private updateData(dto: UpdateIterationDto): Prisma.ProjectIterationUncheckedUpdateInput {
    const data: Prisma.ProjectIterationUncheckedUpdateInput = {}
    if (dto.projectId !== undefined) data.projectId = BigInt(dto.projectId)
    if (dto.iterationName !== undefined) data.iterationName = dto.iterationName
    if (dto.goal !== undefined) data.goal = dto.goal
    if (dto.status !== undefined) data.status = dto.status
    if (dto.ownerId !== undefined) data.ownerId = dto.ownerId ? BigInt(dto.ownerId) : null
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null
    if (dto.summary !== undefined) data.summary = dto.summary
    if (dto.riskNote !== undefined) data.riskNote = dto.riskNote
    return data
  }

  private async ensure(iterationId: string, user: RequestUserLike) {
    const row = await this.prisma.projectIteration.findFirst({
      where: { iterationId: BigInt(iterationId), delFlag: '0' },
    })
    if (!row) throw BusinessException.notFound('迭代不存在')
    await this.assertProjectVisible(user.userId, row.projectId)
    return row
  }

  private async assertProjectVisible(userId: string, projectId: bigint) {
    const ids = await this.access.getVisibleProjectIds(userId)
    if (!ids.some((id) => id === projectId)) throw BusinessException.forbidden('无权访问该项目')
  }

  private async assertOwnerAllowed(user: RequestUserLike, projectId: bigint, ownerId?: string) {
    await this.roleSecurity.assertAssignableProjectFieldUser({
      operatorId: user.userId,
      projectId,
      targetUserId: ownerId,
      allowedMemberRoles: Object.values(BUG_MEMBER_ROLE),
      label: '迭代负责人',
    })
  }

  private bigIntOrUndefined(value?: string) {
    return value ? BigInt(value) : undefined
  }
  private nextUserId(value: string | undefined, current: bigint | null) {
    if (value !== undefined) return value || undefined
    return current ? String(current) : undefined
  }
}

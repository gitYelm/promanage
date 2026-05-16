import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { BusinessException } from '../../common/exceptions/business.exception'
import { BugAccessService, type RequestUserLike } from '../bug-access.service'
import { MILESTONE_STATUS, PM_ACTIVITY_ACTION, PM_ACTIVITY_TARGET } from '../constants/project-management.constants'
import { MILESTONE_TRANSITIONS, findTransition } from '../constants/project-management-workflow.config'
import { CreateMilestoneDto, PmStatusActionDto, QueryMilestoneDto, UpdateMilestoneDto } from '../dto/project-management.dto'
import { ProjectActivityService } from './project-activity.service'

@Injectable()
export class ProjectMilestoneService {
  constructor(private readonly prisma: PrismaService, private readonly access: BugAccessService, private readonly activity: ProjectActivityService) {}

  async list(query: QueryMilestoneDto, user: RequestUserLike) {
    const where = await this.where(query, user)
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.projectMilestone.count({ where }),
      this.prisma.projectMilestone.findMany({ where, skip: (pageNum - 1) * pageSize, take: pageSize, include: { project: true, owner: true }, orderBy: { milestoneId: 'desc' } }),
    ])
    return { total, rows }
  }

  async create(dto: CreateMilestoneDto, user: RequestUserLike) {
    await this.assertProjectVisible(user.userId, BigInt(dto.projectId))
    const row = await this.prisma.projectMilestone.create({ data: this.createData(dto) })
    await this.activity.record({ projectId: row.projectId, targetType: PM_ACTIVITY_TARGET.MILESTONE, targetId: row.milestoneId, action: PM_ACTIVITY_ACTION.CREATE, operatorId: BigInt(user.userId), toValue: row.status })
    return row
  }

  async update(milestoneId: string, dto: UpdateMilestoneDto, user: RequestUserLike) {
    const row = await this.ensure(milestoneId, user)
    const updated = await this.prisma.projectMilestone.update({ where: { milestoneId: row.milestoneId }, data: this.updateData(dto) })
    await this.activity.record({ projectId: updated.projectId, targetType: PM_ACTIVITY_TARGET.MILESTONE, targetId: updated.milestoneId, action: PM_ACTIVITY_ACTION.UPDATE, operatorId: BigInt(user.userId) })
    return updated
  }

  async action(milestoneId: string, action: string, dto: PmStatusActionDto, user: RequestUserLike) {
    const row = await this.ensure(milestoneId, user)
    const transition = findTransition(MILESTONE_TRANSITIONS, action, row.status)
    if (!transition) throw BusinessException.denied('当前里程碑状态不允许执行该操作')
    await this.access.assertAnyPermission(user.userId, transition.permissions)
    const completedTime = transition.to === MILESTONE_STATUS.ACHIEVED ? new Date() : undefined
    const updated = await this.prisma.projectMilestone.update({ where: { milestoneId: row.milestoneId }, data: { status: transition.to, completedTime } })
    await this.activity.record({ projectId: updated.projectId, targetType: PM_ACTIVITY_TARGET.MILESTONE, targetId: updated.milestoneId, action: PM_ACTIVITY_ACTION.STATUS, operatorId: BigInt(user.userId), fromValue: row.status, toValue: updated.status, remark: dto.remark })
    return updated
  }

  async remove(ids: string[], user: RequestUserLike) {
    const idList = ids.map((id) => BigInt(id))
    const rows = await this.prisma.projectMilestone.findMany({ where: { milestoneId: { in: idList }, delFlag: '0' } })
    await Promise.all(rows.map((row) => this.assertProjectVisible(user.userId, row.projectId)))
    await this.prisma.projectMilestone.updateMany({ where: { milestoneId: { in: idList } }, data: { delFlag: '2' } })
    return {}
  }

  private async where(query: QueryMilestoneDto, user: RequestUserLike): Promise<Prisma.ProjectMilestoneWhereInput> {
    const projectIds = await this.access.getVisibleProjectIds(user.userId)
    const where: Prisma.ProjectMilestoneWhereInput = { delFlag: '0', projectId: { in: projectIds } }
    if (query.keyword) where.milestoneName = { contains: query.keyword }
    if (query.projectId) {
      const id = BigInt(query.projectId)
      where.projectId = projectIds.some((item) => item === id) ? id : { in: [] }
    }
    if (query.status) where.status = query.status
    return where
  }

  private createData(dto: CreateMilestoneDto): Prisma.ProjectMilestoneUncheckedCreateInput {
    return { projectId: BigInt(dto.projectId), milestoneName: dto.milestoneName, stage: dto.stage, status: dto.status ?? 'pending', ownerId: this.bigIntOrUndefined(dto.ownerId), targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined, completionCriteria: dto.completionCriteria ?? '', remark: dto.remark ?? '' }
  }

  private updateData(dto: UpdateMilestoneDto): Prisma.ProjectMilestoneUncheckedUpdateInput {
    const data: Prisma.ProjectMilestoneUncheckedUpdateInput = {}
    if (dto.projectId !== undefined) data.projectId = BigInt(dto.projectId)
    if (dto.milestoneName !== undefined) data.milestoneName = dto.milestoneName
    if (dto.stage !== undefined) data.stage = dto.stage
    if (dto.status !== undefined) data.status = dto.status
    if (dto.ownerId !== undefined) data.ownerId = dto.ownerId ? BigInt(dto.ownerId) : null
    if (dto.targetDate !== undefined) data.targetDate = dto.targetDate ? new Date(dto.targetDate) : null
    if (dto.completionCriteria !== undefined) data.completionCriteria = dto.completionCriteria
    if (dto.remark !== undefined) data.remark = dto.remark
    return data
  }

  private async ensure(milestoneId: string, user: RequestUserLike) {
    const row = await this.prisma.projectMilestone.findFirst({ where: { milestoneId: BigInt(milestoneId), delFlag: '0' } })
    if (!row) throw BusinessException.notFound('里程碑不存在')
    await this.assertProjectVisible(user.userId, row.projectId)
    return row
  }

  private async assertProjectVisible(userId: string, projectId: bigint) {
    const ids = await this.access.getVisibleProjectIds(userId)
    if (!ids.some((id) => id === projectId)) throw BusinessException.forbidden('无权访问该项目')
  }

  private bigIntOrUndefined(value?: string) { return value ? BigInt(value) : undefined }
}

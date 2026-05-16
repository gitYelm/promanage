import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../../common/logger/logger.service'
import { BusinessException } from '../../common/exceptions/business.exception'
import { PM_ACTIVITY_ACTION, PM_ACTIVITY_TARGET, REQUIREMENT_STATUS } from '../constants/project-management.constants'
import { REQUIREMENT_TRANSITIONS, findTransition } from '../constants/project-management-workflow.config'
import { BugAccessService, type RequestUserLike } from '../bug-access.service'
import { ProjectActivityService } from './project-activity.service'
import { CreateRequirementDto, QueryRequirementDto, RequirementActionDto, UpdateRequirementDto } from '../dto/project-management.dto'

@Injectable()
export class ProjectRequirementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly access: BugAccessService,
    private readonly activity: ProjectActivityService,
  ) {}

  async list(query: QueryRequirementDto, user: RequestUserLike) {
    const where = await this.buildWhere(query, user)
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.projectRequirement.count({ where }),
      this.prisma.projectRequirement.findMany({
        where,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: this.include(),
        orderBy: { requirementId: 'desc' },
      }),
    ])
    return { total, rows }
  }

  async detail(requirementId: string, user: RequestUserLike) {
    const requirement = await this.prisma.projectRequirement.findFirst({
      where: { requirementId: BigInt(requirementId), delFlag: '0' },
      include: { ...this.include(), tickets: { where: { delFlag: '0' } } },
    })
    if (!requirement) throw BusinessException.notFound('需求不存在')
    await this.assertProjectVisible(user.userId, requirement.projectId)
    return requirement
  }

  async create(dto: CreateRequirementDto, user: RequestUserLike) {
    await this.assertProjectVisible(user.userId, BigInt(dto.projectId))
    const count = await this.prisma.projectRequirement.count({ where: { projectId: BigInt(dto.projectId) } })
    const project = await this.prisma.bugProject.findUnique({ where: { projectId: BigInt(dto.projectId) } })
    if (!project) throw BusinessException.notFound('项目不存在')
    const requirement = await this.prisma.projectRequirement.create({
      data: this.createData(dto, `${project.projectKey}-REQ-${String(count + 1).padStart(4, '0')}`, user),
    })
    await this.activity.record({ projectId: requirement.projectId, targetType: PM_ACTIVITY_TARGET.REQUIREMENT, targetId: requirement.requirementId, action: PM_ACTIVITY_ACTION.CREATE, operatorId: BigInt(user.userId), toValue: requirement.status })
    this.logger.log(`创建项目需求: ${requirement.requirementNo}`, 'ProjectRequirementService')
    return this.detail(String(requirement.requirementId), user)
  }

  async update(requirementId: string, dto: UpdateRequirementDto, user: RequestUserLike) {
    const existing = await this.ensure(requirementId, user)
    const updated = await this.prisma.projectRequirement.update({
      where: { requirementId: existing.requirementId },
      data: this.updateData(dto, user),
    })
    await this.activity.record({ projectId: updated.projectId, targetType: PM_ACTIVITY_TARGET.REQUIREMENT, targetId: updated.requirementId, action: PM_ACTIVITY_ACTION.UPDATE, operatorId: BigInt(user.userId), remark: '更新需求信息' })
    return this.detail(requirementId, user)
  }

  async action(requirementId: string, action: string, dto: RequirementActionDto, user: RequestUserLike) {
    const existing = await this.ensure(requirementId, user)
    const transition = findTransition(REQUIREMENT_TRANSITIONS, action, existing.status)
    if (!transition) throw BusinessException.denied('当前需求状态不允许执行该操作')
    await this.access.assertAnyPermission(user.userId, transition.permissions)
    const updated = await this.prisma.projectRequirement.update({
      where: { requirementId: existing.requirementId },
      data: { status: transition.to, updateBy: user.username, ...(transition.to === REQUIREMENT_STATUS.ACCEPTED || transition.to === REQUIREMENT_STATUS.RELEASED || transition.to === REQUIREMENT_STATUS.CLOSED ? { actualEndTime: new Date() } : {}) },
    })
    await this.activity.record({ projectId: updated.projectId, targetType: PM_ACTIVITY_TARGET.REQUIREMENT, targetId: updated.requirementId, action: PM_ACTIVITY_ACTION.STATUS, operatorId: BigInt(user.userId), fromValue: existing.status, toValue: updated.status, remark: dto.remark })
    return this.detail(requirementId, user)
  }

  async remove(ids: string[], user: RequestUserLike) {
    const idList = ids.map((id) => BigInt(id))
    const rows = await this.prisma.projectRequirement.findMany({ where: { requirementId: { in: idList }, delFlag: '0' } })
    await Promise.all(rows.map((row) => this.assertProjectVisible(user.userId, row.projectId)))
    await this.prisma.projectRequirement.updateMany({ where: { requirementId: { in: idList } }, data: { delFlag: '2', updateBy: user.username } })
    return {}
  }

  private include() {
    return { project: true, module: true, owner: true, developer: true, tester: true, iteration: true, milestone: true, version: true }
  }

  private async buildWhere(query: QueryRequirementDto, user: RequestUserLike): Promise<Prisma.ProjectRequirementWhereInput> {
    const projectIds = await this.access.getVisibleProjectIds(user.userId)
    const where: Prisma.ProjectRequirementWhereInput = { delFlag: '0', projectId: { in: projectIds } }
    if (query.keyword) where.OR = [{ title: { contains: query.keyword } }, { requirementNo: { contains: query.keyword } }]
    if (query.projectId) {
      const id = BigInt(query.projectId)
      where.projectId = projectIds.some((item) => item === id) ? id : { in: [] }
    }
    if (query.moduleId) where.moduleId = BigInt(query.moduleId)
    if (query.status) where.status = query.status
    if (query.priority) where.priority = query.priority
    if (query.ownerId) where.ownerId = BigInt(query.ownerId)
    if (query.developerId) where.developerId = BigInt(query.developerId)
    if (query.iterationId) where.iterationId = BigInt(query.iterationId)
    return where
  }

  private createData(dto: CreateRequirementDto, requirementNo: string, user: RequestUserLike): Prisma.ProjectRequirementUncheckedCreateInput {
    return { requirementNo, title: dto.title, projectId: BigInt(dto.projectId), moduleId: this.bigIntOrUndefined(dto.moduleId), type: dto.type ?? 'feature', source: dto.source ?? '', priority: dto.priority ?? 'medium', valueScore: dto.valueScore ?? 0, difficultyScore: dto.difficultyScore ?? 0, ownerId: this.bigIntOrUndefined(dto.ownerId), developerId: this.bigIntOrUndefined(dto.developerId), testerId: this.bigIntOrUndefined(dto.testerId), iterationId: this.bigIntOrUndefined(dto.iterationId), milestoneId: this.bigIntOrUndefined(dto.milestoneId), versionId: this.bigIntOrUndefined(dto.versionId), plannedStartTime: dto.plannedStartTime ? new Date(dto.plannedStartTime) : undefined, plannedEndTime: dto.plannedEndTime ? new Date(dto.plannedEndTime) : undefined, description: dto.description ?? '', acceptanceCriteria: dto.acceptanceCriteria ?? '', remark: dto.remark ?? '', createBy: user.username }
  }

  private updateData(dto: UpdateRequirementDto, user: RequestUserLike): Prisma.ProjectRequirementUncheckedUpdateInput {
    const data: Prisma.ProjectRequirementUncheckedUpdateInput = { updateBy: user.username }
    for (const key of ['title', 'type', 'source', 'priority', 'description', 'acceptanceCriteria', 'remark'] as const) if (dto[key] !== undefined) data[key] = dto[key]
    if (dto.projectId !== undefined) data.projectId = BigInt(dto.projectId)
    if (dto.moduleId !== undefined) data.moduleId = this.bigIntOrNull(dto.moduleId)
    if (dto.valueScore !== undefined) data.valueScore = dto.valueScore
    if (dto.difficultyScore !== undefined) data.difficultyScore = dto.difficultyScore
    if (dto.ownerId !== undefined) data.ownerId = this.bigIntOrNull(dto.ownerId)
    if (dto.developerId !== undefined) data.developerId = this.bigIntOrNull(dto.developerId)
    if (dto.testerId !== undefined) data.testerId = this.bigIntOrNull(dto.testerId)
    if (dto.iterationId !== undefined) data.iterationId = this.bigIntOrNull(dto.iterationId)
    if (dto.milestoneId !== undefined) data.milestoneId = this.bigIntOrNull(dto.milestoneId)
    if (dto.versionId !== undefined) data.versionId = this.bigIntOrNull(dto.versionId)
    if (dto.plannedStartTime !== undefined) data.plannedStartTime = dto.plannedStartTime ? new Date(dto.plannedStartTime) : null
    if (dto.plannedEndTime !== undefined) data.plannedEndTime = dto.plannedEndTime ? new Date(dto.plannedEndTime) : null
    return data
  }

  private async ensure(requirementId: string, user: RequestUserLike) {
    const row = await this.prisma.projectRequirement.findFirst({ where: { requirementId: BigInt(requirementId), delFlag: '0' } })
    if (!row) throw BusinessException.notFound('需求不存在')
    await this.assertProjectVisible(user.userId, row.projectId)
    return row
  }

  private async assertProjectVisible(userId: string, projectId: bigint) {
    const ids = await this.access.getVisibleProjectIds(userId)
    if (!ids.some((id) => id === projectId)) throw BusinessException.forbidden('无权访问该项目')
  }

  private bigIntOrUndefined(value?: string) { return value ? BigInt(value) : undefined }
  private bigIntOrNull(value?: string) { return value ? BigInt(value) : null }
}

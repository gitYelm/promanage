import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../../common/logger/logger.service'
import { BusinessException } from '../../common/exceptions/business.exception'
import { ErrorCode } from '../../common/enums/error-code.enum'
import { BUG_ACTION, BUG_MEMBER_ROLE, BUG_PENDING_STATUSES, BUG_STATUS, type BugAction } from '../constants/bug.constants'
import { getBugTransition, getBugTransitions } from '../constants/bug-workflow.config'
import { buildBugNo } from '../utils/bug-number.util'
import { BugAccessService, type RequestUserLike } from '../bug-access.service'
import { BugNotificationService } from '../bug-notification.service'
import { RoleSecurityService } from '../security/role-security.service'
import {
  BugActionDto,
  CreateBugCommentDto,
  CreateBugTicketDto,
  QueryBugTicketDto,
  UpdateBugTicketDto,
} from '../dto/ticket.dto'

@Injectable()
export class BugTicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly access: BugAccessService,
    private readonly bugNotification: BugNotificationService,
    private readonly roleSecurity: RoleSecurityService,
  ) {}

  async list(query: QueryBugTicketDto, user: RequestUserLike) {
    const baseWhere = await this.access.buildTicketWhere(user.userId, query.mine === 'true')
    const where: Prisma.BugTicketWhereInput = { AND: [baseWhere, this.buildTicketFilters(query)] }
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.bugTicket.count({ where }),
      this.prisma.bugTicket.findMany({
        where,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: this.ticketInclude(),
        orderBy: this.buildOrderBy(query),
      }),
    ])
    const rowsWithActions = await Promise.all(
      rows.map(async (row) => ({ ...row, availableActions: await this.availableActions(row, user) })),
    )
    return {
      total,
      rows: rowsWithActions,
    }
  }

  async pendingCount(user: RequestUserLike) {
    const where: Prisma.BugTicketWhereInput = {
      AND: [
        await this.access.buildTicketWhere(user.userId, true),
        { status: { in: [...BUG_PENDING_STATUSES] } },
      ],
    }
    const tickets = await this.prisma.bugTicket.findMany({
      where,
      select: { ticketId: true, projectId: true, submitterId: true, assigneeId: true, verifierId: true, status: true },
    })
    const actionable = await Promise.all(tickets.map(async (ticket) => (await this.availableActions(ticket, user)).length > 0))
    return { count: actionable.filter(Boolean).length }
  }

  async detail(ticketId: string, user: RequestUserLike) {
    await this.access.assertTicketVisible(user.userId, ticketId)
    const ticket = await this.prisma.bugTicket.findUnique({
      where: { ticketId: BigInt(ticketId) },
      include: {
        ...this.ticketInclude(),
        comments: { where: { delFlag: '0' }, include: { user: true }, orderBy: { commentId: 'asc' } },
        attachments: { where: { delFlag: '0' }, include: { uploader: true }, orderBy: { attachmentId: 'asc' } },
        histories: { include: { operator: true }, orderBy: { historyId: 'asc' } },
      },
    })
    if (!ticket) throw new BusinessException(ErrorCode.BUG_NOT_FOUND, 'Bug 不存在')
    return {
      ...ticket,
      canEdit: await this.canEditTicket(ticket, user),
      availableActions: await this.availableActions(ticket, user),
    }
  }

  async create(dto: CreateBugTicketDto, user: RequestUserLike) {
    const project = await this.resolveCreateProject(dto.projectId, user)
    if (await this.access.isReadonlyProjectViewer(user.userId, project.projectId)) {
      throw BusinessException.forbidden('观察者只能只读查看项目，不能提交缺陷')
    }
    await this.assertRelations(
      String(project.projectId),
      dto.moduleId,
      dto.versionId,
      dto.requirementId,
      dto.iterationId,
      dto.milestoneId,
    )
    const sequence = await this.prisma.bugTicket.count({ where: { projectId: project.projectId } })
    const ticket = await this.prisma.bugTicket.create({
      data: this.createTicketData(dto, project, buildBugNo(project.projectKey, sequence + 1), user),
    })
    await this.bindAttachments(ticket.ticketId, dto.attachmentIds, BigInt(user.userId))
    await this.addHistory(ticket.ticketId, BigInt(user.userId), BUG_ACTION.CREATE, '', ticket.status)
    this.logger.log(`创建 Bug: ${ticket.ticketNo}`, 'BugTicketService')
    await this.bugNotification.notifyCreated(ticket, user)
    return this.detail(String(ticket.ticketId), user)
  }

  async update(ticketId: string, dto: UpdateBugTicketDto, user: RequestUserLike) {
    const ticket = await this.ensureTicket(ticketId)
    await this.access.assertTicketVisible(user.userId, ticketId)
    if (!(await this.canEditTicket(ticket, user))) {
      throw BusinessException.denied('当前状态不允许修改 Bug 核心信息')
    }
    if (dto.projectId && dto.projectId !== String(ticket.projectId)) await this.assertProjectVisible(dto.projectId, user)
    await this.assertRelations(
      dto.projectId ?? String(ticket.projectId),
      this.resolveNextRelationId(dto.moduleId, ticket.moduleId),
      this.resolveNextRelationId(dto.versionId, ticket.versionId),
      this.resolveNextRelationId(dto.requirementId, ticket.requirementId),
      this.resolveNextRelationId(dto.iterationId, ticket.iterationId),
      this.resolveNextRelationId(dto.milestoneId, ticket.milestoneId),
    )
    const result = await this.prisma.bugTicket.update({
      where: { ticketId: BigInt(ticketId) },
      data: this.updateTicketData(dto, user),
    })
    await this.bindAttachments(result.ticketId, dto.attachmentIds, BigInt(user.userId))
    await this.addHistory(result.ticketId, BigInt(user.userId), BUG_ACTION.UPDATE, '', '', '更新 Bug 信息')
    return this.detail(ticketId, user)
  }

  async action(ticketId: string, action: BugAction, dto: BugActionDto, user: RequestUserLike) {
    const ticket = await this.ensureTicket(ticketId)
    await this.access.assertTicketVisible(user.userId, ticketId)
    const transition = getBugTransition(action, ticket.status)
    if (!transition) throw new BusinessException(ErrorCode.BUG_STATUS_DENIED, '当前状态不允许执行该操作')
    await this.access.assertTicketActionAllowed(user.userId, transition.permissions, ticket, action)
    if (action === BUG_ACTION.DUPLICATE && !dto.duplicateOfId) throw BusinessException.invalidParams('重复问题必须关联原 Bug')

    const data: Prisma.BugTicketUncheckedUpdateInput = { status: transition.to, updateBy: user.username }
    if (action === BUG_ACTION.ASSIGN) {
      const assigneeId = this.requiredBigInt(dto.assigneeId, '负责人必填')
      await this.roleSecurity.assertAssignableProjectFieldUser({
        operatorId: user.userId,
        projectId: ticket.projectId,
        targetUserId: String(assigneeId),
        allowedMemberRoles: [BUG_MEMBER_ROLE.DEVELOPER],
        label: '开发负责人',
      })
      data.assigneeId = assigneeId
    }
    if (dto.dueTime) data.dueTime = new Date(dto.dueTime)
    if (action === BUG_ACTION.SUBMIT_VERIFY) data.fixNote = dto.remark
    if (
      action === BUG_ACTION.VERIFY_PASS ||
      action === BUG_ACTION.VERIFY_FAIL ||
      action === BUG_ACTION.CLOSE
    ) {
      data.verifyNote = dto.remark
      data.verifierId = BigInt(user.userId)
    }
    if (action === BUG_ACTION.DUPLICATE) data.duplicateOfId = BigInt(dto.duplicateOfId as string)

    const updated = await this.prisma.bugTicket.update({ where: { ticketId: ticket.ticketId }, data })
    await this.addHistory(ticket.ticketId, BigInt(user.userId), action, ticket.status, updated.status, dto.remark)
    await this.bugNotification.notifyAction(ticket, updated, action, user, dto.remark)
    return this.detail(ticketId, user)
  }

  async comment(ticketId: string, dto: CreateBugCommentDto, user: RequestUserLike) {
    await this.access.assertTicketVisible(user.userId, ticketId)
    const comment = await this.prisma.bugComment.create({
      data: { ticketId: BigInt(ticketId), userId: BigInt(user.userId), content: dto.content },
    })
    await this.bindAttachments(BigInt(ticketId), dto.attachmentIds, BigInt(user.userId), comment.commentId)
    await this.addHistory(BigInt(ticketId), BigInt(user.userId), BUG_ACTION.COMMENT, '', '', dto.content)
    await this.bugNotification.notifyComment(BigInt(ticketId), user, dto.content)
    return comment
  }

  async remove(ticketIds: string[], user: RequestUserLike) {
    if (!(await this.access.isAdmin(user.userId))) throw BusinessException.forbidden('只有超级管理员可以删除 Bug')
    const where = await this.access.buildTicketWhere(user.userId)
    const ids = ticketIds.map((id) => BigInt(id))
    const tickets = await this.prisma.bugTicket.findMany({
      where: { AND: [where, { ticketId: { in: ids } }] },
      select: { ticketId: true, status: true },
    })
    await this.prisma.bugTicket.updateMany({
      where: { ticketId: { in: tickets.map((item) => item.ticketId) } },
      data: { delFlag: '2', updateBy: user.username },
    })
    await Promise.all(
      tickets.map((item) =>
        this.addHistory(item.ticketId, BigInt(user.userId), BUG_ACTION.DELETE, item.status, 'deleted', '逻辑删除 Bug'),
      ),
    )
    return {}
  }

  private ticketInclude() {
    return { project: true, module: true, version: true, requirement: true, iteration: true, milestone: true, submitter: true, assignee: true, verifier: true }
  }

  private buildTicketFilters(query: QueryBugTicketDto): Prisma.BugTicketWhereInput {
    const where: Prisma.BugTicketWhereInput = {}
    if (query.keyword) {
      where.OR = [{ title: { contains: query.keyword } }, { ticketNo: { contains: query.keyword } }]
    }
    if (query.ticketNo) where.ticketNo = { contains: query.ticketNo }
    if (query.title) where.title = { contains: query.title }
    if (query.projectId) where.projectId = { equals: this.parseBigInt(query.projectId, '项目ID格式不正确') }
    if (query.moduleId) where.moduleId = this.parseBigInt(query.moduleId, '模块ID格式不正确')
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status
    if (query.pending === 'true') where.status = { in: [...BUG_PENDING_STATUSES] }
    if (query.priority) where.priority = query.priority
    if (query.severity) where.severity = query.severity
    if (query.environment) where.environment = query.environment
    if (query.deviceInfo) where.deviceInfo = { contains: query.deviceInfo }
    if (query.assigneeId) where.assigneeId = this.parseBigInt(query.assigneeId, '负责人ID格式不正确')
    if (query.submitterId) where.submitterId = this.parseBigInt(query.submitterId, '提交人ID格式不正确')
    if (query.verifierId) where.verifierId = this.parseBigInt(query.verifierId, '验证人ID格式不正确')
    if (query.requirementId) where.requirementId = this.parseBigInt(query.requirementId, '需求ID格式不正确')
    if (query.iterationId) where.iterationId = this.parseBigInt(query.iterationId, '迭代ID格式不正确')
    if (query.milestoneId) where.milestoneId = this.parseBigInt(query.milestoneId, '里程碑ID格式不正确')
    this.applyDateRange(where, 'createTime', query.beginTime, query.endTime, '创建时间')
    this.applyDateRange(where, 'dueTime', query.dueTimeStart, query.dueTimeEnd, '预计完成时间')
    this.applyDateRange(where, 'updateTime', query.updateTimeStart, query.updateTimeEnd, '更新时间')
    return where
  }

  private applyDateRange(
    where: Prisma.BugTicketWhereInput,
    field: 'createTime' | 'dueTime' | 'updateTime',
    start: string | undefined,
    end: string | undefined,
    label: string,
  ) {
    if (!start && !end) return
    const startDate = start ? this.parseQueryDate(start, `${label}开始值`) : undefined
    const endDate = end ? this.parseQueryDate(end, `${label}结束值`) : undefined
    if (startDate && endDate && startDate > endDate) {
      throw BusinessException.invalidParams(`${label}开始值不能晚于结束值`)
    }
    const range = { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) }
    if (field === 'createTime') where.createTime = range
    else if (field === 'dueTime') where.dueTime = range
    else where.updateTime = range
  }

  private parseQueryDate(value: string, label: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) throw BusinessException.invalidParams(`${label}格式不正确`)
    return date
  }

  private buildOrderBy(query: QueryBugTicketDto): Prisma.BugTicketOrderByWithRelationInput[] {
    const direction = query.sortOrder === 'asc' ? 'asc' : query.sortOrder === 'desc' ? 'desc' : undefined
    const sortMap: Record<string, Prisma.BugTicketOrderByWithRelationInput> = {
      ticketNo: { ticketNo: direction },
      projectId: { projectId: direction },
      moduleId: { moduleId: direction },
      status: { status: direction },
      severity: { severity: direction },
      priority: { priority: direction },
      assigneeId: { assigneeId: direction },
      createTime: { createTime: direction },
      dueTime: { dueTime: direction },
      updateTime: { updateTime: direction },
    }
    if (direction && query.sortBy && sortMap[query.sortBy]) return [sortMap[query.sortBy], { ticketId: 'desc' }]
    return [{ ticketId: 'desc' }]
  }

  private createTicketData(
    dto: CreateBugTicketDto,
    project: { projectId: bigint },
    ticketNo: string,
    user: RequestUserLike,
  ): Prisma.BugTicketUncheckedCreateInput {
    return {
      title: dto.title,
      projectId: project.projectId,
      moduleId: dto.moduleId ? BigInt(dto.moduleId) : undefined,
      versionId: dto.versionId ? BigInt(dto.versionId) : undefined,
      type: dto.type,
      severity: dto.severity,
      priority: dto.priority,
      description: dto.description ?? '',
      reproduceSteps: dto.reproduceSteps ?? '',
      expectedResult: dto.expectedResult ?? '',
      actualResult: dto.actualResult ?? '',
      environment: dto.environment ?? '',
      deviceInfo: dto.deviceInfo ?? '',
      requirementId: dto.requirementId ? BigInt(dto.requirementId) : undefined,
      iterationId: dto.iterationId ? BigInt(dto.iterationId) : undefined,
      milestoneId: dto.milestoneId ? BigInt(dto.milestoneId) : undefined,
      ticketNo,
      status: BUG_STATUS.PENDING_CONFIRM,
      submitterId: BigInt(user.userId),
      createBy: user.username,
    }
  }

  private updateTicketData(dto: UpdateBugTicketDto, user: RequestUserLike): Prisma.BugTicketUncheckedUpdateInput {
    const data: Prisma.BugTicketUncheckedUpdateInput = { updateBy: user.username }
    if (dto.title !== undefined) data.title = dto.title
    if (dto.projectId !== undefined) data.projectId = BigInt(dto.projectId)
    if (dto.moduleId !== undefined) data.moduleId = dto.moduleId ? BigInt(dto.moduleId) : null
    if (dto.versionId !== undefined) data.versionId = dto.versionId ? BigInt(dto.versionId) : null
    if (dto.type !== undefined) data.type = dto.type
    if (dto.severity !== undefined) data.severity = dto.severity
    if (dto.priority !== undefined) data.priority = dto.priority
    if (dto.description !== undefined) data.description = dto.description
    if (dto.reproduceSteps !== undefined) data.reproduceSteps = dto.reproduceSteps
    if (dto.expectedResult !== undefined) data.expectedResult = dto.expectedResult
    if (dto.actualResult !== undefined) data.actualResult = dto.actualResult
    if (dto.environment !== undefined) data.environment = dto.environment
    if (dto.deviceInfo !== undefined) data.deviceInfo = dto.deviceInfo
    if (dto.requirementId !== undefined) data.requirementId = dto.requirementId ? BigInt(dto.requirementId) : null
    if (dto.iterationId !== undefined) data.iterationId = dto.iterationId ? BigInt(dto.iterationId) : null
    if (dto.milestoneId !== undefined) data.milestoneId = dto.milestoneId ? BigInt(dto.milestoneId) : null
    return data
  }

  private resolveNextRelationId(value: string | undefined, current: bigint | null) {
    if (value !== undefined) return value
    return current ? String(current) : undefined
  }

  private async canEditTicket(ticket: { status: string; projectId: bigint; submitterId: bigint }, user: RequestUserLike) {
    if (await this.access.isAdmin(user.userId)) return true
    if (await this.access.isProjectReviewer(user.userId, ticket.projectId)) return true
    return ticket.status === BUG_STATUS.PENDING_CONFIRM && ticket.submitterId === BigInt(user.userId)
  }

  private async availableActions(
    ticket: Parameters<BugAccessService['assertTicketActionAllowed']>[2],
    user: RequestUserLike,
  ) {
    const checks = await Promise.all(
      getBugTransitions(ticket.status).map(async (item) => ({
        item,
        allowed: await this.access.canTicketAction(user.userId, item.permissions, ticket, item.action),
      })),
    )
    return checks.filter((check) => check.allowed).map((check) => check.item)
  }

  private async assertRelations(
    projectId: string,
    moduleId?: string,
    versionId?: string,
    requirementId?: string,
    iterationId?: string,
    milestoneId?: string,
  ) {
    if (moduleId) await this.assertModule(projectId, moduleId)
    if (versionId) await this.assertVersion(projectId, versionId)
    if (requirementId) await this.assertRequirement(projectId, requirementId)
    if (iterationId) await this.assertIteration(projectId, iterationId)
    if (milestoneId) await this.assertMilestone(projectId, milestoneId)
  }

  private async resolveCreateProject(projectId: string | undefined, user: RequestUserLike) {
    const normalizedProjectId = projectId?.trim()
    const visibleProjectIds = await this.access.getVisibleProjectIds(user.userId)
    const where: Prisma.BugProjectWhereInput = { delFlag: '0', status: '0' }
    if (normalizedProjectId) {
      const parsedProjectId = this.parseBigInt(normalizedProjectId, '项目ID格式不正确')
      if (!visibleProjectIds.some((id) => id === parsedProjectId)) throw BusinessException.forbidden('无权访问该项目')
      where.projectId = parsedProjectId
    } else {
      where.projectId = { in: visibleProjectIds }
    }
    const project = await this.prisma.bugProject.findFirst({ where, orderBy: { projectId: 'asc' } })
    if (!project) {
      const message = normalizedProjectId ? '项目不存在或已停用' : '没有可用项目，请先创建项目'
      throw new BusinessException(ErrorCode.BUG_PROJECT_NOT_FOUND, message)
    }
    return project
  }

  private async assertModule(projectId: string, moduleId: string) {
    const module = await this.prisma.bugProjectModule.findFirst({
      where: { moduleId: BigInt(moduleId), projectId: BigInt(projectId), delFlag: '0' },
    })
    if (!module) throw BusinessException.invalidParams('模块不属于所选项目')
  }

  private async assertVersion(projectId: string, versionId: string) {
    const version = await this.prisma.bugProjectVersion.findFirst({
      where: { versionId: BigInt(versionId), projectId: BigInt(projectId), delFlag: '0' },
    })
    if (!version) throw BusinessException.invalidParams('版本不属于所选项目')
  }

  private async assertRequirement(projectId: string, requirementId: string) {
    const requirement = await this.prisma.projectRequirement.findFirst({
      where: { requirementId: BigInt(requirementId), projectId: BigInt(projectId), delFlag: '0' },
    })
    if (!requirement) throw BusinessException.invalidParams('需求不属于所选项目')
  }

  private async assertIteration(projectId: string, iterationId: string) {
    const iteration = await this.prisma.projectIteration.findFirst({
      where: { iterationId: BigInt(iterationId), projectId: BigInt(projectId), delFlag: '0' },
    })
    if (!iteration) throw BusinessException.invalidParams('迭代不属于所选项目')
  }

  private async assertMilestone(projectId: string, milestoneId: string) {
    const milestone = await this.prisma.projectMilestone.findFirst({
      where: { milestoneId: BigInt(milestoneId), projectId: BigInt(projectId), delFlag: '0' },
    })
    if (!milestone) throw BusinessException.invalidParams('里程碑不属于所选项目')
  }

  private async assertProjectVisible(projectId: string, user: RequestUserLike) {
    const projectIds = await this.access.getVisibleProjectIds(user.userId)
    const parsedProjectId = this.parseBigInt(projectId, '项目ID格式不正确')
    if (!projectIds.some((id) => id === parsedProjectId)) throw BusinessException.forbidden('无权访问该项目')
  }

  private async ensureTicket(ticketId: string) {
    const ticket = await this.prisma.bugTicket.findFirst({
      where: { ticketId: BigInt(ticketId), delFlag: '0' },
    })
    if (!ticket) throw new BusinessException(ErrorCode.BUG_NOT_FOUND, 'Bug 不存在')
    return ticket
  }

  private async bindAttachments(
    ticketId: bigint,
    attachmentIds?: string[],
    uploaderId?: bigint,
    commentId?: bigint,
  ) {
    if (!attachmentIds?.length) return
    await this.prisma.bugAttachment.updateMany({
      where: { attachmentId: { in: attachmentIds.map((id) => BigInt(id)) }, uploaderId, delFlag: '0' },
      data: { ticketId, commentId },
    })
  }

  private async addHistory(
    ticketId: bigint,
    operatorId: bigint,
    action: string,
    fromValue?: string,
    toValue?: string,
    remark?: string,
  ) {
    await this.prisma.bugHistory.create({
      data: { ticketId, operatorId, action, fromValue, toValue, remark },
    })
  }

  private requiredBigInt(value: string | undefined, message: string): bigint {
    if (!value) throw BusinessException.invalidParams(message)
    return this.parseBigInt(value, message)
  }

  private parseBigInt(value: string, message: string): bigint {
    if (!/^\d+$/.test(value)) throw BusinessException.invalidParams(message)
    return BigInt(value)
  }
}

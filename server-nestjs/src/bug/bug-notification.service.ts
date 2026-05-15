import { Injectable } from '@nestjs/common'
import { BUG_ACTION, BUG_MEMBER_ROLE } from './constants/bug.constants'
import { NOTIFICATION_BUSINESS_TYPE, NOTIFICATION_TYPE } from '../system/notification/constants/notification.constants'
import { NotificationService } from '../system/notification/notification.service'
import { PrismaService } from '../prisma/prisma.service'
import { LoggerService } from '../common/logger/logger.service'
import { bugStatusNotificationType } from './constants/bug-notification.config'
import type { RequestUserLike } from './bug-access.service'

interface BugNotificationTicket {
  ticketId: bigint
  ticketNo: string
  title: string
  projectId: bigint
  moduleId: bigint | null
  submitterId: bigint
  assigneeId: bigint | null
  verifierId: bigint | null
  priority: string
  severity: string
  status: string
}

@Injectable()
export class BugNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly logger: LoggerService,
  ) {}

  async notifyCreated(ticket: BugNotificationTicket, actor: RequestUserLike) {
    const recipientIds = await this.projectRecipients(ticket, [BUG_MEMBER_ROLE.OWNER, BUG_MEMBER_ROLE.PRODUCT, BUG_MEMBER_ROLE.DEVELOPER])
    await this.send(ticket, actor, recipientIds, NOTIFICATION_TYPE.BUG_CREATED, `新 Bug：${ticket.ticketNo}`, ticket.title)
  }

  async notifyAction(before: BugNotificationTicket, after: BugNotificationTicket, action: string, actor: RequestUserLike, remark?: string) {
    const recipients = new Set<string>()
    if (after.submitterId !== BigInt(actor.userId)) recipients.add(String(after.submitterId))
    if (after.assigneeId && after.assigneeId !== BigInt(actor.userId)) recipients.add(String(after.assigneeId))
    if (after.verifierId && after.verifierId !== BigInt(actor.userId)) recipients.add(String(after.verifierId))
    if (action === BUG_ACTION.ASSIGN && after.assigneeId) recipients.add(String(after.assigneeId))

    const type = bugStatusNotificationType(action)
    const title = action === BUG_ACTION.ASSIGN ? `Bug 已指派：${after.ticketNo}` : `Bug 状态更新：${after.ticketNo}`
    const content = remark || `${before.status} → ${after.status}：${after.title}`
    await this.send(after, actor, [...recipients], type, title, content, action)
  }

  async notifyComment(ticketId: bigint, actor: RequestUserLike, content: string) {
    const ticket = await this.findTicket(ticketId)
    if (!ticket) return
    const commenters = await this.prisma.bugComment.findMany({
      where: { ticketId, delFlag: '0', userId: { not: BigInt(actor.userId) } },
      select: { userId: true },
    })
    const recipients = this.nonEmptyIds([ticket.submitterId, ticket.assigneeId, ticket.verifierId, ...commenters.map((item) => item.userId)])
    await this.send(ticket, actor, recipients, NOTIFICATION_TYPE.BUG_COMMENTED, `Bug 新评论：${ticket.ticketNo}`, content.slice(0, 200), BUG_ACTION.COMMENT)
  }

  private nonEmptyIds(ids: Array<bigint | null | undefined>) {
    return ids.filter((id): id is bigint => Boolean(id))
  }

  private async projectRecipients(ticket: BugNotificationTicket, roles: string[]) {
    const members = await this.prisma.bugProjectMember.findMany({
      where: { projectId: ticket.projectId, memberRole: { in: roles }, status: '0' },
      select: { userId: true },
    })
    const module = ticket.moduleId
      ? await this.prisma.bugProjectModule.findUnique({ where: { moduleId: ticket.moduleId }, select: { defaultAssigneeId: true } })
      : null
    return this.nonEmptyIds([ticket.assigneeId, module?.defaultAssigneeId, ...members.map((item) => item.userId)])
  }

  private async send(ticket: BugNotificationTicket, actor: RequestUserLike, recipients: Array<string | bigint>, notificationType: string, title: string, content: string, action?: string) {
    const recipientIds = [...new Set(recipients.map(String).filter((id) => id !== actor.userId))]
    if (!recipientIds.length) return
    const payload = await this.payload(ticket, action)
    await this.notifications.createMany({
      recipientIds,
      actorId: actor.userId,
      notificationType,
      businessType: NOTIFICATION_BUSINESS_TYPE.BUG_TICKET,
      businessId: ticket.ticketId,
      title,
      content,
      payload,
    })
    this.logger.debug(`Bug 通知已发送: ${ticket.ticketNo}, ${recipientIds.length} 人`, 'BugNotificationService')
  }

  private async payload(ticket: BugNotificationTicket, action?: string) {
    const full = await this.findTicket(ticket.ticketId)
    return {
      ticketId: String(ticket.ticketId),
      ticketNo: ticket.ticketNo,
      title: ticket.title,
      projectName: full?.project.projectName,
      moduleName: full?.module?.moduleName,
      priority: ticket.priority,
      severity: ticket.severity,
      status: ticket.status,
      action,
      route: `/bug/tickets?ticketId=${ticket.ticketId}`,
    }
  }

  private findTicket(ticketId: bigint) {
    return this.prisma.bugTicket.findUnique({
      where: { ticketId },
      include: { project: true, module: true },
    })
  }
}

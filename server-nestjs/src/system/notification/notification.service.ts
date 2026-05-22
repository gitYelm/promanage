import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../../common/logger/logger.service'
import { BusinessException } from '../../common/exceptions/business.exception'
import { ErrorCode } from '../../common/enums/error-code.enum'
import { QueryNotificationDto } from './dto/query-notification.dto'
import { NotificationStreamService } from './notification-stream.service'
import type { CreateUserNotificationInput } from './types/notification.types'

interface NotificationRow {
  notificationId: bigint
  recipientId: bigint
  actorId: bigint | null
  notificationType: string
  businessType: string
  businessId: bigint | null
  title: string
  content: string | null
  payload: Prisma.JsonValue | null
  readTime: Date | null
  createTime: Date | null
  actorUserId: bigint | null
  actorUserName: string | null
  actorNickName: string | null
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly stream: NotificationStreamService,
  ) {}

  async list(query: QueryNotificationDto, userId: string) {
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const where = this.whereSql(query, userId)
    const offset = (pageNum - 1) * pageSize
    const countRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM sys_user_notification n WHERE ${where}
    `
    const rows = await this.prisma.$queryRaw<NotificationRow[]>`
      SELECT n.notification_id AS "notificationId", n.recipient_id AS "recipientId",
        n.actor_id AS "actorId", n.notification_type AS "notificationType",
        n.business_type AS "businessType", n.business_id AS "businessId",
        n.title, n.content, n.payload, n.read_time AS "readTime", n.create_time AS "createTime",
        u.user_id AS "actorUserId", u.user_name AS "actorUserName", u.nick_name AS "actorNickName"
      FROM sys_user_notification n
      LEFT JOIN sys_user u ON u.user_id = n.actor_id
      WHERE ${where}
      ORDER BY n.notification_id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    return { total: Number(countRows[0]?.count ?? 0), rows: rows.map((row) => this.toDto(row)) }
  }

  async unreadCount(userId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM sys_user_notification
      WHERE recipient_id = ${BigInt(userId)} AND read_time IS NULL AND del_flag = '0'
    `
    return { count: Number(rows[0]?.count ?? 0) }
  }

  async markRead(notificationId: string, userId: string) {
    const rows = await this.prisma.$queryRaw<NotificationRow[]>`
      UPDATE sys_user_notification SET read_time = COALESCE(read_time, NOW())
      WHERE notification_id = ${BigInt(notificationId)} AND recipient_id = ${BigInt(userId)} AND del_flag = '0'
      RETURNING notification_id AS "notificationId", recipient_id AS "recipientId", actor_id AS "actorId",
        notification_type AS "notificationType", business_type AS "businessType", business_id AS "businessId",
        title, content, payload, read_time AS "readTime", create_time AS "createTime",
        NULL::bigint AS "actorUserId", NULL::varchar AS "actorUserName", NULL::varchar AS "actorNickName"
    `
    if (!rows.length) throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND, '通知不存在')
    return this.toDto(rows[0])
  }

  async markAllRead(userId: string) {
    await this.prisma.$executeRaw`
      UPDATE sys_user_notification SET read_time = COALESCE(read_time, NOW())
      WHERE recipient_id = ${BigInt(userId)} AND read_time IS NULL AND del_flag = '0'
    `
    return {}
  }

  async createMany(input: CreateUserNotificationInput) {
    const recipientIds = this.uniqueIds(input.recipientIds)
    const created: ReturnType<typeof this.toDto>[] = []
    for (const recipientId of recipientIds) {
      const rows = await this.prisma.$queryRaw<NotificationRow[]>`
        INSERT INTO sys_user_notification
          (recipient_id, actor_id, notification_type, business_type, business_id, title, content, payload)
        VALUES (${recipientId}, ${input.actorId ? BigInt(input.actorId) : null}, ${input.notificationType},
          ${input.businessType}, ${input.businessId ? BigInt(input.businessId) : null}, ${input.title},
          ${input.content ?? null}, ${JSON.stringify(input.payload ?? {})}::jsonb)
        RETURNING notification_id AS "notificationId", recipient_id AS "recipientId", actor_id AS "actorId",
          notification_type AS "notificationType", business_type AS "businessType", business_id AS "businessId",
          title, content, payload, read_time AS "readTime", create_time AS "createTime",
          NULL::bigint AS "actorUserId", NULL::varchar AS "actorUserName", NULL::varchar AS "actorNickName"
      `
      if (rows[0]) created.push(this.toDto(rows[0]))
    }
    for (const notification of created) this.stream.push(notification.recipientId, notification)
    this.logger.log(`创建站内通知 ${created.length} 条: ${input.title}`, 'NotificationService')
    return created
  }

  private whereSql(query: QueryNotificationDto, userId: string) {
    const parts = [Prisma.sql`n.recipient_id = ${BigInt(userId)}`, Prisma.sql`n.del_flag = '0'`]
    if (query.notificationType)
      parts.push(Prisma.sql`n.notification_type = ${query.notificationType}`)
    if (query.readStatus === 'unread') parts.push(Prisma.sql`n.read_time IS NULL`)
    if (query.readStatus === 'read') parts.push(Prisma.sql`n.read_time IS NOT NULL`)
    return Prisma.join(parts, ' AND ')
  }

  private toDto(row: NotificationRow) {
    return {
      notificationId: String(row.notificationId),
      recipientId: String(row.recipientId),
      actorId: row.actorId ? String(row.actorId) : undefined,
      notificationType: row.notificationType,
      businessType: row.businessType,
      businessId: row.businessId ? String(row.businessId) : undefined,
      title: row.title,
      content: row.content ?? undefined,
      payload: row.payload,
      readTime: row.readTime?.toISOString(),
      createTime: row.createTime?.toISOString(),
      actor: row.actorUserId
        ? {
            userId: String(row.actorUserId),
            userName: row.actorUserName,
            nickName: row.actorNickName,
          }
        : null,
    }
  }

  private uniqueIds(ids: Array<string | bigint>) {
    return [...new Set(ids.map((id) => String(id)).filter((id) => /^\d+$/.test(id)))].map((id) =>
      BigInt(id),
    )
  }
}

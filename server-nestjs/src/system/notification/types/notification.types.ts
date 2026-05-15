import { Prisma } from '@prisma/client'
import type { NotificationBusinessType, NotificationType } from '../constants/notification.constants'

export interface NotificationPayload {
  ticketId?: string
  ticketNo?: string
  title?: string
  projectName?: string
  moduleName?: string
  priority?: string
  severity?: string
  status?: string
  action?: string
  route?: string
  [key: string]: unknown
}

export interface CreateUserNotificationInput {
  recipientIds: Array<string | bigint>
  actorId?: string | bigint
  notificationType: NotificationType | string
  businessType: NotificationBusinessType | string
  businessId?: string | bigint
  title: string
  content?: string
  payload?: NotificationPayload | Prisma.InputJsonValue
}

export interface NotificationStreamEvent {
  type: 'notification' | 'heartbeat'
  data: unknown
}

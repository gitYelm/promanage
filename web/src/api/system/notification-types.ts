export interface NotificationActor {
  userId: string
  userName: string
  nickName?: string
}

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

export interface UserNotification {
  notificationId: string
  recipientId: string
  actorId?: string
  notificationType: string
  businessType: string
  businessId?: string
  title: string
  content?: string
  payload?: NotificationPayload
  readTime?: string
  createTime?: string
  actor?: NotificationActor | null
}

export interface NotificationQuery {
  pageNum?: number
  pageSize?: number
  readStatus?: 'unread' | 'read'
  notificationType?: string
}

export interface NotificationPageResult {
  rows: UserNotification[]
  total: number
}

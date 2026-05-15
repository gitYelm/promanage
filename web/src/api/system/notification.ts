import request from '@/utils/request'
import type { NotificationPageResult, NotificationQuery, UserNotification } from './notification-types'

const unwrap = <T>(res: unknown) => (res as { data: T }).data

export function listNotifications(params: NotificationQuery): Promise<NotificationPageResult> {
  return request({ url: '/system/notifications', method: 'get', params }).then(unwrap<NotificationPageResult>)
}

export function notificationUnreadCount(): Promise<{ count: number }> {
  return request({ url: '/system/notifications/unread-count', method: 'get' }).then(unwrap<{ count: number }>)
}

export function createNotificationStreamToken(): Promise<{ token: string; expiresIn: number }> {
  return request({ url: '/system/notifications/stream-token', method: 'post' }).then(unwrap<{ token: string; expiresIn: number }>)
}

export function markNotificationRead(notificationId: string): Promise<UserNotification> {
  return request({ url: `/system/notifications/${notificationId}/read`, method: 'put' }).then(unwrap<UserNotification>)
}

export function markAllNotificationsRead() {
  return request({ url: '/system/notifications/read-all', method: 'put' })
}

export const NOTIFICATION_BUSINESS_TYPE = {
  BUG_TICKET: 'bug_ticket',
} as const

export const NOTIFICATION_TYPE = {
  BUG_CREATED: 'bug_created',
  BUG_ASSIGNED: 'bug_assigned',
  BUG_STATUS_CHANGED: 'bug_status_changed',
  BUG_COMMENTED: 'bug_commented',
  BUG_VERIFY_FAILED: 'bug_verify_failed',
  BUG_REOPENED: 'bug_reopened',
} as const

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]
export type NotificationBusinessType =
  (typeof NOTIFICATION_BUSINESS_TYPE)[keyof typeof NOTIFICATION_BUSINESS_TYPE]

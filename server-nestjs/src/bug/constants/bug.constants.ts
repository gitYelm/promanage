export const BUG_STATUS = {
  PENDING_CONFIRM: 'pending_confirm',
  CONFIRMED: 'confirmed',
  ASSIGNED: 'assigned',
  FIXING: 'fixing',
  PENDING_VERIFY: 'pending_verify',
  CLOSED: 'closed',
  REJECTED: 'rejected',
  CANNOT_REPRODUCE: 'cannot_reproduce',
  DUPLICATE: 'duplicate',
  SUSPENDED: 'suspended',
  REOPENED: 'reopened',
} as const

export const BUG_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  CONFIRM: 'confirm',
  REJECT: 'reject',
  CANNOT_REPRODUCE: 'cannot_reproduce',
  DUPLICATE: 'duplicate',
  SUSPEND: 'suspend',
  RESTORE: 'restore',
  ASSIGN: 'assign',
  START_FIX: 'start_fix',
  SUBMIT_VERIFY: 'submit_verify',
  VERIFY_PASS: 'verify_pass',
  VERIFY_FAIL: 'verify_fail',
  REOPEN: 'reopen',
  CLOSE: 'close',
  COMMENT: 'comment',
  ATTACHMENT: 'attachment',
  DELETE: 'delete',
} as const

export const BUG_MEMBER_ROLE = {
  OWNER: 'owner',
  PRODUCT: 'product',
  REVIEWER: 'reviewer',
  DEVELOPER: 'developer',
  TESTER: 'tester',
  VIEWER: 'viewer',
} as const

export const BUG_ATTACHMENT_TYPE = {
  IMAGE: 'image',
  ANNOTATED_IMAGE: 'annotated_image',
  LOG: 'log',
  VIDEO: 'video',
  FILE: 'file',
} as const

export type BugStatus = (typeof BUG_STATUS)[keyof typeof BUG_STATUS]
export type BugAction = (typeof BUG_ACTION)[keyof typeof BUG_ACTION]
export type BugMemberRole = (typeof BUG_MEMBER_ROLE)[keyof typeof BUG_MEMBER_ROLE]

export const BUG_PENDING_STATUSES = [
  BUG_STATUS.PENDING_CONFIRM,
  BUG_STATUS.CONFIRMED,
  BUG_STATUS.ASSIGNED,
  BUG_STATUS.FIXING,
  BUG_STATUS.PENDING_VERIFY,
  BUG_STATUS.REOPENED,
] as const

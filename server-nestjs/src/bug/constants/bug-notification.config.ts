import { BUG_ACTION } from './bug.constants'
import { NOTIFICATION_TYPE } from '../../system/notification/constants/notification.constants'

export const BUG_ACTION_NOTIFICATION_TYPE: Record<string, string> = {
  [BUG_ACTION.ASSIGN]: NOTIFICATION_TYPE.BUG_ASSIGNED,
  [BUG_ACTION.VERIFY_FAIL]: NOTIFICATION_TYPE.BUG_VERIFY_FAILED,
  [BUG_ACTION.REOPEN]: NOTIFICATION_TYPE.BUG_REOPENED,
}

export function bugStatusNotificationType(action: string) {
  return BUG_ACTION_NOTIFICATION_TYPE[action] || NOTIFICATION_TYPE.BUG_STATUS_CHANGED
}

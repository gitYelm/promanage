import { BUG_ACTION, BUG_STATUS, type BugAction, type BugStatus } from './bug.constants'

export interface BugTransitionConfig {
  action: BugAction
  from: BugStatus[]
  to: BugStatus
  remarkRequired?: boolean
  permissions: string[]
  label: string
}

export const BUG_TRANSITIONS: BugTransitionConfig[] = [
  {
    action: BUG_ACTION.CONFIRM,
    from: [BUG_STATUS.PENDING_CONFIRM],
    to: BUG_STATUS.CONFIRMED,
    permissions: ['bug:ticket:confirm'],
    label: '确认有效',
  },
  {
    action: BUG_ACTION.REJECT,
    from: [BUG_STATUS.PENDING_CONFIRM, BUG_STATUS.REOPENED],
    to: BUG_STATUS.REJECTED,
    permissions: ['bug:ticket:reject'],
    label: '驳回',
  },
  {
    action: BUG_ACTION.CANNOT_REPRODUCE,
    from: [BUG_STATUS.PENDING_CONFIRM, BUG_STATUS.REOPENED],
    to: BUG_STATUS.CANNOT_REPRODUCE,
    permissions: ['bug:ticket:reject'],
    label: '无法复现',
  },
  {
    action: BUG_ACTION.DUPLICATE,
    from: [BUG_STATUS.PENDING_CONFIRM, BUG_STATUS.REOPENED],
    to: BUG_STATUS.DUPLICATE,
    permissions: ['bug:ticket:reject'],
    label: '标记重复',
  },
  {
    action: BUG_ACTION.SUSPEND,
    from: [BUG_STATUS.PENDING_CONFIRM, BUG_STATUS.CONFIRMED, BUG_STATUS.ASSIGNED],
    to: BUG_STATUS.SUSPENDED,
    permissions: ['bug:ticket:reject'],
    label: '暂不处理',
  },
  {
    action: BUG_ACTION.RESTORE,
    from: [BUG_STATUS.SUSPENDED],
    to: BUG_STATUS.CONFIRMED,
    permissions: ['bug:ticket:confirm'],
    label: '恢复处理',
  },
  {
    action: BUG_ACTION.ASSIGN,
    from: [BUG_STATUS.CONFIRMED, BUG_STATUS.REOPENED],
    to: BUG_STATUS.ASSIGNED,
    permissions: ['bug:ticket:assign'],
    label: '指派负责人',
  },
  {
    action: BUG_ACTION.START_FIX,
    from: [BUG_STATUS.CONFIRMED, BUG_STATUS.ASSIGNED, BUG_STATUS.REOPENED],
    to: BUG_STATUS.FIXING,
    permissions: ['bug:ticket:startFix'],
    label: '开始修复',
  },
  {
    action: BUG_ACTION.SUBMIT_VERIFY,
    from: [BUG_STATUS.FIXING],
    to: BUG_STATUS.PENDING_VERIFY,
    permissions: ['bug:ticket:submitVerify'],
    label: '提交验证',
  },
  {
    action: BUG_ACTION.VERIFY_PASS,
    from: [BUG_STATUS.PENDING_VERIFY],
    to: BUG_STATUS.CLOSED,
    permissions: ['bug:ticket:verify', 'bug:ticket:close'],
    label: '验证通过',
  },
  {
    action: BUG_ACTION.VERIFY_FAIL,
    from: [BUG_STATUS.PENDING_VERIFY],
    to: BUG_STATUS.REOPENED,
    permissions: ['bug:ticket:verify', 'bug:ticket:reopen'],
    label: '验证不通过',
  },
  {
    action: BUG_ACTION.REOPEN,
    from: [BUG_STATUS.CLOSED, BUG_STATUS.REJECTED, BUG_STATUS.CANNOT_REPRODUCE],
    to: BUG_STATUS.REOPENED,
    permissions: ['bug:ticket:reopen'],
    label: '重新打开',
  },
  {
    action: BUG_ACTION.CLOSE,
    from: [BUG_STATUS.PENDING_VERIFY, BUG_STATUS.SUSPENDED],
    to: BUG_STATUS.CLOSED,
    permissions: ['bug:ticket:close'],
    label: '关闭',
  },
]

export function getBugTransition(action: BugAction, currentStatus: string) {
  return BUG_TRANSITIONS.find(
    (item) => item.action === action && item.from.includes(currentStatus as BugStatus),
  )
}

export function getBugTransitions(currentStatus: string) {
  return BUG_TRANSITIONS.filter((item) => item.from.includes(currentStatus as BugStatus))
}

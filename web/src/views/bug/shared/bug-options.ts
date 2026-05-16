export const ALL_OPTION_VALUE = '__all__'
export const NONE_OPTION_VALUE = '__none__'

export const BUG_STATUS_OPTIONS = [
  { label: '待确认', value: 'pending_confirm' },
  { label: '已确认', value: 'confirmed' },
  { label: '已分配', value: 'assigned' },
  { label: '修复中', value: 'fixing' },
  { label: '待验证', value: 'pending_verify' },
  { label: '已关闭', value: 'closed' },
  { label: '已驳回', value: 'rejected' },
  { label: '无法复现', value: 'cannot_reproduce' },
  { label: '重复问题', value: 'duplicate' },
  { label: '暂不处理', value: 'suspended' },
  { label: '重新打开', value: 'reopened' },
]

export const BUG_TYPE_OPTIONS = [
  { label: '功能异常', value: 'function' },
  { label: '界面问题', value: 'ui' },
  { label: '性能问题', value: 'performance' },
  { label: '兼容问题', value: 'compatibility' },
  { label: '安全问题', value: 'security' },
]

export const BUG_SEVERITY_OPTIONS = [
  { label: '致命', value: 'blocker' },
  { label: '严重', value: 'critical' },
  { label: '一般', value: 'major' },
  { label: '轻微', value: 'minor' },
]

export const BUG_PRIORITY_OPTIONS = [
  { label: '紧急', value: 'urgent' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

export const BUG_VERSION_STATUS_OPTIONS = [
  { label: '规划中', value: 'planning' },
  { label: '测试中', value: 'testing' },
  { label: '已发布', value: 'released' },
  { label: '已归档', value: 'archived' },
]

export const BUG_ENVIRONMENT_OPTIONS = [
  { label: '生产', value: 'production' },
  { label: '预发', value: 'staging' },
  { label: '测试', value: 'testing' },
  { label: '本地', value: 'local' },
]

export const BUG_MEMBER_ROLE_OPTIONS = [
  { label: '项目负责人', value: 'owner' },
  { label: '产品负责人', value: 'product' },
  { label: '审核人员', value: 'reviewer' },
  { label: '开发人员', value: 'developer' },
  { label: '测试人员', value: 'tester' },
  { label: '观察者', value: 'viewer' },
]

export const BUG_ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  confirm: '确认有效',
  reject: '驳回',
  cannot_reproduce: '无法复现',
  duplicate: '标记重复',
  suspend: '暂不处理',
  restore: '恢复处理',
  assign: '指派',
  start_fix: '开始修复',
  submit_verify: '提交验证',
  verify_pass: '验证通过',
  verify_fail: '验证不通过',
  reopen: '重新打开',
  close: '关闭',
  comment: '评论',
}

export function optionLabel(options: Array<{ label: string; value: string }>, value?: string) {
  return options.find((item) => item.value === value)?.label || value || '-'
}

export function actionLabel(action?: string) {
  return action ? BUG_ACTION_LABELS[action] || action : '-'
}

export function normalizeAll(value?: string) {
  return value && value !== ALL_OPTION_VALUE ? value : undefined
}

export function normalizeOptional(value?: string) {
  return value && value !== NONE_OPTION_VALUE ? value : undefined
}

export function fileUrl(url?: string) {
  if (!url) return '#'
  if (/^https?:\/\//.test(url)) return url
  const base = import.meta.env.VITE_API_URL || ''
  return `${base}${url}`
}

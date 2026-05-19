export const PM_PROJECT_STAGE_OPTIONS = [
  { label: '需求阶段', value: 'requirement' }, { label: '规划阶段', value: 'planning' }, { label: '设计阶段', value: 'design' }, { label: '开发阶段', value: 'development' }, { label: '自测阶段', value: 'self_test' }, { label: '内测阶段', value: 'internal_test' }, { label: '待发布', value: 'release_ready' }, { label: '已发布', value: 'released' }, { label: '维护阶段', value: 'maintenance' }, { label: '已暂停', value: 'paused' }, { label: '已归档', value: 'archived' },
]
export const PM_REQUIREMENT_STATUS_OPTIONS = [
  { label: '草稿', value: 'draft' }, { label: '已提交', value: 'submitted' }, { label: '评审中', value: 'reviewing' }, { label: '已通过', value: 'approved' }, { label: '已驳回', value: 'rejected' }, { label: '已延期', value: 'deferred' }, { label: '已排期', value: 'planned' }, { label: '开发中', value: 'developing' }, { label: '测试中', value: 'testing' }, { label: '已验收', value: 'accepted' }, { label: '已发布', value: 'released' }, { label: '已关闭', value: 'closed' }, { label: '变更中', value: 'changed' },
]
export const PM_REQUIREMENT_TYPE_OPTIONS = [
  { label: '新功能', value: 'feature' }, { label: '优化改进', value: 'improvement' }, { label: '技术改造', value: 'technical' }, { label: '体验优化', value: 'ux' }, { label: '安全需求', value: 'security' },
]
export const PM_ITERATION_STATUS_OPTIONS = [
  { label: '未开始', value: 'planned' }, { label: '进行中', value: 'active' }, { label: '测试中', value: 'testing' }, { label: '已完成', value: 'completed' }, { label: '已暂停', value: 'paused' }, { label: '已取消', value: 'cancelled' },
]
export const PM_MILESTONE_STATUS_OPTIONS = [
  { label: '未开始', value: 'pending' }, { label: '进行中', value: 'in_progress' }, { label: '已达成', value: 'achieved' }, { label: '已延期', value: 'delayed' }, { label: '已取消', value: 'cancelled' },
]
export const PM_RISK_LEVEL_OPTIONS = [
  { label: '低风险', value: 'low' }, { label: '中风险', value: 'medium' }, { label: '高风险', value: 'high' }, { label: '已延期', value: 'delayed' },
]
export const PM_PRIORITY_OPTIONS = [
  { label: '紧急', value: 'urgent' }, { label: '高', value: 'high' }, { label: '中', value: 'medium' }, { label: '低', value: 'low' },
]
export const PM_ALL_OPTION_VALUE = '__all__'
export const PM_NONE_OPTION_VALUE = '__none__'
export const PM_REQUIREMENT_ACTION_OPTIONS = [
  { label: '提交评审', action: 'submit', from: ['draft', 'changed'], permissions: ['pm:requirement:status'] },
  { label: '开始评审', action: 'review', from: ['submitted'], permissions: ['pm:requirement:review'] },
  { label: '评审通过', action: 'approve', from: ['submitted', 'reviewing'], permissions: ['pm:requirement:review'] },
  { label: '排期', action: 'plan', from: ['approved', 'deferred'], permissions: ['pm:requirement:status'] },
  { label: '开始开发', action: 'start_dev', from: ['planned'], permissions: ['pm:requirement:status'] },
  { label: '提交测试', action: 'submit_test', from: ['developing'], permissions: ['pm:requirement:status'] },
  { label: '验收通过', action: 'accept', from: ['testing'], permissions: ['pm:requirement:status'] },
  { label: '发布', action: 'release', from: ['accepted'], permissions: ['pm:requirement:status'] },
  { label: '关闭', action: 'close', from: ['released', 'rejected'], permissions: ['pm:requirement:status'] },
]
export const PM_ITERATION_ACTION_OPTIONS = [
  { label: '开始', action: 'start', from: ['planned'], permissions: ['pm:iteration:manage'] },
  { label: '进入测试', action: 'test', from: ['active'], permissions: ['pm:iteration:manage'] },
  { label: '完成', action: 'complete', from: ['active', 'testing'], permissions: ['pm:iteration:manage'] },
  { label: '暂停', action: 'pause', from: ['active'], permissions: ['pm:iteration:manage'] },
  { label: '取消', action: 'cancel', from: ['planned', 'paused'], permissions: ['pm:iteration:manage'] },
]
export const PM_MILESTONE_ACTION_OPTIONS = [
  { label: '开始', action: 'start', from: ['pending'], permissions: ['pm:milestone:manage'] },
  { label: '达成', action: 'achieve', from: ['pending', 'in_progress', 'delayed'], permissions: ['pm:milestone:manage'] },
  { label: '延期', action: 'delay', from: ['pending', 'in_progress'], permissions: ['pm:milestone:manage'] },
  { label: '取消', action: 'cancel', from: ['pending', 'in_progress', 'delayed'], permissions: ['pm:milestone:manage'] },
]
export const PM_REQUIREMENT_BOARD_COLUMNS = [
  { title: '待评审/确认', statuses: ['submitted', 'reviewing', 'approved'] },
  { title: '已排期', statuses: ['planned'] },
  { title: '开发中', statuses: ['developing'] },
  { title: '测试/验收', statuses: ['testing', 'accepted'] },
  { title: '已完成', statuses: ['released', 'closed'] },
]
export const PM_BUG_BOARD_COLUMNS = [
  { title: '待确认', statuses: ['pending_confirm', 'confirmed'] },
  { title: '修复中', statuses: ['assigned', 'fixing'] },
  { title: '待验证', statuses: ['pending_verify'] },
  { title: '已关闭', statuses: ['closed'] },
  { title: '暂缓/异常', statuses: ['rejected', 'cannot_reproduce', 'duplicate', 'suspended', 'reopened'] },
]
export function pmLabel(options: Array<{ label: string; value: string }>, value?: string) { return options.find((item) => item.value === value)?.label || value || '-' }
export function formatDate(value?: string) { return value ? value.slice(0, 10) : '-' }
export function pmNormalizeAll(value?: string) { return value && value !== PM_ALL_OPTION_VALUE ? value : undefined }
export function pmNormalizeOptional(value?: string) { return value && value !== PM_NONE_OPTION_VALUE ? value : undefined }
export function pmAvailableActions(items: Array<{ action: string; label: string; from: string[]; permissions?: string[] }>, status?: string) { return items.filter((item) => status && item.from.includes(status)) }
export function toDateInput(value?: string) { return value ? value.slice(0, 10) : '' }

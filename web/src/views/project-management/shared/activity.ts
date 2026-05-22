import { getStatusLabel, type StatusDomain } from '@/utils/semantic-styles'

export interface PmActivityLike {
  targetType?: string
  action?: string
  fromValue?: string
  toValue?: string
  remark?: string
}

const ACTIVITY_TARGET_LABELS: Record<string, string> = {
  project: '项目',
  requirement: '需求',
  iteration: '迭代',
  milestone: '里程碑',
}

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  status: '状态变更',
  stage: '阶段变更',
  delete: '删除',
}

const ACTIVITY_VALUE_DOMAINS: Record<string, StatusDomain> = {
  project: 'projectStage',
  requirement: 'requirement',
  iteration: 'iteration',
  milestone: 'milestone',
}

const GENERIC_REMARKS = new Set(['更新项目进度', '更新需求信息'])

export function pmActivityDescription(item: PmActivityLike) {
  const targetLabel = activityTargetLabel(item.targetType)
  const actionLabel = activityActionLabel(item.action)
  const valueText = activityValueText(item)
  const remark = activityRemark(item)
  return `${targetLabel}${actionLabel}${valueText ? `：${valueText}` : ''}${remark}`
}

function activityTargetLabel(targetType?: string) {
  if (!targetType) return '项目事项'
  return ACTIVITY_TARGET_LABELS[targetType] || '项目事项'
}

function activityActionLabel(action?: string) {
  if (!action) return '操作'
  return ACTIVITY_ACTION_LABELS[action] || '操作'
}

function activityValueText(item: PmActivityLike) {
  const domain = item.targetType ? ACTIVITY_VALUE_DOMAINS[item.targetType] : undefined
  const fromLabel = activityValueLabel(domain, item.fromValue)
  const toLabel = activityValueLabel(domain, item.toValue)
  if (fromLabel && toLabel) return `${fromLabel} → ${toLabel}`
  if (toLabel) return toLabel
  if (fromLabel) return `从 ${fromLabel}`
  return ''
}

function activityValueLabel(domain: StatusDomain | undefined, value?: string) {
  const normalized = value?.trim()
  if (!normalized) return ''
  return domain ? getStatusLabel(domain, normalized, '') : normalized
}

function activityRemark(item: PmActivityLike) {
  const remark = item.remark?.trim()
  if (!remark || GENERIC_REMARKS.has(remark)) return ''
  return `（${remark}）`
}

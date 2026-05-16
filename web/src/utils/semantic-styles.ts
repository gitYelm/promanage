export type SemanticTone =
  | 'neutral'
  | 'success'
  | 'lowRisk'
  | 'info'
  | 'warning'
  | 'danger'
  | 'overdue'

export type StatusDomain =
  | 'requirement'
  | 'bug'
  | 'iteration'
  | 'milestone'
  | 'projectStage'
  | 'bugVersion'
  | 'enabled'

export interface SemanticStyle {
  label: string
  tone: SemanticTone
  badgeClass: string
  textClass: string
  cardClass: string
  iconClass: string
  progressClass: string
  progressTrackClass: string
}

export const SEMANTIC_STYLES: Record<SemanticTone, SemanticStyle> = {
  neutral: {
    label: '中性',
    tone: 'neutral',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300',
    textClass: 'text-foreground',
    cardClass: 'border-slate-200/70 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-950/20',
    iconClass: 'text-slate-500',
    progressClass: 'bg-slate-500 dark:bg-slate-400',
    progressTrackClass: 'bg-slate-200/70 dark:bg-slate-800/70',
  },
  success: {
    label: '正常',
    tone: 'success',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    cardClass: 'border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-emerald-950/20',
    iconClass: 'text-emerald-600 dark:text-emerald-300',
    progressClass: 'bg-emerald-600 dark:bg-emerald-400',
    progressTrackClass: 'bg-emerald-100 dark:bg-emerald-950/50',
  },
  lowRisk: {
    label: '低风险',
    tone: 'lowRisk',
    badgeClass: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-300',
    textClass: 'text-teal-700 dark:text-teal-300',
    cardClass: 'border-teal-200/70 bg-teal-50/70 dark:border-teal-900/70 dark:bg-teal-950/20',
    iconClass: 'text-teal-600 dark:text-teal-300',
    progressClass: 'bg-teal-600 dark:bg-teal-400',
    progressTrackClass: 'bg-teal-100 dark:bg-teal-950/50',
  },
  info: {
    label: '进行中',
    tone: 'info',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-300',
    textClass: 'text-sky-700 dark:text-sky-300',
    cardClass: 'border-sky-200/70 bg-sky-50/70 dark:border-sky-900/70 dark:bg-sky-950/20',
    iconClass: 'text-sky-600 dark:text-sky-300',
    progressClass: 'bg-sky-600 dark:bg-sky-400',
    progressTrackClass: 'bg-sky-100 dark:bg-sky-950/50',
  },
  warning: {
    label: '关注',
    tone: 'warning',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300',
    textClass: 'text-amber-700 dark:text-amber-300',
    cardClass: 'border-amber-200/70 bg-amber-50/70 dark:border-amber-900/70 dark:bg-amber-950/20',
    iconClass: 'text-amber-600 dark:text-amber-300',
    progressClass: 'bg-amber-500 dark:bg-amber-400',
    progressTrackClass: 'bg-amber-100 dark:bg-amber-950/50',
  },
  danger: {
    label: '高风险',
    tone: 'danger',
    badgeClass: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300',
    textClass: 'text-red-700 dark:text-red-300',
    cardClass: 'border-red-200/70 bg-red-50/70 dark:border-red-900/70 dark:bg-red-950/20',
    iconClass: 'text-red-600 dark:text-red-300',
    progressClass: 'bg-red-600 dark:bg-red-400',
    progressTrackClass: 'bg-red-100 dark:bg-red-950/50',
  },
  overdue: {
    label: '已延期',
    tone: 'overdue',
    badgeClass: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/80 dark:bg-rose-950/40 dark:text-rose-300',
    textClass: 'text-rose-800 dark:text-rose-300',
    cardClass: 'border-rose-300/80 bg-rose-50/80 dark:border-rose-900/80 dark:bg-rose-950/30',
    iconClass: 'text-rose-700 dark:text-rose-300',
    progressClass: 'bg-rose-700 dark:bg-rose-400',
    progressTrackClass: 'bg-rose-100 dark:bg-rose-950/50',
  },
}

const RISK_TONE_MAP: Record<string, SemanticTone> = {
  healthy: 'success',
  normal: 'success',
  low: 'lowRisk',
  watch: 'warning',
  medium: 'warning',
  high: 'danger',
  risk: 'danger',
  delayed: 'overdue',
  overdue: 'overdue',
}

const RISK_LABEL_MAP: Record<string, string> = {
  healthy: '正常',
  normal: '正常',
  low: '低风险',
  watch: '关注',
  medium: '中风险',
  high: '高风险',
  risk: '高风险',
  delayed: '已延期',
  overdue: '已延期',
}

const STATUS_TONE_MAP: Record<StatusDomain, Record<string, SemanticTone>> = {
  requirement: {
    draft: 'neutral',
    submitted: 'warning',
    reviewing: 'warning',
    approved: 'lowRisk',
    rejected: 'danger',
    deferred: 'overdue',
    planned: 'info',
    developing: 'info',
    testing: 'warning',
    accepted: 'success',
    released: 'success',
    closed: 'success',
    changed: 'warning',
  },
  bug: {
    pending_confirm: 'warning',
    confirmed: 'warning',
    assigned: 'info',
    fixing: 'info',
    pending_verify: 'warning',
    closed: 'success',
    rejected: 'danger',
    cannot_reproduce: 'danger',
    duplicate: 'neutral',
    suspended: 'danger',
    reopened: 'danger',
  },
  iteration: {
    planned: 'neutral',
    active: 'info',
    testing: 'warning',
    completed: 'success',
    paused: 'danger',
    cancelled: 'neutral',
  },
  milestone: {
    pending: 'neutral',
    in_progress: 'info',
    achieved: 'success',
    delayed: 'overdue',
    cancelled: 'neutral',
  },
  projectStage: {
    requirement: 'neutral',
    planning: 'info',
    design: 'info',
    development: 'info',
    self_test: 'warning',
    internal_test: 'warning',
    release_ready: 'lowRisk',
    released: 'success',
    maintenance: 'success',
    paused: 'danger',
    archived: 'neutral',
  },
  bugVersion: {
    planning: 'info',
    testing: 'warning',
    released: 'success',
    archived: 'neutral',
  },
  enabled: {
    '0': 'success',
    '1': 'neutral',
    enabled: 'success',
    disabled: 'neutral',
    active: 'success',
    inactive: 'neutral',
  },
}

const STATUS_LABEL_MAP: Record<StatusDomain, Record<string, string>> = {
  requirement: {
    draft: '草稿',
    submitted: '已提交',
    reviewing: '评审中',
    approved: '已通过',
    rejected: '已驳回',
    deferred: '已延期',
    planned: '已排期',
    developing: '开发中',
    testing: '测试中',
    accepted: '已验收',
    released: '已发布',
    closed: '已关闭',
    changed: '变更中',
  },
  bug: {
    pending_confirm: '待确认',
    confirmed: '已确认',
    assigned: '已分配',
    fixing: '修复中',
    pending_verify: '待验证',
    closed: '已关闭',
    rejected: '已驳回',
    cannot_reproduce: '无法复现',
    duplicate: '重复问题',
    suspended: '暂不处理',
    reopened: '重新打开',
  },
  iteration: {
    planned: '未开始',
    active: '进行中',
    testing: '测试中',
    completed: '已完成',
    paused: '已暂停',
    cancelled: '已取消',
  },
  milestone: {
    pending: '未开始',
    in_progress: '进行中',
    achieved: '已达成',
    delayed: '已延期',
    cancelled: '已取消',
  },
  projectStage: {
    requirement: '需求阶段',
    planning: '规划阶段',
    design: '设计阶段',
    development: '开发阶段',
    self_test: '自测阶段',
    internal_test: '内测阶段',
    release_ready: '待发布',
    released: '已发布',
    maintenance: '维护阶段',
    paused: '已暂停',
    archived: '已归档',
  },
  bugVersion: {
    planning: '规划中',
    testing: '测试中',
    released: '已发布',
    archived: '已归档',
  },
  enabled: {
    '0': '启用',
    '1': '停用',
    enabled: '启用',
    disabled: '停用',
    active: '启用',
    inactive: '停用',
  },
}

const PRIORITY_TONE_MAP: Record<string, SemanticTone> = {
  urgent: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'lowRisk',
}

const PRIORITY_LABEL_MAP: Record<string, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
}

const SEVERITY_TONE_MAP: Record<string, SemanticTone> = {
  blocker: 'overdue',
  critical: 'danger',
  major: 'warning',
  minor: 'lowRisk',
}

const SEVERITY_LABEL_MAP: Record<string, string> = {
  blocker: '致命',
  critical: '严重',
  major: '一般',
  minor: '轻微',
}

const BOARD_COLUMN_TONE_MAP: Record<string, SemanticTone> = {
  '待评审/确认': 'warning',
  已排期: 'info',
  开发中: 'info',
  '测试/验收': 'warning',
  已完成: 'success',
  待确认: 'warning',
  修复中: 'info',
  待验证: 'warning',
  已关闭: 'success',
  '暂缓/异常': 'danger',
}

export function getSemanticStyle(tone: SemanticTone = 'neutral') {
  return SEMANTIC_STYLES[tone]
}

export function getRiskTone(value?: string): SemanticTone {
  if (!value) return 'neutral'
  return RISK_TONE_MAP[value] || 'neutral'
}

export function getRiskLabel(value?: string, fallback = '未配置') {
  if (!value) return fallback
  return RISK_LABEL_MAP[value] || value
}

export function getRiskStyle(value?: string) {
  return getSemanticStyle(getRiskTone(value))
}

export function getStatusTone(domain: StatusDomain, value?: string): SemanticTone {
  if (!value) return 'neutral'
  return STATUS_TONE_MAP[domain]?.[value] || 'neutral'
}

export function getStatusLabel(domain: StatusDomain, value?: string, fallback = '-') {
  if (!value) return fallback
  return STATUS_LABEL_MAP[domain]?.[value] || value
}

export function getStatusStyle(domain: StatusDomain, value?: string) {
  return getSemanticStyle(getStatusTone(domain, value))
}

export function getPriorityTone(value?: string): SemanticTone {
  if (!value) return 'neutral'
  return PRIORITY_TONE_MAP[value] || 'neutral'
}

export function getPriorityLabel(value?: string, fallback = '-') {
  if (!value) return fallback
  return PRIORITY_LABEL_MAP[value] || value
}

export function getPriorityStyle(value?: string) {
  return getSemanticStyle(getPriorityTone(value))
}

export function getSeverityTone(value?: string): SemanticTone {
  if (!value) return 'neutral'
  return SEVERITY_TONE_MAP[value] || 'neutral'
}

export function getSeverityLabel(value?: string, fallback = '-') {
  if (!value) return fallback
  return SEVERITY_LABEL_MAP[value] || value
}

export function getSeverityStyle(value?: string) {
  return getSemanticStyle(getSeverityTone(value))
}

export function getBoardColumnTone(title?: string): SemanticTone {
  if (!title) return 'neutral'
  return BOARD_COLUMN_TONE_MAP[title] || 'neutral'
}

export function getBoardColumnStyle(title?: string) {
  return getSemanticStyle(getBoardColumnTone(title))
}

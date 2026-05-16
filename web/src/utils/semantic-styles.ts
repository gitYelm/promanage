export type SemanticTone =
  | 'neutral'
  | 'success'
  | 'lowRisk'
  | 'info'
  | 'warning'
  | 'danger'
  | 'overdue'

export interface SemanticStyle {
  label: string
  tone: SemanticTone
  badgeClass: string
  textClass: string
  cardClass: string
  iconClass: string
}

export const SEMANTIC_STYLES: Record<SemanticTone, SemanticStyle> = {
  neutral: {
    label: '中性',
    tone: 'neutral',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300',
    textClass: 'text-foreground',
    cardClass: 'border-slate-200/70 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-950/20',
    iconClass: 'text-slate-500',
  },
  success: {
    label: '正常',
    tone: 'success',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    cardClass: 'border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-emerald-950/20',
    iconClass: 'text-emerald-600 dark:text-emerald-300',
  },
  lowRisk: {
    label: '低风险',
    tone: 'lowRisk',
    badgeClass: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-300',
    textClass: 'text-teal-700 dark:text-teal-300',
    cardClass: 'border-teal-200/70 bg-teal-50/70 dark:border-teal-900/70 dark:bg-teal-950/20',
    iconClass: 'text-teal-600 dark:text-teal-300',
  },
  info: {
    label: '进行中',
    tone: 'info',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-300',
    textClass: 'text-sky-700 dark:text-sky-300',
    cardClass: 'border-sky-200/70 bg-sky-50/70 dark:border-sky-900/70 dark:bg-sky-950/20',
    iconClass: 'text-sky-600 dark:text-sky-300',
  },
  warning: {
    label: '关注',
    tone: 'warning',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300',
    textClass: 'text-amber-700 dark:text-amber-300',
    cardClass: 'border-amber-200/70 bg-amber-50/70 dark:border-amber-900/70 dark:bg-amber-950/20',
    iconClass: 'text-amber-600 dark:text-amber-300',
  },
  danger: {
    label: '高风险',
    tone: 'danger',
    badgeClass: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300',
    textClass: 'text-red-700 dark:text-red-300',
    cardClass: 'border-red-200/70 bg-red-50/70 dark:border-red-900/70 dark:bg-red-950/20',
    iconClass: 'text-red-600 dark:text-red-300',
  },
  overdue: {
    label: '已延期',
    tone: 'overdue',
    badgeClass: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/80 dark:bg-rose-950/40 dark:text-rose-300',
    textClass: 'text-rose-800 dark:text-rose-300',
    cardClass: 'border-rose-300/80 bg-rose-50/80 dark:border-rose-900/80 dark:bg-rose-950/30',
    iconClass: 'text-rose-700 dark:text-rose-300',
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

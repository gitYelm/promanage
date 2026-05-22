export function optionLabel(labels: Record<string, string>, value?: string | null) {
  if (!value) return ''
  return labels[value] || value
}

export function optionValue(labels: Record<string, string>, value?: unknown, fallback = '') {
  const text = value == null ? '' : String(value).trim()
  if (!text) return fallback
  const matched = Object.entries(labels).find(([key, label]) => key === text || label === text)
  return matched?.[0] || text
}

export function userDisplayName(
  user?: { userName?: string | null; nickName?: string | null } | null,
) {
  return user?.nickName || user?.userName || ''
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-CN')
}

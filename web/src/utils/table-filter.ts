import { ALL_OPTION_VALUE } from '@/views/bug/shared/bug-options'

export function normalizeAllOption(value?: string, allValue = ALL_OPTION_VALUE) {
  return value && value !== allValue ? value : undefined
}

export function normalizeText(value?: string) {
  const text = value?.trim()
  return text || undefined
}

export function normalizeNumber(value?: string) {
  if (value === undefined || value === '') return undefined
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

export function toLocalDateBoundaryIso(value: string, boundary: 'start' | 'end') {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const date =
    boundary === 'start'
      ? new Date(year, month - 1, day, 0, 0, 0, 0)
      : new Date(year, month - 1, day, 23, 59, 59, 999)
  return date.toISOString()
}

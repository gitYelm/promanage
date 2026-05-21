export type SortOrder = 'asc' | 'desc' | ''

export interface SortableQueryState {
  pageNum?: number
  sortBy?: string
  sortOrder?: SortOrder
}

/**
 * 表头排序统一三态切换：
 * 未排序 → 升序 → 降序 → 取消排序。
 * 后端分页表格切换排序时必须回到第一页，避免用户停留在旧页码导致误判数据缺失。
 */
export function toggleTableSort(query: SortableQueryState, key: string) {
  if (query.sortBy !== key) {
    query.sortBy = key
    query.sortOrder = 'asc'
  } else if (query.sortOrder === 'asc') {
    query.sortOrder = 'desc'
  } else {
    query.sortBy = ''
    query.sortOrder = ''
  }
  query.pageNum = 1
}

type SortValue = string | number | Date | null | undefined

/**
 * 本地快照表格排序工具。
 * 仅在非后端分页数据使用，后端分页表格必须优先把 sortBy/sortOrder 传给接口处理。
 */
export function sortRowsByState<T>(
  rows: T[],
  state: Pick<SortableQueryState, 'sortBy' | 'sortOrder'>,
  getters: Record<string, (row: T) => SortValue>,
) {
  const getter = state.sortBy ? getters[state.sortBy] : undefined
  if (!getter || !state.sortOrder) return rows
  const factor = state.sortOrder === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => compareSortValue(getter(a), getter(b)) * factor)
}

function compareSortValue(a: SortValue, b: SortValue) {
  const left = normalizeSortValue(a)
  const right = normalizeSortValue(b)
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right), 'zh-CN', { numeric: true })
}

function normalizeSortValue(value: SortValue) {
  if (value instanceof Date) return value.getTime()
  if (value === null || value === undefined) return ''
  return value
}

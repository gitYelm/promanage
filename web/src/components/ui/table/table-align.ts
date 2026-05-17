const CENTER_EXACT_LABELS = new Set([
  '状态',
  '登录状态',
  '风险',
  '风险等级',
  '优先级',
  '严重',
  '严重程度',
  '阶段',
  '默认',
  '系统内置',
])

const CENTER_SUFFIXES = ['状态', '风险', '优先级', '严重程度', '类型']
const RIGHT_KEYWORDS = [
  '排序',
  '数量',
  '金额',
  '百分比',
  '关闭率',
  '行数',
  '调用次数',
  '平均耗时',
  '最大耗时',
  '耗时',
  '天数',
  '时长',
  '进度',
  '完成率',
  '占比',
  '总大小',
  '数据大小',
  '索引大小',
]

export function slotTextFromNodes(nodes: unknown): string {
  if (typeof nodes === 'string' || typeof nodes === 'number') return String(nodes)
  if (Array.isArray(nodes)) return nodes.map(slotTextFromNodes).join('')
  if (nodes && typeof nodes === 'object' && 'children' in nodes) {
    return slotTextFromNodes((nodes as { children?: unknown }).children)
  }
  return ''
}

export function hasTextAlignClass(value: unknown): boolean {
  if (!value) return false
  if (typeof value === 'string') return /(^|\s)text-(left|center|right|start|end|justify)(\s|$)/.test(value)
  if (Array.isArray(value)) return value.some(hasTextAlignClass)
  if (typeof value === 'object') {
    return Object.entries(value).some(([className, enabled]) => Boolean(enabled) && hasTextAlignClass(className))
  }
  return false
}

export function inferTableAlignClass(label?: string): string | undefined {
  const text = label?.replace(/\s+/g, '') || ''
  if (!text) return undefined
  if (text === '快捷操作') return 'text-left'
  if (text === '操作') return 'text-right'
  if (CENTER_EXACT_LABELS.has(text) || CENTER_SUFFIXES.some((suffix) => text.endsWith(suffix))) return 'text-center'
  if (RIGHT_KEYWORDS.some((keyword) => text.includes(keyword))) return 'text-right'
  return undefined
}

export function inferTableCellAlignClass(cell?: HTMLTableCellElement | null): string | undefined {
  if (!cell) return undefined
  const table = cell.closest('table')
  const header = table?.tHead?.rows?.[0]?.cells?.[cell.cellIndex]
  return inferTableAlignClass(header?.textContent || '')
}

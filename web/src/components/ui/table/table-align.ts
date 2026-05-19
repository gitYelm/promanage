interface RouteActionColumnRule {
  pattern: RegExp
  operationPermissions?: string[]
  quickActionPermissions?: string[]
}

const ROUTE_ACTION_COLUMN_RULES: RouteActionColumnRule[] = [
  {
    pattern: /\/system\/user(?:\/|$)/,
    operationPermissions: [
      'system:user:query',
      'system:user:edit',
      'system:user:resetPwd',
      'system:user:remove',
    ],
  },
  {
    pattern: /\/system\/role(?:\/|$)/,
    operationPermissions: ['system:role:query', 'system:role:edit', 'system:role:remove'],
  },
  {
    pattern: /\/system\/dept(?:\/|$)/,
    operationPermissions: ['system:dept:add', 'system:dept:edit', 'system:dept:remove'],
  },
  {
    pattern: /\/system\/menu(?:\/|$)/,
    operationPermissions: ['system:menu:add', 'system:menu:edit', 'system:menu:remove'],
  },
  {
    pattern: /\/system\/post(?:\/|$)/,
    operationPermissions: ['system:post:edit', 'system:post:remove'],
  },
  {
    pattern: /\/system\/dict(?:\/|$)/,
    operationPermissions: ['system:dict:edit', 'system:dict:remove'],
  },
  {
    pattern: /\/system\/notice(?:\/|$)/,
    operationPermissions: ['system:notice:query', 'system:notice:edit', 'system:notice:remove'],
  },
  {
    pattern: /\/system\/config(?:\/|$)/,
    operationPermissions: ['system:config:edit', 'system:config:remove'],
  },
  {
    pattern: /\/system\/workspace-config(?:\/|$)/,
    operationPermissions: ['system:workspace:edit', 'system:workspace:remove'],
  },
  {
    pattern: /\/monitor\/job(?:\/|$)/,
    operationPermissions: ['monitor:job:edit', 'monitor:job:remove', 'monitor:job:changeStatus'],
  },
  { pattern: /\/monitor\/online(?:\/|$)/, operationPermissions: ['monitor:online:forceLogout'] },
  { pattern: /\/monitor\/operlog(?:\/|$)/, operationPermissions: ['monitor:operlog:query'] },
  { pattern: /\/monitor\/logininfor(?:\/|$)/, operationPermissions: ['monitor:logininfor:query'] },
  {
    pattern: /\/(?:bug|project-management)\/projects(?:\/|$)/,
    operationPermissions: ['bug:project:edit', 'bug:project:remove'],
    quickActionPermissions: ['bug:project:member'],
  },
  {
    pattern: /\/(?:bug|project-management)\/modules(?:\/|$)/,
    operationPermissions: ['bug:module:edit', 'bug:module:remove'],
  },
  {
    pattern: /\/(?:bug|project-management)\/versions(?:\/|$)/,
    operationPermissions: ['bug:version:edit', 'bug:version:remove'],
  },
  {
    pattern: /\/project-management\/requirements(?:\/|$)/,
    operationPermissions: ['pm:requirement:view', 'pm:requirement:update'],
    quickActionPermissions: ['pm:requirement:status', 'pm:requirement:review'],
  },
  {
    pattern: /\/project-management\/iterations(?:\/|$)/,
    operationPermissions: ['pm:iteration:manage'],
    quickActionPermissions: ['pm:iteration:manage'],
  },
  {
    pattern: /\/project-management\/milestones(?:\/|$)/,
    operationPermissions: ['pm:milestone:manage'],
    quickActionPermissions: ['pm:milestone:manage'],
  },
  {
    pattern: /\/bug\/(?:tickets|my)(?:\/|$)/,
    operationPermissions: ['bug:ticket:query'],
    quickActionPermissions: [
      'bug:ticket:assign',
      'bug:ticket:changeStatus',
      'bug:ticket:confirm',
      'bug:ticket:reject',
      'bug:ticket:startFix',
      'bug:ticket:submitVerify',
      'bug:ticket:verify',
      'bug:ticket:close',
      'bug:ticket:reopen',
    ],
  },
]

function actionColumnRuleForPath(pathname = globalThis.window?.location?.pathname || '') {
  return ROUTE_ACTION_COLUMN_RULES.find((item) => item.pattern.test(pathname))
}

export function actionColumnPermissionsForPath(
  pathname = globalThis.window?.location?.pathname || '',
): string[] {
  const rule = actionColumnRuleForPath(pathname)
  return [...(rule?.operationPermissions || []), ...(rule?.quickActionPermissions || [])]
}

export function actionColumnPermissionsForLabel(label?: string, pathname?: string): string[] {
  const text = label?.replace(/\s+/g, '') || ''
  const rule = actionColumnRuleForPath(pathname)
  if (text === '操作') return rule?.operationPermissions || []
  if (text === '快捷操作') return rule?.quickActionPermissions || []
  return []
}

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
  if (typeof value === 'string')
    return /(^|\s)text-(left|center|right|start|end|justify)(\s|$)/.test(value)
  if (Array.isArray(value)) return value.some(hasTextAlignClass)
  if (typeof value === 'object') {
    return Object.entries(value).some(
      ([className, enabled]) => Boolean(enabled) && hasTextAlignClass(className),
    )
  }
  return false
}

export function inferTableAlignClass(label?: string): string | undefined {
  const text = label?.replace(/\s+/g, '') || ''
  if (!text) return undefined
  if (text === '快捷操作') return 'text-left'
  if (text === '操作') return 'text-right'
  if (CENTER_EXACT_LABELS.has(text) || CENTER_SUFFIXES.some((suffix) => text.endsWith(suffix)))
    return 'text-center'
  if (RIGHT_KEYWORDS.some((keyword) => text.includes(keyword))) return 'text-right'
  return undefined
}

export function inferTableCellAlignClass(cell?: HTMLTableCellElement | null): string | undefined {
  if (!cell) return undefined
  const table = cell.closest('table')
  const header = table?.tHead?.rows?.[0]?.cells?.[cell.cellIndex]
  return inferTableAlignClass(header?.textContent || '')
}

export function isActionColumnLabel(label?: string): boolean {
  const text = label?.replace(/\s+/g, '') || ''
  return text === '操作' || text === '快捷操作'
}

export function isEffectivelyEmptyTableCell(cell: HTMLTableCellElement): boolean {
  const interactiveSelector = [
    'button',
    'a',
    '[role="button"]',
    'input',
    'select',
    'textarea',
    '[data-action-column-content]',
  ].join(',')
  const visibleInteractiveElements = Array.from(
    cell.querySelectorAll<HTMLElement>(interactiveSelector),
  ).filter(
    (element) =>
      element.getAttribute('aria-hidden') !== 'true' && !element.closest('[aria-hidden="true"]'),
  )

  return !cell.textContent?.trim() && visibleInteractiveElements.length === 0
}

export function updateEmptyActionColumnVisibility(headerCell?: HTMLTableCellElement | null) {
  if (!headerCell || !isActionColumnLabel(headerCell.textContent || '')) return
  const table = headerCell.closest('table')
  const columnIndex = Array.from(headerCell.parentElement?.children || []).indexOf(headerCell)
  if (columnIndex < 0) return
  const bodyCells = Array.from(table?.tBodies || []).flatMap((body) =>
    Array.from(body.rows).reduce<HTMLTableCellElement[]>((cells, row) => {
      const cell = row.cells[columnIndex]
      if (cell) cells.push(cell)
      return cells
    }, []),
  )
  const shouldHide = bodyCells.length > 0 && bodyCells.every(isEffectivelyEmptyTableCell)
  headerCell.toggleAttribute('data-empty-action-column', shouldHide)
  bodyCells.forEach((cell) => cell.toggleAttribute('data-empty-action-column', shouldHide))
}

import { useTableColumns, type TableColumnConfig } from '@/composables/useTableColumns'

const defaultColumns: TableColumnConfig[] = [
  { key: 'ticketNo', label: '编号', visible: true, fixed: true },
  { key: 'title', label: '标题', visible: true, fixed: true },
  { key: 'project', label: '项目', visible: true },
  { key: 'module', label: '模块', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'severity', label: '严重', visible: true },
  { key: 'priority', label: '优先级', visible: true },
  { key: 'assignee', label: '负责人', visible: true },
  { key: 'createTime', label: '创建时间', visible: true },
  { key: 'quickActions', label: '快捷操作', visible: true, fixed: true },
  { key: 'actions', label: '操作', visible: true, fixed: true },
]

export function useBugTicketColumns() {
  return useTableColumns('bug-ticket-table-columns', defaultColumns)
}

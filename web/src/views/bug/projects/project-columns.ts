import { useTableColumns, type TableColumnConfig } from '@/composables/useTableColumns'

const defaultColumns: TableColumnConfig[] = [
  { key: 'projectName', label: '名称', visible: true, fixed: true },
  { key: 'projectKey', label: '标识', visible: true },
  { key: 'owner', label: '负责人', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'description', label: '描述', visible: true },
  { key: 'quickActions', label: '快捷操作', visible: true, fixed: true },
  { key: 'actions', label: '操作', visible: true, fixed: true },
]

export function useBugProjectColumns() {
  return useTableColumns('bug-project-table-columns', defaultColumns)
}

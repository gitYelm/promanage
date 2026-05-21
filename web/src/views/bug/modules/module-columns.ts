import { useTableColumns, type TableColumnConfig } from '@/composables/useTableColumns'

const defaultColumns: TableColumnConfig[] = [
  { key: 'project', label: '项目', visible: true },
  { key: 'moduleName', label: '模块', visible: true, fixed: true },
  { key: 'orderNum', label: '排序', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'actions', label: '操作', visible: true, fixed: true },
]

export function useBugModuleColumns() {
  return useTableColumns('bug-module-table-columns', defaultColumns)
}

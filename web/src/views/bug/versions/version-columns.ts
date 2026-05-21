import { useTableColumns, type TableColumnConfig } from '@/composables/useTableColumns'

const defaultColumns: TableColumnConfig[] = [
  { key: 'project', label: '项目', visible: true },
  { key: 'versionNo', label: '版本号', visible: true, fixed: true },
  { key: 'versionName', label: '版本名', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'actions', label: '操作', visible: true, fixed: true },
]

export function useBugVersionColumns() {
  return useTableColumns('bug-version-table-columns', defaultColumns)
}

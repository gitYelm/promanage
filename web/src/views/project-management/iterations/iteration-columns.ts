import { useTableColumns, type TableColumnConfig } from '@/composables/useTableColumns'

const defaultColumns: TableColumnConfig[] = [
  { key: 'iterationName', label: '迭代', visible: true, fixed: true },
  { key: 'project', label: '项目', visible: true },
  { key: 'owner', label: '负责人', visible: true },
  { key: 'dateRange', label: '周期', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'riskNote', label: '风险', visible: true },
  { key: 'quickActions', label: '快捷操作', visible: true, fixed: true },
  { key: 'actions', label: '操作', visible: true, fixed: true },
]

export function useIterationColumns() {
  return useTableColumns('pm-iteration-table-columns', defaultColumns)
}

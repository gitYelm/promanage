import { useTableColumns, type TableColumnConfig } from '@/composables/useTableColumns'

const defaultColumns: TableColumnConfig[] = [
  { key: 'milestoneName', label: '里程碑', visible: true, fixed: true },
  { key: 'project', label: '项目', visible: true },
  { key: 'stage', label: '阶段', visible: true },
  { key: 'owner', label: '负责人', visible: true },
  { key: 'targetDate', label: '目标日期', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'quickActions', label: '快捷操作', visible: true, fixed: true },
  { key: 'actions', label: '操作', visible: true, fixed: true },
]

export function useMilestoneColumns() {
  return useTableColumns('pm-milestone-table-columns', defaultColumns)
}

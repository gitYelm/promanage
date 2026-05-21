import { useTableColumns, type TableColumnConfig } from '@/composables/useTableColumns'

const defaultColumns: TableColumnConfig[] = [
  { key: 'requirementNo', label: '编号', visible: true, fixed: true },
  { key: 'title', label: '标题', visible: true, fixed: true },
  { key: 'project', label: '项目', visible: true },
  { key: 'owner', label: '负责人', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'priority', label: '优先级', visible: true },
  { key: 'plannedEndTime', label: '计划完成', visible: true },
  { key: 'quickActions', label: '快捷操作', visible: true, fixed: true },
  { key: 'actions', label: '操作', visible: true, fixed: true },
]

export function useRequirementColumns() {
  return useTableColumns('pm-requirement-table-columns', defaultColumns)
}

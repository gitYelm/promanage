import { useTableColumns, type TableColumnConfig } from '@/composables/useTableColumns'

const defaultColumns: TableColumnConfig[] = [
  { key: 'roleId', label: '角色编号', visible: true, fixed: true },
  { key: 'roleName', label: '角色名称', visible: true, fixed: true },
  { key: 'roleKey', label: '权限字符', visible: true },
  { key: 'securityLevel', label: '安全等级', visible: true },
  { key: 'userCount', label: '用户数', visible: true },
  { key: 'dataScope', label: '数据权限', visible: true },
  { key: 'roleSort', label: '显示顺序', visible: true },
  { key: 'status', label: '状态', visible: true },
  { key: 'createTime', label: '创建时间', visible: true },
  { key: 'actions', label: '操作', visible: true, fixed: true },
]

export function useRoleColumns() {
  return useTableColumns('system-role-table-columns', defaultColumns)
}

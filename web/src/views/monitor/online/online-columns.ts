import { useTableColumns, type TableColumnConfig } from '@/composables/useTableColumns'

const defaultColumns: TableColumnConfig[] = [
  { key: 'tokenId', label: '会话编号', visible: true, fixed: true },
  { key: 'userName', label: '用户名称', visible: true, fixed: true },
  { key: 'ipaddr', label: '主机', visible: true },
  { key: 'loginLocation', label: '登录地点', visible: true },
  { key: 'browser', label: '浏览器', visible: true },
  { key: 'os', label: '操作系统', visible: true },
  { key: 'loginTime', label: '登录时间', visible: true },
  { key: 'onlineDuration', label: '在线时长', visible: true },
  { key: 'actions', label: '操作', visible: true, fixed: true },
]

export function useOnlineColumns() {
  return useTableColumns('monitor-online-table-columns', defaultColumns)
}

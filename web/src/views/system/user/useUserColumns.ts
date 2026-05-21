import { ref } from 'vue'
import type { ColumnConfig } from './UserTable.vue'

const COLUMN_STORAGE_KEY = 'user-table-columns'

const defaultColumns: ColumnConfig[] = [
  { key: 'userId', label: '用户编号', visible: true },
  { key: 'userName', label: '用户名', visible: true, fixed: true },
  { key: 'nickName', label: '用户昵称', visible: true },
  { key: 'dept', label: '部门', visible: true },
  { key: 'phonenumber', label: '手机号码', visible: true },
  { key: 'email', label: '邮箱', visible: false },
  { key: 'status', label: '状态', visible: true },
  { key: 'createTime', label: '创建时间', visible: true },
]

function loadColumnConfig(): ColumnConfig[] {
  try {
    const saved = localStorage.getItem(COLUMN_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as ColumnConfig[]
      return defaultColumns.map((col) => {
        const savedCol = parsed.find((c) => c.key === col.key)
        return savedCol ? { ...col, visible: savedCol.visible } : col
      })
    }
  } catch {
    // 本地存储解析失败时使用默认列，避免用户进入页面失败。
  }
  return defaultColumns.map((c) => ({ ...c }))
}

export function useUserColumns() {
  const columns = ref<ColumnConfig[]>(loadColumnConfig())

  function saveColumnConfig() {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columns.value))
  }

  function toggleColumn(key: string) {
    const col = columns.value.find((c) => c.key === key)
    if (col && !col.fixed) {
      col.visible = !col.visible
      saveColumnConfig()
    }
  }

  function resetColumns() {
    columns.value = defaultColumns.map((c) => ({ ...c }))
    saveColumnConfig()
  }

  return { columns, toggleColumn, resetColumns }
}

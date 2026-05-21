import { computed, ref } from 'vue'

export interface TableColumnConfig {
  key: string
  label: string
  visible: boolean
  fixed?: boolean
}

export function useTableColumns(storageKey: string, defaultColumns: TableColumnConfig[]) {
  function loadColumnConfig() {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as TableColumnConfig[]
        return defaultColumns.map((column) => {
          const savedColumn = parsed.find((item) => item.key === column.key)
          return savedColumn ? { ...column, visible: savedColumn.visible } : { ...column }
        })
      }
    } catch {
      // 本地存储异常时使用默认列配置。
    }
    return defaultColumns.map((column) => ({ ...column }))
  }

  const columns = ref<TableColumnConfig[]>(loadColumnConfig())

  function saveColumnConfig() {
    localStorage.setItem(storageKey, JSON.stringify(columns.value))
  }

  function toggleColumn(key: string) {
    const column = columns.value.find((item) => item.key === key)
    if (!column || column.fixed) return
    column.visible = !column.visible
    saveColumnConfig()
  }

  function resetColumns() {
    columns.value = defaultColumns.map((column) => ({ ...column }))
    saveColumnConfig()
  }

  const visibleColumnMap = computed(
    () =>
      Object.fromEntries(columns.value.map((column) => [column.key, column.visible])) as Record<
        string,
        boolean
      >,
  )

  return {
    columns,
    visibleColumnMap,
    toggleColumn,
    resetColumns,
  }
}

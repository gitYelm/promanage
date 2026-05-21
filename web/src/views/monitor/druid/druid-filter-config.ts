export const DRUID_ALL_VALUE = '__all__'

export const tableFilterFields = [{ label: '表名', key: 'tableName', placeholder: '请输入表名' }]
export const tableExpandedFields = [
  { label: '行数', type: 'number-range' as const, startKey: 'rowCountMin', endKey: 'rowCountMax', min: 0 },
]
export const connectionExpandedFields = [
  { label: '当前查询', key: 'query', placeholder: '请输入查询关键字' },
  { label: '连接时间', type: 'datetime-range' as const, startKey: 'backendStartBegin', endKey: 'backendStartEnd' },
]
export const slowFilterFields = [{ label: '查询语句', key: 'query', placeholder: '请输入查询关键字' }]
export const slowExpandedFields = [
  { label: '调用次数', type: 'number-range' as const, startKey: 'callsMin', endKey: 'callsMax', min: 0 },
]

export function createDruidTableQuery() {
  return {
    tableName: '',
    rowCountMin: undefined as number | undefined,
    rowCountMax: undefined as number | undefined,
    sortBy: '',
    sortOrder: '' as 'asc' | 'desc' | '',
  }
}

export function createDruidConnectionQuery() {
  return {
    state: DRUID_ALL_VALUE,
    clientAddr: '',
    query: '',
    backendStartBegin: '',
    backendStartEnd: '',
    sortBy: '',
    sortOrder: '' as 'asc' | 'desc' | '',
  }
}

export function createDruidSlowQuery() {
  return {
    query: '',
    callsMin: undefined as number | undefined,
    callsMax: undefined as number | undefined,
    sortBy: '',
    sortOrder: '' as 'asc' | 'desc' | '',
  }
}

export function resetDruidTableQuery(query: ReturnType<typeof createDruidTableQuery>) {
  Object.assign(query, createDruidTableQuery())
}

export function resetDruidConnectionQuery(query: ReturnType<typeof createDruidConnectionQuery>) {
  Object.assign(query, createDruidConnectionQuery())
}

export function resetDruidSlowQuery(query: ReturnType<typeof createDruidSlowQuery>) {
  Object.assign(query, createDruidSlowQuery())
}

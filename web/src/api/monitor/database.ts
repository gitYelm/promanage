import request from '@/utils/request'

export interface TableStats {
  tableName: string
  rowCount: number
  totalSize: string
  dataSize: string
  indexSize: string
}

export interface SlowQuery {
  query: string
  calls: number
  totalTime: string
  avgTime: string
  maxTime: string
}

export interface ConnectionInfo {
  pid: number
  state: string
  query: string
  clientAddr: string
  backendStart: string
  queryStart: string | null
}

export interface DatabaseInfo {
  database: {
    version: string
    size: string
    name: string
  }
  connections: {
    max: number
    active: number
    idle: number
    total: number
    usage: number
  }
  tables: TableStats[]
  activeConnections: ConnectionInfo[]
  slowQueries: SlowQuery[]
}

export function getDatabase() {
  return request<{ data: DatabaseInfo }>({
    url: '/monitor/database',
    method: 'get',
  }).then((res: any) => res.data)
}

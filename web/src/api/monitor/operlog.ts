import request from '@/utils/request'
import { type SysOperLog } from '@/api/system/types'

export interface OperLogQuery {
  title?: string
  operName?: string
  status?: string
  businessType?: string
  beginTime?: string
  endTime?: string
  pageNum?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc' | ''
}

export function listOperLog(query: OperLogQuery) {
  return request<{ data: { rows: SysOperLog[]; total: number } }>({
    url: '/monitor/operlog',
    method: 'get',
    params: query,
  }).then((res: any) => res.data)
}

export function delOperLog(operIds: string[]) {
  return request({
    url: '/monitor/operlog',
    method: 'delete',
    params: { ids: operIds.join(',') },
  }).then((res: any) => res)
}

export function cleanOperLog() {
  return request({
    url: '/monitor/operlog/clean',
    method: 'get',
  }).then((res: any) => res)
}

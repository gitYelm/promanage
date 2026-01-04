import request from '@/utils/request'
import { type SysLoginLog, type PageResult } from '@/api/system/types'

/** 登录日志查询参数 */
export interface LogininforQuery {
  userName?: string
  status?: string
  ipaddr?: string
  beginTime?: string
  endTime?: string
  pageNum: number
  pageSize: number
}

export function listLogininfor(query: LogininforQuery): Promise<PageResult<SysLoginLog>> {
  return request<{ data: PageResult<SysLoginLog> }>({
    url: '/monitor/logininfor',
    method: 'get',
    params: query,
  }).then((res: unknown) => (res as { data: PageResult<SysLoginLog> }).data)
}

export function delLogininfor(infoIds: string[]) {
  return request<{ msg: string }>({
    url: '/monitor/logininfor',
    method: 'delete',
    params: { ids: infoIds.join(',') },
  })
}

export function cleanLogininfor() {
  return request<{ msg: string }>({
    url: '/monitor/logininfor/clean',
    method: 'get',
  })
}

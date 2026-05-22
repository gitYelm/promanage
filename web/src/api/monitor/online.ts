import request from '@/utils/request'
import { type PageQuery, type PageResult } from '@/api/system/types'

export interface SysUserOnline {
  tokenId: string
  userName: string
  ipaddr: string
  loginLocation: string
  browser: string
  os: string
  loginTime: string
  /** 在线时长（毫秒） */
  onlineDuration: number
}

/** 在线用户查询参数 */
export interface OnlineQuery extends PageQuery {
  userName?: string
  ipaddr?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc' | ''
}

export function listOnline(query: OnlineQuery): Promise<PageResult<SysUserOnline>> {
  return request<{ data: PageResult<SysUserOnline> }>({
    url: '/monitor/online/list',
    method: 'get',
    params: query,
  }).then((res: unknown) => (res as { data: PageResult<SysUserOnline> }).data)
}

export function forceLogout(tokenId: string) {
  return request<{ msg: string }>({
    url: `/monitor/online/${tokenId}`,
    method: 'delete',
  })
}

export function createOnlineStreamToken(): Promise<{ token: string; expiresIn: number }> {
  return request<{ data: { token: string; expiresIn: number } }>({
    url: '/monitor/online/stream-token',
    method: 'get',
  }).then((res: unknown) => (res as { data: { token: string; expiresIn: number } }).data)
}

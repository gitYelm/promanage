import request from '@/utils/request'
import { type SysConfig, type ConfigQuery, type PageResult } from './types'

export type { SysConfig } from './types'

/** 参数配置创建/更新参数 */
export interface ConfigForm {
  configId?: string
  configName?: string
  configKey?: string
  configValue?: string
  configType?: string
  remark?: string
}

export function listConfig(query: ConfigQuery) {
  return request<{ data: PageResult<SysConfig> }>({
    url: '/system/config',
    method: 'get',
    params: query,
  }).then((res: any) => res.data)
}

export function getConfig(configId: string) {
  return request<{ data: SysConfig }>({
    url: `/system/config/${configId}`,
    method: 'get',
  }).then((res: any) => res.data)
}

export function addConfig(data: ConfigForm) {
  return request({
    url: '/system/config',
    method: 'post',
    data,
  })
}

export function updateConfig(data: ConfigForm) {
  return request({
    url: `/system/config/${data.configId}`,
    method: 'put',
    data,
  })
}

export function delConfig(configIds: string[]) {
  return request({
    url: '/system/config',
    method: 'delete',
    params: { ids: configIds.join(',') },
  })
}

export function refreshCache() {
  return request({
    url: '/system/config/refreshCache',
    method: 'get',
  })
}

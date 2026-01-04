import request from '@/utils/request'

export interface CacheInfo {
  redis_version: string
  redis_mode: string
  tcp_port: string
  connected_clients: string
  uptime_in_days: string
  used_memory_human: string
  used_memory_peak_human: string
  maxmemory_human: string
  aof_enabled: string
  rdb_last_bgsave_status: string
  dbSize: number
  commandStats: { name: string; value: string }[]
  isMemoryMode: boolean
}

export function getCache() {
  return request<{ data: CacheInfo }>({
    url: '/monitor/cache',
    method: 'get',
  }).then((res: any) => res.data)
}

export function clearCacheName(cacheName: string) {
  return request<{ msg: string; code: number }>({
    url: '/monitor/cache/clearCacheName',
    method: 'get',
    params: { cacheName },
  }).then((res: any) => res)
}

export function clearCacheAll() {
  return request<{ msg: string; code: number }>({
    url: '/monitor/cache/clearCacheAll',
    method: 'get',
  }).then((res: any) => res)
}

export function listCacheName() {
  return request<{ data: any[] }>({
    url: '/monitor/cache/listCacheName',
    method: 'get',
  }).then((res: any) => res.data)
}

export function listCacheKey(cacheName: string) {
  return request<{ data: string[] }>({
    url: '/monitor/cache/listCacheKey',
    method: 'get',
    params: { cacheName },
  }).then((res: any) => res.data)
}

export function getCacheValue(cacheName: string, cacheKey: string) {
  return request<{ data: any }>({
    url: '/monitor/cache/getCacheValue',
    method: 'get',
    params: { cacheName, cacheKey },
  }).then((res: any) => res.data)
}

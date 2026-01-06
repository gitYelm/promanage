import { Injectable } from '@nestjs/common'
import { RedisService } from '../../redis/redis.service'

function parseInfo(info: string) {
  const map = new Map<string, string>()
  // Redis INFO 返回的行可能包含 \r\n，需要处理
  info.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    const m = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.+)$/)
    if (m) map.set(m[1], m[2].trim())
  })
  return map
}

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  async getCache() {
    const client = this.redis.getClient()
    const info = await client.info()
    const map = parseInfo(info)
    const commandStats: { name: string; value: string }[] = []
    const cmd = await client.info('commandstats')
    // Redis 8.0+ 命令名可能包含 | 符号（如 config|get）
    cmd.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      // 直接匹配 cmdstat_xxx:calls=数字，避免贪婪匹配到 rejected_calls
      const m = trimmed.match(/^cmdstat_([^:]+):calls=(\d+)/)
      if (m) {
        // 将 | 替换为更友好的显示格式
        const name = m[1].replace(/\|/g, ':')
        commandStats.push({ name, value: m[2] })
      }
    })
    // 按调用次数降序排序，只取前 15 个
    commandStats.sort((a, b) => parseInt(b.value) - parseInt(a.value))
    const topStats = commandStats.slice(0, 15)
    const dbSize = await client.dbsize()
    const isMemoryMode = !this.redis.isUsingRealRedis()
    return {
      redis_version: map.get('redis_version') || '',
      redis_mode: map.get('redis_mode') || '',
      tcp_port: map.get('tcp_port') || '',
      connected_clients: map.get('connected_clients') || '',
      uptime_in_days: map.get('uptime_in_days') || '',
      used_memory_human: map.get('used_memory_human') || '',
      used_memory_peak_human: map.get('used_memory_peak_human') || '',
      maxmemory_human: map.get('maxmemory_human') || '0B',
      aof_enabled: map.get('aof_enabled') || '',
      rdb_last_bgsave_status: map.get('rdb_last_bgsave_status') || '',
      dbSize,
      commandStats: topStats,
      isMemoryMode,
    }
  }

  async clearCacheName(cacheName: string) {
    const client = this.redis.getClient()
    const iter = client.scanStream({ match: `${cacheName}:*`, count: 100 })
    const keys: string[] = []
    return new Promise<void>((resolve) => {
      iter.on('data', (ks: string[]) => keys.push(...ks))
      iter.on('end', () => {
        if (keys.length) {
          for (const k of keys) void client.del(k)
        }
        resolve()
      })
    })
  }

  async clearCacheAll() {
    const client = this.redis.getClient()
    await client.flushdb()
  }

  async listCacheName() {
    const client = this.redis.getClient()
    const iter = client.scanStream({ match: '*', count: 100 })
    const names = new Set<string>()
    return new Promise<{ cacheName: string; remark: string }[]>((resolve) => {
      iter.on('data', (ks: string[]) => {
        ks.forEach((k) => {
          const idx = k.indexOf(':')
          if (idx > 0) names.add(k.substring(0, idx))
        })
      })
      iter.on('end', () => {
        resolve(Array.from(names).map((n) => ({ cacheName: n, remark: '' })))
      })
    })
  }

  async listCacheKey(cacheName: string) {
    const client = this.redis.getClient()
    const iter = client.scanStream({ match: `${cacheName}:*`, count: 100 })
    const keys: string[] = []
    return new Promise<string[]>((resolve) => {
      iter.on('data', (ks: string[]) => keys.push(...ks))
      iter.on('end', () => resolve(keys))
    })
  }

  async getCacheValue(cacheName: string, cacheKey: string) {
    const client = this.redis.getClient()
    const key = `${cacheName}:${cacheKey}`
    const value = await client.get(key)
    return { cacheName, cacheKey, cacheValue: value, remark: '' }
  }
}

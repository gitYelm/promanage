import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

type MultiCmd = {
  type: 'set' | 'sadd' | 'del' | 'srem'
  key: string
  value?: string
}

class InMemoryRedisClient {
  private kv = new Map<string, { value: string; expiresAt?: number }>()
  private sets = new Map<string, Set<string>>()
  private stats = { get: 0, set: 0, del: 0 }

  setex(key: string, ttlSeconds: number, value: string) {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.kv.set(key, { value, expiresAt })
    this.stats.set++
    return Promise.resolve('OK')
  }

  exists(key: string) {
    const item = this.kv.get(key)
    if (!item) return Promise.resolve(0)
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.kv.delete(key)
      return Promise.resolve(0)
    }
    return Promise.resolve(1)
  }

  set(key: string, value: string) {
    this.kv.set(key, { value })
    this.stats.set++
    return this
  }

  get(key: string) {
    const item = this.kv.get(key)
    if (!item) return Promise.resolve(null)
    this.stats.get++
    return Promise.resolve(item.value)
  }

  del(key: string) {
    this.kv.delete(key)
    this.stats.del++
    return this
  }

  sadd(setKey: string, member: string) {
    const s = this.sets.get(setKey) || new Set<string>()
    s.add(member)
    this.sets.set(setKey, s)
    return this
  }

  srem(setKey: string, member: string) {
    const s = this.sets.get(setKey) || new Set<string>()
    s.delete(member)
    this.sets.set(setKey, s)
    return this
  }

  smembers(setKey: string) {
    const s = this.sets.get(setKey) || new Set<string>()
    return Promise.resolve(Array.from(s.values()))
  }

  info(section?: string) {
    if (section === 'commandstats') {
      const lines = [
        `cmdstat_get:calls=${this.stats.get}`,
        `cmdstat_set:calls=${this.stats.set}`,
        `cmdstat_del:calls=${this.stats.del}`,
      ]
      return Promise.resolve(lines.join('\n') + '\n')
    }
    const connected_clients = String(this.sets.size)
    const dbSize = String(this.kv.size)
    const map = [
      `redis_version:mock-1.0`,
      `redis_mode:standalone`,
      `tcp_port:0`,
      `connected_clients:${connected_clients}`,
      `uptime_in_days:0`,
      `used_memory_human:0M`,
      `used_cpu_user_children:0`,
      `maxmemory_human:0`,
      `aof_enabled:0`,
      `rdb_last_bgsave_status:ok`,
      `dbSize:${dbSize}`,
    ]
    return Promise.resolve(map.join('\n') + '\n')
  }

  dbsize() {
    return Promise.resolve(this.kv.size)
  }

  flushdb() {
    this.kv.clear()
    this.sets.clear()
    return Promise.resolve('OK')
  }

  scanStream(opts: { match: string; count: number }) {
    const allKeys = Array.from(this.kv.keys())
    const pattern = new RegExp('^' + opts.match.replace('*', '.*') + '$')
    const keys = allKeys.filter((k) => pattern.test(k))
    const listeners: Record<string, Array<(arg: any) => void>> = {
      data: [],
      end: [],
    }
    setTimeout(() => {
      const chunk = keys.slice(0, opts.count)
      listeners.data.forEach((fn) => fn(chunk))
      listeners.end.forEach((fn) => fn(undefined))
    }, 0)
    return {
      on: (evt: 'data' | 'end', fn: (arg: any) => void) => {
        listeners[evt].push(fn)
      },
    }
  }

  multi(): {
    set: (key: string, value: string) => InMemoryRedisClient
    sadd: (key: string, value: string) => InMemoryRedisClient
    del: (key: string) => InMemoryRedisClient
    srem: (key: string, value: string) => InMemoryRedisClient
    exec: () => Promise<any[]>
  } {
    const cmds: MultiCmd[] = []
    return {
      set: (key: string, value: string) => {
        cmds.push({ type: 'set', key, value })
        return this
      },
      sadd: (key: string, value: string) => {
        cmds.push({ type: 'sadd', key, value })
        return this
      },
      del: (key: string) => {
        cmds.push({ type: 'del', key })
        return this
      },
      srem: (key: string, value: string) => {
        cmds.push({ type: 'srem', key, value })
        return this
      },
      exec: () => {
        for (const c of cmds) {
          switch (c.type) {
            case 'set':
              this.set(c.key, c.value || '')
              break
            case 'sadd':
              this.sadd(c.key, c.value || '')
              break
            case 'del':
              this.del(c.key)
              break
            case 'srem':
              this.srem(c.key, c.value || '')
              break
          }
        }
        return Promise.resolve([])
      },
    }
  }

  pipeline(): {
    get: (key: string) => InMemoryRedisClient
    exec: () => Promise<Array<[null, string | null]>>
  } {
    const ops: Array<() => Promise<string | null>> = []
    return {
      get: (key: string) => {
        ops.push(() => this.get(key))
        return this
      },
      exec: async () => {
        const results = [] as Array<[null, string | null]>
        for (const op of ops) {
          const val = await op()
          results.push([null, val])
        }
        return results
      },
    }
  }
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis | InMemoryRedisClient
  private isRealRedis: boolean

  constructor(private configService: ConfigService) {
    const redisEnabled = configService.get<string>('REDIS_ENABLED', 'false')
    this.isRealRedis = redisEnabled.toLowerCase() === 'true'

    if (this.isRealRedis) {
      const redisUrl = configService.get<string>('REDIS_URL', 'redis://127.0.0.1:6379')
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn(`Redis 连接失败 ${times} 次，切换到内存模式`)
            return null // 停止重试
          }
          return Math.min(times * 200, 2000)
        },
        lazyConnect: true,
      })

      // 尝试连接
      this.client
        .connect()
        .then(() => {
          this.logger.log('Redis 连接成功')
        })
        .catch((err: Error) => {
          this.logger.warn(`Redis 连接失败: ${err.message}，切换到内存模式`)
          this.client = new InMemoryRedisClient()
          this.isRealRedis = false
        })
    } else {
      this.client = new InMemoryRedisClient()
      this.logger.log('使用内存模式（REDIS_ENABLED=false）')
    }
  }

  getClient(): Redis | InMemoryRedisClient {
    return this.client
  }

  /** 是否使用真实 Redis */
  isUsingRealRedis(): boolean {
    return this.isRealRedis
  }

  onModuleDestroy() {
    if (this.isRealRedis && this.client instanceof Redis) {
      this.client.disconnect()
      this.logger.log('Redis 连接已关闭')
    }
  }
}

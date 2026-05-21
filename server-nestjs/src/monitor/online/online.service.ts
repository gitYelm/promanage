import { Injectable } from '@nestjs/common'
import { QueryOnlineDto } from './dto/query-online.dto'
import { LoggerService } from '../../common/logger/logger.service'
import { IpUtil } from '../../common/utils/ip.util'
import { RedisService } from '../../redis/redis.service'
import { resolveSortDirection } from '../../common/utils/sort-order.util'

export interface OnlineUser {
  token: string
  userName: string
  ipaddr: string
  loginTime: Date | string
  browser?: string
  os?: string
  /** 过期时间（秒），与 JWT 过期时间一致 */
  ttl?: number
}

export interface OnlineUserRow {
  tokenId: string
  userName: string
  ipaddr: string
  loginLocation: string
  browser: string
  os: string
  loginTime: string
  onlineDuration: number
}

const ONLINE_KEY_PREFIX = 'online:user:'
const ONLINE_SET_KEY = 'online:users'
/** 默认会话超时时间（秒），实际由调用方传入 ttl */
const DEFAULT_SESSION_TIMEOUT = 30 * 60

/**
 * 在线用户服务
 *
 * 存储模式由 REDIS_ENABLED 环境变量控制：
 * - REDIS_ENABLED=true：使用真实 Redis 存储，支持多实例共享
 * - REDIS_ENABLED=false：使用内存模式（InMemoryRedisClient），重启后数据丢失
 *
 * 通过 RedisService 统一封装，无需在此处判断模式
 */
@Injectable()
export class OnlineService {
  constructor(
    private logger: LoggerService,
    private redis: RedisService,
  ) {}

  async add(user: OnlineUser) {
    const client = this.redis.getClient()
    const key = this.redis.toStorageKey(ONLINE_KEY_PREFIX + user.token)
    const setKey = this.redis.toStorageKey(ONLINE_SET_KEY)
    const { ttl, ...userData } = user
    const data = JSON.stringify({
      ...userData,
      loginTime: user.loginTime instanceof Date ? user.loginTime.toISOString() : user.loginTime,
    })

    // 使用调用方传入的 ttl（来自 SecurityConfigService），否则使用默认值
    const expireSeconds = ttl || DEFAULT_SESSION_TIMEOUT

    // 存储用户信息（带过期时间），并添加到在线用户集合
    await client.setex(key, expireSeconds, data)
    await client.sadd(setKey, user.token)

    this.logger.debug(
      `用户上线: ${user.userName} (IP: ${user.ipaddr}, TTL: ${expireSeconds}s)`,
      'OnlineService',
    )
  }

  async remove(token: string) {
    const client = this.redis.getClient()
    const key = this.redis.toStorageKey(ONLINE_KEY_PREFIX + token)
    const setKey = this.redis.toStorageKey(ONLINE_SET_KEY)

    // 获取用户信息用于日志
    const data = await client.get(key)
    if (data) {
      const user = JSON.parse(data) as OnlineUser
      this.logger.debug(`用户下线: ${user.userName}`, 'OnlineService')
    }

    // 删除用户信息和集合中的记录
    const multi = client.multi()
    multi.del(key)
    multi.srem(setKey, token)
    await multi.exec()
  }

  /**
   * 获取指定账号当前全部在线 Token。
   * 用于实现“禁止多点登录”时，新登录踢掉旧会话。
   */
  async getTokensByUserName(userName: string): Promise<string[]> {
    const client = this.redis.getClient()
    const setKey = this.redis.toStorageKey(ONLINE_SET_KEY)
    const tokens = await client.smembers(setKey)
    if (!tokens.length) return []

    const matchedTokens: string[] = []
    const invalidTokens: string[] = []
    const pipeline = client.pipeline()
    for (const token of tokens) {
      pipeline.get(this.redis.toStorageKey(ONLINE_KEY_PREFIX + token))
    }
    const results = await pipeline.exec()

    if (results) {
      for (let i = 0; i < results.length; i++) {
        const [, data] = results[i]
        if (!data) {
          invalidTokens.push(tokens[i])
          continue
        }
        const user = JSON.parse(data as string) as OnlineUser
        if (user.userName === userName) matchedTokens.push(tokens[i])
      }
    }

    // 顺手清理已过期但仍残留在集合里的 token，避免在线列表膨胀。
    if (invalidTokens.length > 0) {
      const multi = client.multi()
      for (const token of invalidTokens) {
        multi.srem(setKey, token)
      }
      await multi.exec()
    }

    return matchedTokens
  }

  private sortRows(rows: OnlineUserRow[], query?: QueryOnlineDto) {
    const direction = resolveSortDirection(query?.sortOrder)
    const factor = direction === 'asc' ? 1 : -1
    const sortBy = direction ? query?.sortBy : 'loginTime'
    return [...rows].sort((a, b) => this.compareOnlineValue(a, b, sortBy) * factor)
  }

  private compareOnlineValue(a: OnlineUserRow, b: OnlineUserRow, sortBy?: string) {
    if (sortBy === 'tokenId') return a.tokenId.localeCompare(b.tokenId)
    if (sortBy === 'userName') return a.userName.localeCompare(b.userName)
    if (sortBy === 'ipaddr') return a.ipaddr.localeCompare(b.ipaddr)
    if (sortBy === 'loginLocation') return a.loginLocation.localeCompare(b.loginLocation)
    if (sortBy === 'browser') return a.browser.localeCompare(b.browser)
    if (sortBy === 'os') return a.os.localeCompare(b.os)
    if (sortBy === 'onlineDuration') return a.onlineDuration - b.onlineDuration
    return +new Date(a.loginTime) - +new Date(b.loginTime)
  }

  async list(query?: QueryOnlineDto): Promise<{ total: number; rows: OnlineUserRow[] }> {
    const client = this.redis.getClient()
    const setKey = this.redis.toStorageKey(ONLINE_SET_KEY)

    // 获取所有在线用户 token
    const tokens = await client.smembers(setKey)
    if (!tokens.length) {
      return { total: 0, rows: [] }
    }

    // 批量获取用户信息
    const pipeline = client.pipeline()
    for (const token of tokens) {
      pipeline.get(this.redis.toStorageKey(ONLINE_KEY_PREFIX + token))
    }
    const results = await pipeline.exec()

    // 解析用户数据，过滤掉已失效的
    let rows: OnlineUser[] = []
    const invalidTokens: string[] = []

    if (results) {
      for (let i = 0; i < results.length; i++) {
        const [, data] = results[i]
        if (data) {
          rows.push(JSON.parse(data as string) as OnlineUser)
        } else {
          // 数据不存在，标记为无效
          invalidTokens.push(tokens[i])
        }
      }
    }

    // 清理无效的 token
    if (invalidTokens.length > 0) {
      const multi = client.multi()
      for (const token of invalidTokens) {
        multi.srem(setKey, token)
      }
      await multi.exec()
    }

    // 过滤
    if (query?.userName) {
      rows = rows.filter((x) => x.userName.includes(query.userName || ''))
    }
    if (query?.ipaddr) {
      rows = rows.filter((x) => x.ipaddr.includes(query.ipaddr || ''))
    }

    // 分页
    const pageNum = Number(query?.pageNum ?? 1)
    const pageSize = Number(query?.pageSize ?? 20)
    const total = rows.length
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize

    const now = Date.now()
    const normalizedRows = rows.map((r) => {
      const loginTimeMs = new Date(r.loginTime).getTime()
      const durationMs = now - loginTimeMs
      return {
        tokenId: r.token,
        userName: r.userName,
        ipaddr: r.ipaddr,
        loginLocation: IpUtil.getLocation(r.ipaddr),
        browser: r.browser ?? '',
        os: r.os ?? '',
        loginTime: r.loginTime instanceof Date ? r.loginTime.toISOString() : String(r.loginTime),
        /** 在线时长（毫秒） */
        onlineDuration: durationMs > 0 ? durationMs : 0,
      }
    })
    const pageRows = this.sortRows(normalizedRows, query).slice(start, end)

    return { total, rows: pageRows }
  }
}

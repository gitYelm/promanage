import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { LoggerService } from '../common/logger/logger.service'

export interface SecurityConfig {
  maxRetry: number // 最大登录失败次数
  lockTime: number // 锁定时长（分钟）
  sessionTimeout: number // 会话超时（分钟）
}

@Injectable()
export class SecurityConfigService {
  private readonly LOGIN_FAIL_PREFIX = 'login:fail:'
  private readonly ACCOUNT_LOCK_PREFIX = 'login:lock:'

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private logger: LoggerService,
  ) {}

  /**
   * 从数据库获取安全配置
   */
  async getSecurityConfig(): Promise<SecurityConfig> {
    const configs = await this.prisma.sysConfig.findMany({
      where: {
        configKey: {
          in: ['sys.login.maxRetry', 'sys.login.lockTime', 'sys.session.timeout'],
        },
      },
    })

    const configMap: Record<string, string> = {}
    configs.forEach((c) => {
      if (c.configKey) {
        configMap[c.configKey] = c.configValue ?? ''
      }
    })

    return {
      maxRetry: parseInt(configMap['sys.login.maxRetry'] || '5', 10),
      lockTime: parseInt(configMap['sys.login.lockTime'] || '10', 10),
      sessionTimeout: parseInt(configMap['sys.session.timeout'] || '30', 10),
    }
  }

  /**
   * 获取会话超时时间（秒）
   */
  async getSessionTimeoutSeconds(): Promise<number> {
    const config = await this.getSecurityConfig()
    return config.sessionTimeout * 60
  }

  /**
   * 检查账户是否被锁定
   */
  async isAccountLocked(username: string): Promise<boolean> {
    const client = this.redis.getClient()
    const lockKey = `${this.ACCOUNT_LOCK_PREFIX}${username}`
    const exists = await client.exists(lockKey)
    return exists === 1
  }

  /**
   * 获取账户锁定剩余时间（秒）
   */
  async getAccountLockTTL(username: string): Promise<number> {
    const client = this.redis.getClient()
    const lockKey = `${this.ACCOUNT_LOCK_PREFIX}${username}`
    const value = await client.get(lockKey)
    if (!value) return 0

    // 解析锁定时间
    const lockUntil = parseInt(value, 10)
    const remaining = Math.ceil((lockUntil - Date.now()) / 1000)
    return remaining > 0 ? remaining : 0
  }

  /**
   * 记录登录失败
   * @returns 是否触发锁定
   */
  async recordLoginFailure(username: string): Promise<{
    locked: boolean
    failCount: number
    lockMinutes: number
  }> {
    const config = await this.getSecurityConfig()
    const client = this.redis.getClient()
    const failKey = `${this.LOGIN_FAIL_PREFIX}${username}`

    // 获取当前失败次数
    const currentCount = await client.get(failKey)
    const failCount = (parseInt(currentCount || '0', 10) || 0) + 1

    // 更新失败次数，设置过期时间为锁定时长
    await client.setex(failKey, config.lockTime * 60, String(failCount))

    // 检查是否需要锁定
    if (failCount >= config.maxRetry) {
      const lockKey = `${this.ACCOUNT_LOCK_PREFIX}${username}`
      const lockUntil = Date.now() + config.lockTime * 60 * 1000
      await client.setex(lockKey, config.lockTime * 60, String(lockUntil))

      this.logger.warn(
        `账户 ${username} 登录失败 ${failCount} 次，已锁定 ${config.lockTime} 分钟`,
        'SecurityConfigService',
      )

      return { locked: true, failCount, lockMinutes: config.lockTime }
    }

    return { locked: false, failCount, lockMinutes: config.lockTime }
  }

  /**
   * 清除登录失败记录（登录成功时调用）
   */
  clearLoginFailure(username: string): void {
    const client = this.redis.getClient()
    const failKey = `${this.LOGIN_FAIL_PREFIX}${username}`
    void client.del(failKey)
  }

  /**
   * 获取剩余尝试次数
   */
  async getRemainingAttempts(username: string): Promise<number> {
    const config = await this.getSecurityConfig()
    const client = this.redis.getClient()
    const failKey = `${this.LOGIN_FAIL_PREFIX}${username}`

    const currentCount = await client.get(failKey)
    const failCount = parseInt(currentCount || '0', 10) || 0

    return Math.max(0, config.maxRetry - failCount)
  }

  /**
   * 解锁账户（管理员操作）
   */
  unlockAccount(username: string): void {
    const client = this.redis.getClient()
    const lockKey = `${this.ACCOUNT_LOCK_PREFIX}${username}`
    const failKey = `${this.LOGIN_FAIL_PREFIX}${username}`
    void client.del(lockKey)
    void client.del(failKey)
    this.logger.log(`账户 ${username} 已被管理员解锁`, 'SecurityConfigService')
  }

  /**
   * 获取所有被锁定的账户
   */
  async getLockedAccounts(): Promise<
    Array<{ username: string; lockUntil: number; remainingSeconds: number }>
  > {
    const client = this.redis.getClient()
    const lockedAccounts: Array<{
      username: string
      lockUntil: number
      remainingSeconds: number
    }> = []

    // 扫描所有锁定的 key
    const stream = client.scanStream({
      match: `${this.ACCOUNT_LOCK_PREFIX}*`,
      count: 100,
    })

    // 收集所有 keys
    const allKeys: string[] = []

    return new Promise((resolve) => {
      stream.on('data', (keys: string[]) => {
        allKeys.push(...keys)
      })

      stream.on('end', () => {
        // 在 end 事件中处理所有 keys
        const processKeys = async () => {
          for (const key of allKeys) {
            const username = key.replace(this.ACCOUNT_LOCK_PREFIX, '')
            const value = await client.get(key)
            if (value) {
              const lockUntil = parseInt(value, 10)
              const remainingSeconds = Math.ceil((lockUntil - Date.now()) / 1000)
              if (remainingSeconds > 0) {
                lockedAccounts.push({ username, lockUntil, remainingSeconds })
              }
            }
          }
          resolve(lockedAccounts)
        }
        void processKeys()
      })
    })
  }
}

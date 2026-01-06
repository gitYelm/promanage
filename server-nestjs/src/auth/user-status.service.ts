import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from '../redis/redis.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * 用户状态服务
 * 用于在 Redis 中维护无效用户（已删除/已停用）的状态
 * JwtAuthGuard 会检查此状态，拒绝无效用户的请求
 */
@Injectable()
export class UserStatusService {
  private readonly logger = new Logger(UserStatusService.name)
  private readonly INVALID_USERS_KEY = 'auth:invalid_users'
  private readonly VALID_USERS_KEY = 'auth:valid_users'
  // 缓存时间（秒），默认 5 分钟
  private readonly CACHE_TTL = 5 * 60

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * 标记用户为无效（删除或停用时调用）
   */
  async markUserInvalid(userId: string): Promise<void> {
    try {
      const invalidKey = `${this.INVALID_USERS_KEY}:${userId}`
      const validKey = `${this.VALID_USERS_KEY}:${userId}`
      // 设置无效标记，清除有效标记
      await this.redisService.setex(invalidKey, this.CACHE_TTL, '1')
      this.redisService.del(validKey)
      this.logger.debug(`用户 ${userId} 已标记为无效`)
    } catch (error) {
      this.logger.error(`标记用户无效失败: ${(error as Error).message}`)
    }
  }

  /**
   * 移除用户的无效标记（恢复用户时调用）
   */
  async removeUserInvalid(userId: string): Promise<void> {
    try {
      const invalidKey = `${this.INVALID_USERS_KEY}:${userId}`
      const validKey = `${this.VALID_USERS_KEY}:${userId}`
      // 清除无效标记，设置有效标记
      this.redisService.del(invalidKey)
      await this.redisService.setex(validKey, this.CACHE_TTL, '1')
      this.logger.debug(`用户 ${userId} 的无效标记已移除`)
    } catch (error) {
      this.logger.error(`移除用户无效标记失败: ${(error as Error).message}`)
    }
  }

  /**
   * 检查用户是否无效
   * 1. 先检查 Redis 缓存（无效标记或有效标记）
   * 2. 缓存未命中时查数据库，并缓存结果
   */
  async isUserInvalid(userId: string): Promise<boolean> {
    try {
      const invalidKey = `${this.INVALID_USERS_KEY}:${userId}`
      const validKey = `${this.VALID_USERS_KEY}:${userId}`

      // 1. 检查是否有无效标记
      const isInvalid = await this.redisService.exists(invalidKey)
      if (isInvalid === 1) {
        return true
      }

      // 2. 检查是否有有效标记（缓存命中）
      const isValid = await this.redisService.exists(validKey)
      if (isValid === 1) {
        return false
      }

      // 3. 缓存未命中，查数据库
      const user = await this.prismaService.sysUser.findUnique({
        where: { userId: BigInt(userId) },
        select: { status: true, delFlag: true },
      })

      // 用户不存在或已删除或已停用
      if (!user || user.delFlag === '2' || user.status === '1') {
        await this.redisService.setex(invalidKey, this.CACHE_TTL, '1')
        this.logger.debug(`用户 ${userId} 数据库校验：无效`)
        return true
      }

      // 用户有效，缓存结果
      await this.redisService.setex(validKey, this.CACHE_TTL, '1')
      return false
    } catch (error) {
      this.logger.error(`检查用户状态失败: ${(error as Error).message}`)
      // 出错时不阻止请求
      return false
    }
  }

  /**
   * 批量标记用户为无效
   */
  async markUsersInvalid(userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      await this.markUserInvalid(userId)
    }
  }
}

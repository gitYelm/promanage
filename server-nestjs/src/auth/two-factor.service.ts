import { Injectable } from '@nestjs/common'
import { authenticator } from 'otplib'
import * as QRCode from 'qrcode'
import { RedisService } from '../redis/redis.service'
import { PrismaService } from '../prisma/prisma.service'
import { LoggerService } from '../common/logger/logger.service'
import { generateUuid } from '../common/utils/uuid.util'

const TWO_FACTOR_TEMP_PREFIX = '2fa:temp:' // 临时存储待验证的登录信息
const TWO_FACTOR_TEMP_EXPIRE = 300 // 5分钟过期

@Injectable()
export class TwoFactorService {
  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * 检查两步验证是否全局启用
   */
  async isTwoFactorEnabled(): Promise<boolean> {
    const config = await this.prisma.sysConfig.findFirst({
      where: { configKey: 'sys.account.twoFactorEnabled' },
    })
    return config?.configValue === 'true'
  }

  /**
   * 生成用户的 2FA 密钥
   */
  generateSecret(username: string): { secret: string; otpauthUrl: string } {
    const secret = authenticator.generateSecret()
    const otpauthUrl = authenticator.keyuri(username, 'RBAC Admin Pro', secret)
    return { secret, otpauthUrl }
  }

  /**
   * 生成 QR 码图片 (base64)
   */
  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl)
  }

  /**
   * 验证 TOTP 码
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret })
    } catch {
      return false
    }
  }

  /**
   * 为用户启用 2FA
   */
  async enableTwoFactor(userId: string, secret: string): Promise<void> {
    await this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
      },
    })
    this.logger.log(`用户 ${userId} 启用了两步验证`, 'TwoFactorService')
  }

  /**
   * 为用户禁用 2FA
   */
  async disableTwoFactor(userId: string): Promise<void> {
    await this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
      },
    })
    this.logger.log(`用户 ${userId} 禁用了两步验证`, 'TwoFactorService')
  }

  /**
   * 获取用户的 2FA 状态（仅返回启用状态，不返回密钥）
   */
  async getUserTwoFactorStatus(userId: string): Promise<{ enabled: boolean }> {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
      select: { twoFactorEnabled: true },
    })
    return {
      enabled: user?.twoFactorEnabled ?? false,
    }
  }

  /**
   * 获取用户的 2FA 密钥（仅内部使用，不暴露给外部）
   */
  async getUserTwoFactorSecret(userId: string): Promise<string | null> {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
      select: { twoFactorSecret: true },
    })
    return user?.twoFactorSecret ?? null
  }

  /**
   * 存储临时登录信息（等待 2FA 验证）
   */
  async storeTempLogin(
    tempToken: string,
    data: { userId: string; username: string },
  ): Promise<void> {
    const key = TWO_FACTOR_TEMP_PREFIX + tempToken
    await this.redis.setex(key, TWO_FACTOR_TEMP_EXPIRE, JSON.stringify(data))
  }

  /**
   * 获取并删除临时登录信息
   */
  async getTempLogin(tempToken: string): Promise<{ userId: string; username: string } | null> {
    const key = TWO_FACTOR_TEMP_PREFIX + tempToken
    const data = await this.redis.get(key)
    if (!data) return null
    this.redis.del(key)
    return JSON.parse(data) as { userId: string; username: string }
  }

  /**
   * 生成临时 token
   */
  generateTempToken(): string {
    return generateUuid()
  }
}

import { Injectable, Inject, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import type { Request } from 'express'
import { UserService } from '../system/user/user.service'
import { LoginDto } from './dto/login.dto'
import { LoggerService } from '../common/logger/logger.service'
import { LogininforService } from '../monitor/logininfor/logininfor.service'
import { BusinessException } from '../common/exceptions'
import { ErrorCode } from '../common/enums'
import { IpUtil } from '../common/utils/ip.util'
import { TwoFactorService } from './two-factor.service'
import { SecurityConfigService } from './security-config.service'

@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private logger: LoggerService,
    private logininforService: LogininforService,
    private twoFactorService: TwoFactorService,
    private securityConfigService: SecurityConfigService,
    @Inject(REQUEST) private request: Request,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto
    this.logger.debug(`Login attempt for user: ${username}`, 'AuthService')

    // 获取请求信息
    const ipaddr = this.getClientIp()
    const userAgent = this.request.headers['user-agent'] || ''
    const { browser, os } = this.parseUserAgent(userAgent)

    // 检查账户是否被锁定
    const isLocked = await this.securityConfigService.isAccountLocked(username)
    if (isLocked) {
      const ttl = await this.securityConfigService.getAccountLockTTL(username)
      const minutes = Math.ceil(ttl / 60)
      this.logger.warn(`账户 ${username} 已被锁定，剩余 ${minutes} 分钟`, 'AuthService')
      await this.recordLoginLog(username, ipaddr, browser, os, '1', '账户已锁定')
      throw new BusinessException(
        ErrorCode.ACCOUNT_LOCKED,
        `账户已被锁定，请 ${minutes} 分钟后再试`,
      )
    }

    try {
      const user = await this.userService.findByUsername(username)

      if (!user) {
        this.logger.warn(`Login failed: User not found - ${username}`, 'AuthService')
        // 记录登录失败并检查是否需要锁定
        const { locked, failCount, lockMinutes } =
          await this.securityConfigService.recordLoginFailure(username)
        await this.recordLoginLog(
          username,
          ipaddr,
          browser,
          os,
          '1',
          locked ? `登录失败${failCount}次，账户已锁定${lockMinutes}分钟` : '用户不存在',
        )
        if (locked) {
          throw new BusinessException(
            ErrorCode.ACCOUNT_LOCKED,
            `登录失败次数过多，账户已锁定 ${lockMinutes} 分钟`,
          )
        }
        throw new BusinessException(ErrorCode.INVALID_CREDENTIALS, '账号或密码错误')
      }

      // 验证密码
      let isMatch = false
      if (user.password) {
        isMatch = await bcrypt.compare(password, user.password)
      }

      if (!isMatch) {
        this.logger.warn(`Login failed: Invalid password - ${username}`, 'AuthService')
        // 记录登录失败并检查是否需要锁定
        const { locked, failCount, lockMinutes } =
          await this.securityConfigService.recordLoginFailure(username)
        await this.recordLoginLog(
          username,
          ipaddr,
          browser,
          os,
          '1',
          locked ? `登录失败${failCount}次，账户已锁定${lockMinutes}分钟` : '密码错误',
        )
        if (locked) {
          throw new BusinessException(
            ErrorCode.ACCOUNT_LOCKED,
            `登录失败次数过多，账户已锁定 ${lockMinutes} 分钟`,
          )
        }
        throw new BusinessException(ErrorCode.INVALID_CREDENTIALS, '账号或密码错误')
      }

      // 检查是否需要两步验证
      const globalTwoFactorEnabled = await this.twoFactorService.isTwoFactorEnabled()
      const userTwoFactorEnabled: boolean =
        Boolean(user.twoFactorEnabled) && Boolean(user.twoFactorSecret)

      // 如果全局启用了两步验证，且用户也启用了两步验证
      if (globalTwoFactorEnabled && userTwoFactorEnabled) {
        // 生成临时 token，等待两步验证
        const tempToken = this.twoFactorService.generateTempToken()
        await this.twoFactorService.storeTempLogin(tempToken, {
          userId: user.userId.toString(),
          username: user.userName,
        })

        this.logger.log(`用户 ${username} 需要两步验证`, 'AuthService')

        return {
          requireTwoFactor: true,
          tempToken,
        }
      }

      // 登录成功，清除失败记录
      this.securityConfigService.clearLoginFailure(username)

      // 获取会话超时配置
      const sessionTimeout = await this.securityConfigService.getSessionTimeoutSeconds()

      // 签发 Token
      // 注意：BigInt 无法被 JSON.stringify，需要转换为 string
      const payload = {
        sub: user.userId.toString(),
        username: user.userName,
      }

      this.logger.log(
        `User logged in successfully: ${username} (ID: ${user.userId})`,
        'AuthService',
      )

      // 记录登录成功
      await this.recordLoginLog(username, ipaddr, browser, os, '0', '登录成功')

      return {
        token: this.jwtService.sign(payload, { expiresIn: sessionTimeout }),
      }
    } catch (error: unknown) {
      // 如果是业务异常,直接抛出
      if (error instanceof BusinessException) {
        throw error
      }
      // 其他异常记录日志
      const err = error as Error
      this.logger.error(`Login error: ${err.message}`, err.stack, 'AuthService')
      await this.recordLoginLog(username, ipaddr, browser, os, '1', '系统错误')
      throw error
    }
  }

  /**
   * 记录登录日志
   */
  private async recordLoginLog(
    userName: string,
    ipaddr: string,
    browser: string,
    os: string,
    status: string,
    msg: string,
  ) {
    try {
      // 通过IP获取地理位置
      const loginLocation = IpUtil.getLocation(ipaddr)

      await this.logininforService.create({
        userName,
        ipaddr,
        loginLocation,
        browser,
        os,
        status,
        msg,
      })
    } catch (error: unknown) {
      // 记录日志失败不应该影响登录流程
      const err = error as Error
      this.logger.error(`Failed to record login log: ${err.message}`, err.stack, 'AuthService')
    }
  }

  /**
   * 获取客户端IP
   */
  private getClientIp(): string {
    return IpUtil.getClientIp(this.request)
  }

  /**
   * 解析 User-Agent
   */
  private parseUserAgent(userAgent: string): { browser: string; os: string } {
    let browser = 'Unknown'
    let os = 'Unknown'

    // 解析浏览器
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'
    else if (userAgent.includes('Opera')) browser = 'Opera'

    // 解析操作系统
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac OS')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'

    return { browser, os }
  }

  /**
   * 两步验证登录
   */
  async verifyTwoFactor(tempToken: string, code: string) {
    // 获取临时登录信息
    const tempData = await this.twoFactorService.getTempLogin(tempToken)
    if (!tempData) {
      throw new BusinessException(ErrorCode.INVALID_CREDENTIALS, '验证已过期，请重新登录')
    }

    // 获取用户的 2FA 密钥
    const { secret } = await this.twoFactorService.getUserTwoFactorStatus(tempData.userId)
    if (!secret) {
      throw new BusinessException(ErrorCode.INVALID_CREDENTIALS, '两步验证未配置')
    }

    // 验证 TOTP 码
    const isValid = this.twoFactorService.verifyToken(secret, code)
    if (!isValid) {
      throw new BusinessException(ErrorCode.INVALID_CREDENTIALS, '验证码错误')
    }

    // 获取请求信息用于记录日志
    const ipaddr = this.getClientIp()
    const userAgent = this.request.headers['user-agent'] || ''
    const { browser, os } = this.parseUserAgent(userAgent)

    // 登录成功，清除失败记录
    this.securityConfigService.clearLoginFailure(tempData.username)

    // 获取会话超时配置
    const sessionTimeout = await this.securityConfigService.getSessionTimeoutSeconds()

    // 签发 Token
    const payload = {
      sub: tempData.userId,
      username: tempData.username,
    }

    this.logger.log(`用户 ${tempData.username} 两步验证成功`, 'AuthService')

    // 记录登录成功
    await this.recordLoginLog(tempData.username, ipaddr, browser, os, '0', '登录成功(两步验证)')

    return {
      token: this.jwtService.sign(payload, { expiresIn: sessionTimeout }),
    }
  }

  logout() {
    // JWT 是无状态的，后端其实不需要做特殊处理
    // 如果需要使 token 失效，需要引入 Redis 黑名单机制
    this.logger.debug('User logout', 'AuthService')
    return {}
  }
}

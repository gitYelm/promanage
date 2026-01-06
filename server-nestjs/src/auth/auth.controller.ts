import { Body, Controller, Post, Req, Get, UseGuards, Param, Delete } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { VerifyTwoFactorDto, SetupTwoFactorDto } from './dto/two-factor.dto'
import type { Request } from 'express'
import { OnlineService } from '../monitor/online/online.service'
import { TokenBlacklistService } from './token-blacklist.service'
import { CaptchaService } from './captcha.service'
import { TwoFactorService } from './two-factor.service'
import { BusinessException } from '../common/exceptions'
import { ErrorCode } from '../common/enums'
import { JwtAuthGuard } from './jwt-auth.guard'
import { SecurityConfigService } from './security-config.service'
import { IpUtil } from '../common/utils/ip.util'

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private onlineService: OnlineService,
    private tokenBlacklist: TokenBlacklistService,
    private captchaService: CaptchaService,
    private twoFactorService: TwoFactorService,
    private securityConfigService: SecurityConfigService,
  ) {}

  @Get('captchaImage')
  @ApiOperation({
    summary: '获取验证码',
    description: '获取图形验证码，返回 base64 编码的图片和 uuid',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCaptchaImage() {
    const captchaEnabled = await this.captchaService.isCaptchaEnabled()
    if (!captchaEnabled) {
      return { captchaEnabled: false }
    }
    const { uuid, img } = await this.captchaService.generate()
    return { captchaEnabled: true, uuid, img }
  }

  @Post('login')
  @ApiOperation({
    summary: '用户登录',
    description: '用户名密码登录获取 JWT Token',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    // 检查验证码
    const captchaEnabled = await this.captchaService.isCaptchaEnabled()
    if (captchaEnabled) {
      if (!loginDto.code || !loginDto.uuid) {
        throw new BusinessException(ErrorCode.CAPTCHA_ERROR, '验证码不能为空')
      }
      const valid = await this.captchaService.verify(loginDto.uuid, loginDto.code)
      if (!valid) {
        throw new BusinessException(ErrorCode.CAPTCHA_ERROR, '验证码错误或已过期')
      }
    }

    // 登录日志已在 AuthService 中记录,这里只处理在线用户
    const res = await this.authService.login(loginDto)

    // 如果需要两步验证，直接返回
    if (res.requireTwoFactor) {
      return res
    }

    // 解析 User-Agent
    const userAgent = req.headers['user-agent'] || ''
    const { browser, os } = this.parseUserAgent(userAgent)

    // 注册在线用户
    if (res.token) {
      await this.onlineService.add({
        token: res.token,
        userName: loginDto.username,
        ipaddr: IpUtil.getClientIp(req),
        loginTime: new Date(),
        browser,
        os,
      })
    }

    return res
  }

  /**
   * 解析 User-Agent
   */
  private parseUserAgent(userAgent: string): { browser: string; os: string } {
    let browser = 'Unknown'
    let os = 'Unknown'

    // 解析浏览器
    if (userAgent.includes('Edg')) browser = 'Edge'
    else if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Opera')) browser = 'Opera'

    // 解析操作系统
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac OS')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'

    return { browser, os }
  }

  @Post('logout')
  @ApiOperation({ summary: '用户登出' })
  async logout(@Req() req: Request) {
    const auth = req.headers['authorization']
    const token = auth?.startsWith('Bearer ') ? auth.substring(7) : ''
    if (token) {
      await this.onlineService.remove(token)
      void this.tokenBlacklist.add(token)
    }
    return this.authService.logout()
  }

  // ==================== 两步验证相关接口 ====================

  @Get('twoFactor/status')
  @ApiOperation({ summary: '获取两步验证状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTwoFactorStatus() {
    const globalEnabled = await this.twoFactorService.isTwoFactorEnabled()
    return { globalEnabled }
  }

  @Post('twoFactor/verify')
  @ApiOperation({ summary: '两步验证登录' })
  @ApiBody({ type: VerifyTwoFactorDto })
  @ApiResponse({ status: 200, description: '验证成功' })
  async verifyTwoFactor(@Body() dto: VerifyTwoFactorDto, @Req() req: Request) {
    const res = await this.authService.verifyTwoFactor(dto.tempToken, dto.code)

    // 解析 User-Agent
    const userAgent = req.headers['user-agent'] || ''
    const { browser, os } = this.parseUserAgent(userAgent)

    // 从临时 token 获取用户名（这里需要从 token 解析）
    // 由于 verifyTwoFactor 已经验证成功，我们可以从返回的 token 解析用户名
    const tokenPayload = JSON.parse(Buffer.from(res.token.split('.')[1], 'base64').toString()) as {
      username: string
    }

    // 注册在线用户
    await this.onlineService.add({
      token: res.token,
      userName: tokenPayload.username,
      ipaddr: IpUtil.getClientIp(req),
      loginTime: new Date(),
      browser,
      os,
    })

    return res
  }

  @Get('twoFactor/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取两步验证设置信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTwoFactorSetup(@Req() req: Request) {
    const user = req.user as { userId: string; username: string }
    const globalEnabled = await this.twoFactorService.isTwoFactorEnabled()

    if (!globalEnabled) {
      return {
        globalEnabled: false,
        userEnabled: false,
      }
    }

    const { enabled } = await this.twoFactorService.getUserTwoFactorStatus(user.userId)

    // 生成新的密钥和二维码
    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(user.username)
    const qrCode = await this.twoFactorService.generateQRCode(otpauthUrl)

    return {
      globalEnabled: true,
      userEnabled: enabled,
      secret,
      qrCode,
    }
  }

  @Post('twoFactor/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '启用两步验证' })
  @ApiBody({ type: SetupTwoFactorDto })
  @ApiResponse({ status: 200, description: '启用成功' })
  async enableTwoFactor(@Body() dto: SetupTwoFactorDto, @Req() req: Request) {
    const user = req.user as { userId: string }

    // 验证码是否正确
    const isValid = this.twoFactorService.verifyToken(dto.secret, dto.code)
    if (!isValid) {
      throw new BusinessException(ErrorCode.CAPTCHA_ERROR, '验证码错误')
    }

    await this.twoFactorService.enableTwoFactor(user.userId, dto.secret)
    return { msg: '两步验证已启用' }
  }

  @Post('twoFactor/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '禁用两步验证' })
  @ApiResponse({ status: 200, description: '禁用成功' })
  async disableTwoFactor(@Req() req: Request) {
    const user = req.user as { userId: string }
    await this.twoFactorService.disableTwoFactor(user.userId)
    return { msg: '两步验证已禁用' }
  }

  // ==================== 账户锁定管理 ====================

  @Get('locked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取被锁定的账户列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLockedAccounts(): Promise<{
    rows: Array<{
      username: string
      lockUntil: number
      remainingSeconds: number
    }>
    total: number
  }> {
    const accounts = await this.securityConfigService.getLockedAccounts()
    return { rows: accounts, total: accounts.length }
  }

  @Delete('locked/:username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '解锁账户' })
  @ApiResponse({ status: 200, description: '解锁成功' })
  unlockAccount(@Param('username') username: string): { msg: string } {
    this.securityConfigService.unlockAccount(username)
    return { msg: `账户 ${username} 已解锁` }
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

function parseUA(ua?: string) {
  const info = { browser: '', os: '' }
  if (!ua) return info
  try {
    // 极简解析，避免引入第三方库
    if (/Chrome\//.test(ua)) info.browser = 'Chrome'
    else if (/Safari\//.test(ua)) info.browser = 'Safari'
    else if (/Firefox\//.test(ua)) info.browser = 'Firefox'
    else if (/Edge\//.test(ua)) info.browser = 'Edge'

    if (/Windows/i.test(ua)) info.os = 'Windows'
    else if (/Mac OS X/i.test(ua)) info.os = 'macOS'
    else if (/Android/i.test(ua)) info.os = 'Android'
    else if (/iPhone|iPad|iPod/i.test(ua)) info.os = 'iOS'
  } catch {
    // 忽略解析异常
  }
  return info
}

/**
 * 登录日志服务
 * 记录登录成功/失败到 sys_login_log
 */
@Injectable()
export class LoginLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    userName: string
    ipaddr: string
    ua?: string
    status: '0' | '1'
    msg?: string
  }) {
    const { userName, ipaddr, ua, status, msg } = params
    const { browser, os } = parseUA(ua)

    try {
      await this.prisma.sysLoginLog.create({
        data: {
          userName,
          ipaddr,
          loginLocation: '',
          browser,
          os,
          status,
          msg: msg ?? '',
        },
      })
    } catch {
      // 忽略日志写入错误
    }
  }
}

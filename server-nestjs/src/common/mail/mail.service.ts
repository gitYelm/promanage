import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../logger/logger.service'
import * as nodemailer from 'nodemailer'
import { Transporter } from 'nodemailer'

export interface MailConfig {
  enabled: boolean
  host: string
  port: number
  username: string
  password: string
  from: string
  ssl: boolean
}

export interface SendMailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

@Injectable()
export class MailService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * 从数据库获取邮件配置
   */
  async getMailConfig(): Promise<MailConfig> {
    const configs = await this.prisma.sysConfig.findMany({
      where: {
        configKey: { startsWith: 'sys.mail.' },
      },
    })

    const configMap: Record<string, string> = {}
    configs.forEach((c) => {
      if (c.configKey) {
        configMap[c.configKey] = c.configValue ?? ''
      }
    })

    return {
      enabled: configMap['sys.mail.enabled'] === 'true',
      host: configMap['sys.mail.host'] || '',
      port: parseInt(configMap['sys.mail.port'] || '465', 10),
      username: configMap['sys.mail.username'] || '',
      password: configMap['sys.mail.password'] || '',
      from: configMap['sys.mail.from'] || '',
      ssl: configMap['sys.mail.ssl'] !== 'false',
    }
  }

  /**
   * 创建邮件传输器
   */
  private createTransporter(config: MailConfig): Transporter {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.ssl,
      auth: {
        user: config.username,
        pass: config.password,
      },
    })
  }

  /**
   * 发送邮件
   */
  async sendMail(options: SendMailOptions): Promise<{ success: boolean; message: string }> {
    const config = await this.getMailConfig()

    if (!config.enabled) {
      this.logger.warn('邮件服务未启用', 'MailService')
      return { success: false, message: '邮件服务未启用' }
    }

    if (!config.host || !config.username || !config.password) {
      this.logger.warn('邮件配置不完整', 'MailService')
      return { success: false, message: '邮件配置不完整，请检查 SMTP 设置' }
    }

    try {
      const transporter = this.createTransporter(config)

      const info = (await transporter.sendMail({
        from: config.from || config.username,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      })) as { messageId?: string }

      this.logger.log(
        `邮件发送成功: ${options.to}, messageId: ${info.messageId || 'unknown'}`,
        'MailService',
      )
      return { success: true, message: '邮件发送成功' }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      this.logger.error(`邮件发送失败: ${errMsg}`, 'MailService')
      return { success: false, message: `邮件发送失败: ${errMsg}` }
    }
  }

  /**
   * 测试邮件配置
   */
  async testMail(): Promise<{ success: boolean; message: string }> {
    const config = await this.getMailConfig()

    if (!config.host || !config.username || !config.password) {
      return {
        success: false,
        message: '邮件配置不完整，请填写 SMTP 服务器、账号和密码',
      }
    }

    const testTo = config.from || config.username
    const now = new Date().toLocaleString('zh-CN')

    return this.sendMail({
      to: testTo,
      subject: '【RBAC Admin】邮件配置测试',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">邮件配置测试成功</h2>
          <p>您好，</p>
          <p>这是一封来自 <strong>RBAC Admin</strong> 系统的测试邮件。</p>
          <p>如果您收到此邮件，说明 SMTP 配置正确。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">发送时间: ${now}</p>
        </div>
      `,
    })
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import type { Request } from 'express'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../logger/logger.service'
import { LOG_METADATA_KEY, type LogMetadata } from '../decorators/log.decorator'
import { IpUtil } from '../utils/ip.util'
import { BusinessException } from '../exceptions/business.exception'

/**
 * 需要脱敏的敏感字段列表
 */
const SENSITIVE_FIELDS = [
  'password',
  'oldPassword',
  'newPassword',
  'confirmPassword',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'twoFactorSecret',
  'code', // 验证码
]

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.log('OperationLogInterceptor initialized', 'OperationLogInterceptor')
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 获取日志元数据
    const logMetadata = this.reflector.get<LogMetadata>(LOG_METADATA_KEY, context.getHandler())

    // 如果没有 @Log 装饰器,不记录日志
    if (!logMetadata) {
      return next.handle()
    }

    this.logger.log(
      `📝 Recording operation log: ${logMetadata.title} (type: ${logMetadata.businessType})`,
      'OperationLogInterceptor',
    )

    const request = context.switchToHttp().getRequest<Request>()
    const startTime = Date.now()

    // 获取请求信息
    const user = request.user as
      | { userId?: string; username?: string; deptName?: string }
      | undefined
    const operUserId = user?.userId ? BigInt(user.userId) : null
    const operName = user?.username ?? 'anonymous'
    const deptName = user?.deptName ?? ''
    const operUrl = request.url
    const operIp = IpUtil.getClientIp(request)
    const operLocation = IpUtil.getLocation(operIp)
    const requestMethod = request.method
    const userAgent = (request.headers['user-agent'] || '').substring(0, 500)
    const { browser, os } = this.parseUserAgent(userAgent)
    const operParam = this.getOperParam(request)

    return next.handle().pipe(
      tap((response: unknown) => {
        // 操作成功
        const costTime = Date.now() - startTime
        const logData = {
          title: logMetadata.title,
          businessType: logMetadata.businessType,
          method: `${context.getClass().name}.${context.getHandler().name}`,
          requestMethod,
          operUserId,
          operName,
          deptName,
          operUrl,
          operIp,
          operLocation,
          operParam,
          jsonResult: JSON.stringify(response).substring(0, 2000),
          status: 0,
          errorMsg: '',
          costTime,
          userAgent,
          browser,
          os,
        }
        void this.saveOperLog(logData)
      }),
      catchError((error: unknown) => {
        // 操作失败
        const costTime = Date.now() - startTime

        // 获取错误信息
        let errorMsg = ''
        if (error instanceof BusinessException) {
          // BusinessException 使用 getErrorMessage() 获取真实错误信息
          errorMsg = error.getErrorMessage()
        } else if (error && typeof error === 'object' && 'message' in error) {
          // 其他异常使用 message 属性
          errorMsg = String((error as { message: unknown }).message)
        } else {
          errorMsg = String(error)
        }

        void this.saveOperLog({
          title: logMetadata.title,
          businessType: logMetadata.businessType,
          method: `${context.getClass().name}.${context.getHandler().name}`,
          requestMethod,
          operUserId,
          operName,
          deptName,
          operUrl,
          operIp,
          operLocation,
          operParam,
          jsonResult: '',
          status: 1,
          errorMsg: errorMsg.substring(0, 2000),
          costTime,
          userAgent,
          browser,
          os,
        })
        return throwError(() => error)
      }),
    )
  }

  /**
   * 保存操作日志
   */
  private async saveOperLog(data: {
    title: string
    businessType: number
    method: string
    requestMethod: string
    operUserId: bigint | null
    operName: string
    deptName: string
    operUrl: string
    operIp: string
    operLocation: string
    operParam: string
    jsonResult: string
    status: number
    errorMsg: string
    costTime: number
    userAgent: string
    browser: string
    os: string
  }) {
    try {
      await this.prisma.sysOperLog.create({
        data: {
          title: data.title,
          businessType: data.businessType,
          method: data.method,
          requestMethod: data.requestMethod,
          operatorType: 1, // 1=后台用户
          operUserId: data.operUserId,
          operName: data.operName,
          deptName: data.deptName,
          operUrl: data.operUrl,
          operIp: data.operIp,
          operLocation: data.operLocation,
          operParam: data.operParam,
          jsonResult: data.jsonResult,
          status: data.status,
          errorMsg: data.errorMsg,
          operTime: new Date(),
          costTime: data.costTime,
          userAgent: data.userAgent,
          browser: data.browser,
          os: data.os,
        },
      })
    } catch (error: unknown) {
      // 记录日志失败不应该影响业务流程
      const err = error as { message?: string; stack?: string }
      this.logger.error(
        `Failed to save operation log: ${err.message ?? 'Unknown error'}`,
        err.stack,
        'OperationLogInterceptor',
      )
    }
  }

  /**
   * 获取请求参数（带脱敏处理）
   */
  private getOperParam(request: Request): string {
    const params: { query: unknown; body: unknown; params: unknown } = {
      query: request.query,
      body: this.maskSensitiveData(request.body),
      params: request.params,
    }
    return JSON.stringify(params).substring(0, 2000)
  }

  /**
   * 脱敏处理敏感数据
   */
  private maskSensitiveData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item))
    }

    const masked: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        masked[key] = '******'
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value)
      } else {
        masked[key] = value
      }
    }
    return masked
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
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS'

    return { browser, os }
  }
}

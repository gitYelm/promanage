import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import type { Request } from 'express'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../logger/logger.service'
import { LOG_METADATA_KEY, type LogMetadata } from '../decorators/log.decorator'
import { IpUtil } from '../utils/ip.util'

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
    const user = request.user as { username?: string } | undefined
    const operName = user?.username ?? 'anonymous'
    const operUrl = request.url
    const operIp = IpUtil.getClientIp(request)
    const operLocation = IpUtil.getLocation(operIp)
    const requestMethod = request.method
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
          operName,
          operUrl,
          operIp,
          operLocation,
          operParam,
          jsonResult: JSON.stringify(response).substring(0, 2000),
          status: 0,
          errorMsg: '',
          costTime,
        }
        void this.saveOperLog(logData)
      }),
      catchError((error: unknown) => {
        // 操作失败
        const costTime = Date.now() - startTime
        const err = error as { message?: string }
        void this.saveOperLog({
          title: logMetadata.title,
          businessType: logMetadata.businessType,
          method: `${context.getClass().name}.${context.getHandler().name}`,
          requestMethod,
          operName,
          operUrl,
          operIp,
          operLocation,
          operParam,
          jsonResult: '',
          status: 1,
          errorMsg: err.message?.substring(0, 2000) ?? '',
          costTime,
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
    operName: string
    operUrl: string
    operIp: string
    operLocation: string
    operParam: string
    jsonResult: string
    status: number
    errorMsg: string
    costTime: number
  }) {
    try {
      await this.prisma.sysOperLog.create({
        data: {
          title: data.title,
          businessType: data.businessType,
          method: data.method,
          requestMethod: data.requestMethod,
          operatorType: 1, // 1=后台用户
          operName: data.operName,
          deptName: '', // 可以从用户信息中获取
          operUrl: data.operUrl,
          operIp: data.operIp,
          operLocation: data.operLocation,
          operParam: data.operParam,
          jsonResult: data.jsonResult,
          status: data.status,
          errorMsg: data.errorMsg,
          operTime: new Date(),
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
   * 获取请求参数
   */
  private getOperParam(request: Request): string {
    const params: { query: unknown; body: unknown; params: unknown } = {
      query: request.query,
      body: request.body,
      params: request.params,
    }
    return JSON.stringify(params).substring(0, 2000)
  }
}

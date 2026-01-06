import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { catchError, tap } from 'rxjs/operators'
import { PrismaService } from '../../prisma/prisma.service'
import { Request } from 'express'

/**
 * 操作日志拦截器
 * 在每次接口调用后记录操作日志到 sys_oper_log
 */
@Injectable()
export class OperLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    const req = ctx.getRequest<Request>()

    const handler = context.getHandler()
    const controller = context.getClass()

    const methodName = handler?.name ?? ''
    const controllerName = controller?.name ?? ''
    const requestMethod = req.method
    const operUrl = req.originalUrl || req.url
    const operIp = req.ip || ''
    const operParam = ''

    const operatorType = 1 // 1 后台用户
    const reqUser = req as unknown as { user?: { username?: string } }
    const operName = reqUser.user?.username ?? ''

    return next.handle().pipe(
      tap(() => {
        void this.prisma.sysOperLog
          .create({
            data: {
              title: controllerName,
              businessType: 0,
              method: methodName,
              requestMethod,
              operatorType,
              operName,
              deptName: '',
              operUrl,
              operIp,
              operLocation: '',
              operParam,
              jsonResult: '',
              status: 0,
              errorMsg: '',
            },
          })
          .catch(() => void 0)
      }),
      catchError((err) => {
        // 异常场景也写入操作日志
        const errorMsg = (() => {
          try {
            return typeof (err as { message?: string }).message === 'string'
              ? ((err as { message?: string }).message as string)
              : 'unknown error'
          } catch {
            return 'unknown error'
          }
        })()

        this.prisma.sysOperLog
          .create({
            data: {
              title: controllerName,
              businessType: 0,
              method: methodName,
              requestMethod,
              operatorType,
              operName,
              deptName: '',
              operUrl,
              operIp,
              operLocation: '',
              operParam,
              jsonResult: '',
              status: 1,
              errorMsg,
            },
          })
          .catch(() => void 0)

        throw err
      }),
    )
  }
}

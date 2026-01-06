import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { LoggerService } from '../logger/logger.service'

/**
 * HTTP 请求日志中间件
 * 记录所有 HTTP 请求的详细信息
 */
@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req
    const userAgent = req.get('user-agent') || ''
    const startTime = Date.now()

    // 响应完成时记录日志
    res.on('finish', () => {
      const { statusCode } = res
      const contentLength = res.get('content-length') || '0'
      const responseTime = Date.now() - startTime

      const logMessage = `${method} ${originalUrl} ${statusCode} ${contentLength} - ${responseTime}ms`

      this.logger.http(logMessage, {
        method,
        url: originalUrl,
        statusCode,
        contentLength,
        responseTime,
        ip,
        userAgent,
      })
    })

    next()
  }
}

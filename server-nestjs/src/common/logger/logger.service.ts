import { Injectable, Inject, LoggerService as NestLoggerService } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

/**
 * 自定义日志服务
 * 封装 Winston Logger,提供统一的日志接口
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  /**
   * 记录普通日志
   */
  log(message: string, context?: string) {
    this.logger.info(message, { context })
  }

  /**
   * 记录错误日志
   */
  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context })
  }

  /**
   * 记录警告日志
   */
  warn(message: string, context?: string) {
    this.logger.warn(message, { context })
  }

  /**
   * 记录调试日志
   */
  debug(message: string, context?: string) {
    this.logger.debug(message, { context })
  }

  /**
   * 记录详细日志
   */
  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context })
  }

  /**
   * 记录 HTTP 请求日志
   */
  http(message: string, meta?: Record<string, unknown>) {
    this.logger.http(message, meta)
  }

  /**
   * 获取原始 Winston Logger 实例(用于高级用法)
   */
  getWinstonLogger(): Logger {
    return this.logger
  }
}

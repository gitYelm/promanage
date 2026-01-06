import { Module, Global } from '@nestjs/common'
import { WinstonModule } from 'nest-winston'
import { LoggerService } from './logger.service'
import { winstonConfig } from './logger.config'

/**
 * 全局日志模块
 * 提供统一的日志服务
 */
@Global()
@Module({
  imports: [WinstonModule.forRoot(winstonConfig)],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}

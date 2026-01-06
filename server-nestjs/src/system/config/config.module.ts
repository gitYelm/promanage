import { Module } from '@nestjs/common'
import { ConfigController } from './config.controller'
import { ConfigService } from './config.service'

@Module({
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class SysConfigModule {}

// 别名导出，方便其他模块引用
export { SysConfigModule as ConfigModule }

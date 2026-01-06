import { Module } from '@nestjs/common'
import { LogininforService } from './logininfor.service'
import { LogininforController } from './logininfor.controller'

@Module({
  controllers: [LogininforController],
  providers: [LogininforService],
})
export class LogininforModule {}

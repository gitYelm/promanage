import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ChangelogController } from './changelog.controller'
import { ChangelogService } from './changelog.service'
import { SysConfigModule } from '../config/config.module'
import { RedisModule } from '../../redis/redis.module'

@Module({
  imports: [HttpModule, SysConfigModule, RedisModule],
  controllers: [ChangelogController],
  providers: [ChangelogService],
})
export class ChangelogModule {}

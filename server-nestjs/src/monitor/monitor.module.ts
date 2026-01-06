import { Module, forwardRef } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { LoginLogService } from './login-log/login-log.service'
import { OnlineService } from './online/online.service'
import { OnlineController } from './online/online.controller'
import { LogininforService } from './logininfor/logininfor.service'
import { LogininforController } from './logininfor/logininfor.controller'
import { OperlogService } from './operlog/operlog.service'
import { OperlogController } from './operlog/operlog.controller'
import { ServerController } from './server/server.controller'
import { ServerService } from './server/server.service'
import { JobService } from './job/job.service'
import { JobController } from './job/job.controller'
import { JobExecutorService } from './job/job-executor.service'
import { CacheService } from './cache/cache.service'
import { CacheController } from './cache/cache.controller'
import { DatabaseService } from './database/database.service'
import { DatabaseController } from './database/database.controller'
import { RedisModule } from '../redis/redis.module'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
import { LoggerModule } from '../common/logger/logger.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RedisModule,
    PrismaModule,
    LoggerModule,
    forwardRef(() => AuthModule),
  ],
  providers: [
    LoginLogService,
    OnlineService,
    LogininforService,
    OperlogService,
    JobService,
    JobExecutorService,
    CacheService,
    ServerService,
    DatabaseService,
  ],
  controllers: [
    OnlineController,
    LogininforController,
    OperlogController,
    JobController,
    ServerController,
    CacheController,
    DatabaseController,
  ],
  exports: [
    LoginLogService,
    OnlineService,
    LogininforService,
    ServerService,
    CacheService,
    DatabaseService,
    JobExecutorService,
  ],
})
export class MonitorModule {}

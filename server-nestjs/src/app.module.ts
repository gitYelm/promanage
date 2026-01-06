import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { UserModule } from './system/user/user.module'
import { AuthModule } from './auth/auth.module'
import { MenuModule } from './system/menu/menu.module'
import { DeptModule } from './system/dept/dept.module'
import { RoleModule } from './system/role/role.module'
import { DictModule } from './system/dict/dict.module'
import { SysConfigModule } from './system/config/config.module'
import { NoticeModule } from './system/notice/notice.module'
import { OperationLogInterceptor } from './common/interceptors/operation-log.interceptor'
import { PermissionGuard } from './common/guards/permission.guard'
import { PostModule } from './system/post/post.module'
import { MonitorModule } from './monitor/monitor.module'
import { LoggerModule } from './common/logger/logger.module'
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware'
import { UploadModule } from './common/upload/upload.module'
import { MailModule } from './common/mail/mail.module'
import { ExcelModule } from './common/excel/excel.module'
import { ExportTaskModule } from './common/export/export-task.module'
import { ChangelogModule } from './system/changelog/changelog.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用
    }),
    LoggerModule,
    PrismaModule,
    UserModule,
    AuthModule,
    MenuModule,
    DeptModule,
    RoleModule,
    DictModule,
    SysConfigModule,
    NoticeModule,
    MonitorModule,
    PostModule,
    UploadModule,
    MailModule,
    ExcelModule,
    ExportTaskModule,
    ChangelogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PermissionGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*')
  }
}

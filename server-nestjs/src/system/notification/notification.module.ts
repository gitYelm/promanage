import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaModule } from '../../prisma/prisma.module'
import { LoggerModule } from '../../common/logger/logger.module'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'
import { NotificationStreamService } from './notification-stream.service'

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'super-secret-key',
      }),
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationStreamService],
  exports: [NotificationService],
})
export class NotificationModule {}

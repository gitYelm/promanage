import { Module, forwardRef } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { UserModule } from '../system/user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { MonitorModule } from '../monitor/monitor.module'
import { TokenBlacklistService } from './token-blacklist.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { RedisModule } from '../redis/redis.module'
import { CaptchaService } from './captcha.service'
import { TwoFactorService } from './two-factor.service'
import { SecurityConfigService } from './security-config.service'
import { UserStatusService } from './user-status.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    MonitorModule,
    RedisModule,
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'super-secret-key',
        // 注意：实际签发 Token 时会在 AuthService 中动态设置 expiresIn
        // 这里的配置仅作为默认值，实际使用数据库中的 sys.session.timeout 配置
        signOptions: {
          expiresIn: '30m', // 默认 30 分钟，实际由 SecurityConfigService 控制
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TokenBlacklistService,
    JwtAuthGuard,
    CaptchaService,
    TwoFactorService,
    SecurityConfigService,
    UserStatusService,
  ],
  exports: [AuthService, JwtAuthGuard, TokenBlacklistService, UserStatusService],
})
export class AuthModule {}

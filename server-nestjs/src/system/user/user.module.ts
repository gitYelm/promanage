import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { OperationLogInterceptor } from '../../common/interceptors/operation-log.interceptor';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ConfigModule } from '../config/config.module';
import { UserExportProvider } from './user-export.provider';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => ConfigModule)],
  controllers: [UserController],
  providers: [
    UserService,
    UserExportProvider,
    OperationLogInterceptor,
    PermissionGuard,
  ],
  exports: [UserService],
})
export class UserModule {}

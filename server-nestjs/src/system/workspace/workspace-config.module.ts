import { Module } from '@nestjs/common'
import { WorkspaceConfigController } from './workspace-config.controller'
import { WorkspaceConfigService } from './workspace-config.service'
import { SystemRoleSecurityService } from '../security/system-role-security.service'

@Module({
  controllers: [WorkspaceConfigController],
  providers: [WorkspaceConfigService, SystemRoleSecurityService],
  exports: [WorkspaceConfigService],
})
export class WorkspaceConfigModule {}

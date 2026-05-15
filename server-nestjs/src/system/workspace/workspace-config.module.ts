import { Module } from '@nestjs/common'
import { WorkspaceConfigController } from './workspace-config.controller'
import { WorkspaceConfigService } from './workspace-config.service'

@Module({
  controllers: [WorkspaceConfigController],
  providers: [WorkspaceConfigService],
  exports: [WorkspaceConfigService],
})
export class WorkspaceConfigModule {}

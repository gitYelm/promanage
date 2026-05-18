import { Module } from '@nestjs/common'
import { RoleService } from './role.service'
import { RoleController } from './role.controller'
import { SystemRoleSecurityService } from '../security/system-role-security.service'

@Module({
  controllers: [RoleController],
  providers: [RoleService, SystemRoleSecurityService],
  exports: [RoleService],
})
export class RoleModule {}

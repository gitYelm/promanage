import { Module } from '@nestjs/common'
import { MenuService } from './menu.service'
import { MenuController } from './menu.controller'
import { SystemMenuController } from './system-menu.controller'
import { SystemRoleSecurityService } from '../security/system-role-security.service'

@Module({
  controllers: [MenuController, SystemMenuController],
  providers: [MenuService, SystemRoleSecurityService],
  exports: [MenuService],
})
export class MenuModule {}

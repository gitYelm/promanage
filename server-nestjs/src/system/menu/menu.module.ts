import { Module } from '@nestjs/common'
import { MenuService } from './menu.service'
import { MenuController } from './menu.controller'
import { SystemMenuController } from './system-menu.controller'

@Module({
  controllers: [MenuController, SystemMenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}

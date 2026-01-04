import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { MenuService } from './menu.service';

@ApiTags('路由菜单')
@ApiBearerAuth('JWT-auth')
@Controller()
export class MenuController {
  constructor(private menuService: MenuService) {}

  @UseGuards(JwtAuthGuard)
  @Get('getRouters')
  @ApiOperation({ summary: '获取前端路由' })
  async getRouters(@Request() req: any) {
    const userId = req.user.userId as string;
    return this.menuService.getRouters(userId);
  }
}

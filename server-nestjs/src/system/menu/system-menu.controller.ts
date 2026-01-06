import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger'
import { MenuService } from './menu.service'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { QueryMenuDto } from './dto/query-menu.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'

@ApiTags('菜单管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('system/menu')
export class SystemMenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @RequirePermission('system:menu:add')
  @ApiOperation({ summary: '新增菜单' })
  @ApiBody({ type: CreateMenuDto })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.create(createMenuDto)
  }

  @Get()
  @RequirePermission('system:menu:list')
  @ApiOperation({ summary: '查询菜单列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() query: QueryMenuDto) {
    return this.menuService.findAll(query)
  }

  @Get('treeselect')
  @RequirePermission('system:menu:list')
  @ApiOperation({ summary: '查询菜单下拉树' })
  @ApiResponse({ status: 200, description: '查询成功' })
  treeSelect(@Query() query: QueryMenuDto) {
    return this.menuService.listTree(query)
  }

  @Get('roleMenuTreeselect/:roleId')
  @RequirePermission('system:menu:list')
  @ApiOperation({ summary: '查询角色菜单下拉树' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async roleMenuTreeselect(@Param('roleId') roleId: string) {
    const menus = await this.menuService.listTree({})
    return { menus }
  }

  @Put('changeStatus')
  @RequirePermission('system:menu:edit')
  @ApiOperation({ summary: '修改菜单状态' })
  changeStatus(@Body() body: { menuId: string; status: string }) {
    return this.menuService.changeStatus(body.menuId, body.status)
  }

  @Get(':menuId')
  @RequirePermission('system:menu:query')
  @ApiOperation({ summary: '查询菜单详情' })
  @ApiParam({ name: 'menuId', description: '菜单ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('menuId') menuId: string) {
    return this.menuService.findOne(menuId)
  }

  @Put(':menuId')
  @RequirePermission('system:menu:edit')
  @ApiOperation({ summary: '修改菜单' })
  @ApiParam({ name: 'menuId', description: '菜单ID' })
  @ApiBody({ type: UpdateMenuDto })
  @ApiResponse({ status: 200, description: '修改成功' })
  update(@Param('menuId') menuId: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.update(menuId, updateMenuDto)
  }

  @Delete(':menuId')
  @RequirePermission('system:menu:remove')
  @ApiOperation({ summary: '删除菜单' })
  @ApiParam({ name: 'menuId', description: '菜单ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('menuId') menuId: string) {
    return this.menuService.remove(menuId)
  }
}

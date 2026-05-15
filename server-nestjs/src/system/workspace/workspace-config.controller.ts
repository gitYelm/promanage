import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { Log, BusinessType } from '../../common/decorators/log.decorator'
import { WorkspaceConfigService } from './workspace-config.service'
import { QueryWorkspaceConfigDto } from './dto/query-workspace-config.dto'
import { CreateWorkspaceConfigDto } from './dto/create-workspace-config.dto'
import { UpdateWorkspaceConfigDto } from './dto/update-workspace-config.dto'

@ApiTags('工作台配置')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('system/workspace-config')
export class WorkspaceConfigController {
  constructor(private readonly service: WorkspaceConfigService) {}

  @Get('current')
  @ApiOperation({ summary: '获取当前用户工作台配置' })
  current(@Request() req: { user: { userId: string } }) {
    return this.service.resolveForUser(req.user.userId)
  }

  @Get('role-options')
  @RequirePermission('system:workspace:list')
  @ApiOperation({ summary: '工作台配置角色选项' })
  roleOptions() {
    return this.service.roleOptions()
  }

  @Get('menu-options')
  @RequirePermission('system:workspace:list')
  @ApiOperation({ summary: '工作台配置菜单路径选项' })
  menuOptions() {
    return this.service.menuOptions()
  }

  @Get()
  @RequirePermission('system:workspace:list')
  @ApiOperation({ summary: '查询角色工作台配置列表' })
  list(@Query() query: QueryWorkspaceConfigDto) {
    return this.service.findAll(query)
  }

  @Get(':configId')
  @RequirePermission('system:workspace:query')
  @ApiOperation({ summary: '查询角色工作台配置详情' })
  detail(@Param('configId') configId: string) {
    return this.service.findOne(configId)
  }

  @Post()
  @RequirePermission('system:workspace:add')
  @Log('工作台配置', BusinessType.INSERT)
  @ApiOperation({ summary: '新增角色工作台配置' })
  create(@Body() dto: CreateWorkspaceConfigDto) {
    return this.service.create(dto)
  }

  @Put(':configId')
  @RequirePermission('system:workspace:edit')
  @Log('工作台配置', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改角色工作台配置' })
  update(@Param('configId') configId: string, @Body() dto: UpdateWorkspaceConfigDto) {
    return this.service.update(configId, dto)
  }

  @Delete()
  @RequirePermission('system:workspace:remove')
  @Log('工作台配置', BusinessType.DELETE)
  @ApiOperation({ summary: '删除角色工作台配置' })
  remove(@Query('ids') ids: string) {
    return this.service.remove(ids ? ids.split(',') : [])
  }
}

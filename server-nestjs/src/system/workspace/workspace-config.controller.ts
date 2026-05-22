import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { Log, BusinessType } from '../../common/decorators/log.decorator'
import { WorkspaceConfigService } from './workspace-config.service'
import { QueryWorkspaceConfigDto } from './dto/query-workspace-config.dto'
import { CreateWorkspaceConfigDto } from './dto/create-workspace-config.dto'
import { UpdateWorkspaceConfigDto } from './dto/update-workspace-config.dto'
import { SystemRoleSecurityService } from '../security/system-role-security.service'

@ApiTags('工作台配置')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('system/workspace-config')
export class WorkspaceConfigController {
  constructor(
    private readonly service: WorkspaceConfigService,
    private readonly roleSecurity: SystemRoleSecurityService,
  ) {}

  @Get('current')
  @ApiOperation({ summary: '获取当前用户工作台配置' })
  current(@Request() req: { user: { userId: string } }) {
    return this.service.resolveForUser(req.user.userId)
  }

  @Get('role-options')
  @RequirePermission('system:workspace:list')
  @ApiOperation({ summary: '工作台配置角色选项' })
  async roleOptions(@Request() req: { user: { userId: string } }) {
    const maxSecurityLevel = await this.roleSecurity.listMaxSecurityLevel(req.user.userId)
    return this.service.roleOptions(maxSecurityLevel)
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
  async list(
    @Request() req: { user: { userId: string } },
    @Query() query: QueryWorkspaceConfigDto,
  ) {
    const maxSecurityLevel = await this.roleSecurity.listMaxSecurityLevel(req.user.userId)
    return this.service.findAll(query, maxSecurityLevel)
  }

  @Get(':configId')
  @RequirePermission('system:workspace:query')
  @ApiOperation({ summary: '查询角色工作台配置详情' })
  async detail(@Request() req: { user: { userId: string } }, @Param('configId') configId: string) {
    const maxSecurityLevel = await this.roleSecurity.listMaxSecurityLevel(req.user.userId)
    return this.service.findOne(configId, maxSecurityLevel)
  }

  @Post()
  @RequirePermission('system:workspace:add')
  @Log('工作台配置', BusinessType.INSERT)
  @ApiOperation({ summary: '新增角色工作台配置' })
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateWorkspaceConfigDto,
  ) {
    await this.roleSecurity.assertCanMaintainRoleKey(req.user.userId, dto.roleKey)
    return this.service.create(dto)
  }

  @Put(':configId')
  @RequirePermission('system:workspace:edit')
  @Log('工作台配置', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改角色工作台配置' })
  async update(
    @Request() req: { user: { userId: string } },
    @Param('configId') configId: string,
    @Body() dto: UpdateWorkspaceConfigDto,
  ) {
    const maxSecurityLevel = await this.roleSecurity.listMaxSecurityLevel(req.user.userId)
    const current = await this.service.findOne(configId, maxSecurityLevel)
    await this.roleSecurity.assertCanMaintainRoleKey(req.user.userId, current.roleKey)
    if (dto.roleKey) await this.roleSecurity.assertCanMaintainRoleKey(req.user.userId, dto.roleKey)
    return this.service.update(configId, dto, current)
  }

  @Delete()
  @RequirePermission('system:workspace:remove')
  @Log('工作台配置', BusinessType.DELETE)
  @ApiOperation({ summary: '删除角色工作台配置' })
  async remove(@Request() req: { user: { userId: string } }, @Query('ids') ids: string) {
    const maxSecurityLevel = await this.roleSecurity.listMaxSecurityLevel(req.user.userId)
    await Promise.all(
      (ids ? ids.split(',') : []).map((id) => this.service.findOne(id, maxSecurityLevel)),
    )
    return this.service.remove(ids ? ids.split(',') : [])
  }
}

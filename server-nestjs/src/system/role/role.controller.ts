import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger'
import { RoleService } from './role.service'
import { CreateRoleDto } from './dto/create-role.dto'
import { UpdateRoleDto } from './dto/update-role.dto'
import { QueryRoleDto } from './dto/query-role.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { Log, BusinessType } from '../../common/decorators/log.decorator'
import { SystemRoleSecurityService } from '../security/system-role-security.service'

type RequestWithUser = { user: { userId: string; username: string } }

@ApiTags('角色管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('system/role')
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly roleSecurity: SystemRoleSecurityService,
  ) {}

  @Post()
  @RequirePermission('system:role:add')
  @Log('角色管理', BusinessType.INSERT)
  @ApiOperation({ summary: '新增角色' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Request() req: RequestWithUser, @Body() createRoleDto: CreateRoleDto) {
    await this.roleSecurity.assertCanSetRoleLevel(req.user.userId, createRoleDto.securityLevel)
    await this.roleSecurity.assertCanGrantMenus(req.user.userId, createRoleDto.menuIds)
    return this.roleService.create(createRoleDto)
  }

  @Get()
  @RequirePermission('system:role:list')
  @ApiOperation({ summary: '查询角色列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Request() req: RequestWithUser, @Query() query: QueryRoleDto) {
    const maxSecurityLevel = await this.roleSecurity.listMaxSecurityLevel(req.user.userId)
    return this.roleService.findAll(query, maxSecurityLevel)
  }

  @Put('changeStatus')
  @RequirePermission('system:role:edit')
  @Log('角色管理', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改角色状态' })
  @ApiResponse({ status: 200, description: '修改成功' })
  async changeStatus(
    @Request() req: RequestWithUser,
    @Body() body: { roleId: string; status: string },
  ) {
    await this.roleSecurity.assertCanMaintainRole(req.user.userId, body.roleId)
    return this.roleService.changeStatus(body.roleId, body.status)
  }

  @Get(':roleId')
  @RequirePermission('system:role:query')
  @ApiOperation({ summary: '查询角色详情' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findOne(@Request() req: RequestWithUser, @Param('roleId') roleId: string) {
    await this.roleSecurity.assertCanMaintainRole(req.user.userId, roleId)
    return this.roleService.findOne(roleId)
  }

  @Put(':roleId')
  @RequirePermission('system:role:edit')
  @Log('角色管理', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改角色' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: '修改成功' })
  async update(
    @Request() req: RequestWithUser,
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    await this.roleSecurity.assertCanMaintainRole(req.user.userId, roleId)
    if (updateRoleDto.securityLevel !== undefined) {
      await this.roleSecurity.assertCanSetRoleLevel(req.user.userId, updateRoleDto.securityLevel)
    }
    await this.roleSecurity.assertCanGrantMenus(req.user.userId, updateRoleDto.menuIds)
    return this.roleService.update(roleId, updateRoleDto)
  }

  @Delete(':roleId')
  @RequirePermission('system:role:remove')
  @Log('角色管理', BusinessType.DELETE)
  @ApiOperation({ summary: '删除角色' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Request() req: RequestWithUser, @Param('roleId') roleId: string) {
    await this.roleSecurity.assertCanMaintainRole(req.user.userId, roleId)
    return this.roleService.remove(roleId)
  }
}

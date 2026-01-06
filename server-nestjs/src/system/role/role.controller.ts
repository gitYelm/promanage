import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common'
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

@ApiTags('角色管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('system/role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequirePermission('system:role:add')
  @ApiOperation({ summary: '新增角色' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto)
  }

  @Get()
  @RequirePermission('system:role:list')
  @ApiOperation({ summary: '查询角色列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() query: QueryRoleDto) {
    return this.roleService.findAll(query)
  }

  @Put('changeStatus')
  @RequirePermission('system:role:edit')
  @ApiOperation({ summary: '修改角色状态' })
  @ApiResponse({ status: 200, description: '修改成功' })
  changeStatus(@Body() body: { roleId: string; status: string }) {
    return this.roleService.changeStatus(body.roleId, body.status)
  }

  @Get(':roleId')
  @RequirePermission('system:role:query')
  @ApiOperation({ summary: '查询角色详情' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('roleId') roleId: string) {
    return this.roleService.findOne(roleId)
  }

  @Put(':roleId')
  @RequirePermission('system:role:edit')
  @ApiOperation({ summary: '修改角色' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: '修改成功' })
  update(@Param('roleId') roleId: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(roleId, updateRoleDto)
  }

  @Delete(':roleId')
  @RequirePermission('system:role:remove')
  @ApiOperation({ summary: '删除角色' })
  @ApiParam({ name: 'roleId', description: '角色ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('roleId') roleId: string) {
    return this.roleService.remove(roleId)
  }
}

import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger'
import { DeptService } from './dept.service'
import { CreateDeptDto } from './dto/create-dept.dto'
import { UpdateDeptDto } from './dto/update-dept.dto'
import { QueryDeptDto } from './dto/query-dept.dto'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'

@ApiTags('部门管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('system/dept')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @Post()
  @RequirePermission('system:dept:add')
  @ApiOperation({ summary: '新增部门' })
  @ApiBody({ type: CreateDeptDto })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createDeptDto: CreateDeptDto) {
    return this.deptService.create(createDeptDto)
  }

  @Get()
  @RequirePermission('system:dept:list')
  @ApiOperation({ summary: '查询部门列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() query: QueryDeptDto) {
    return this.deptService.findAll(query)
  }

  @Get('list/exclude/:deptId')
  @RequirePermission('system:dept:list')
  @ApiOperation({ summary: '查询部门列表（排除节点）' })
  @ApiParam({ name: 'deptId', description: '部门ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  listExcludeChild(@Param('deptId') deptId: string) {
    return this.deptService.listExcludeChild(deptId)
  }

  @Put('changeStatus')
  @RequirePermission('system:dept:edit')
  @ApiOperation({ summary: '修改部门状态' })
  @ApiBody({
    schema: {
      properties: { deptId: { type: 'string' }, status: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 200, description: '修改成功' })
  changeStatus(@Body() body: { deptId: string; status: string }) {
    return this.deptService.changeStatus(body.deptId, body.status)
  }

  @Get(':deptId')
  @RequirePermission('system:dept:query')
  @ApiOperation({ summary: '查询部门详情' })
  @ApiParam({ name: 'deptId', description: '部门ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('deptId') deptId: string) {
    return this.deptService.findOne(deptId)
  }

  @Put(':deptId')
  @RequirePermission('system:dept:edit')
  @ApiOperation({ summary: '修改部门' })
  @ApiParam({ name: 'deptId', description: '部门ID' })
  @ApiBody({ type: UpdateDeptDto })
  @ApiResponse({ status: 200, description: '修改成功' })
  update(@Param('deptId') deptId: string, @Body() updateDeptDto: UpdateDeptDto) {
    return this.deptService.update(deptId, updateDeptDto)
  }

  @Delete(':deptId')
  @RequirePermission('system:dept:remove')
  @ApiOperation({ summary: '删除部门' })
  @ApiParam({ name: 'deptId', description: '部门ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('deptId') deptId: string) {
    return this.deptService.remove(deptId)
  }
}

import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { Log, BusinessType } from '../../common/decorators/log.decorator'
import { BugProjectService } from './bug-project.service'
import {
  CreateBugModuleDto,
  CreateBugProjectDto,
  CreateBugVersionDto,
  QueryBugModuleDto,
  QueryBugProjectDto,
  QueryBugVersionDto,
  UpdateBugModuleDto,
  UpdateBugProjectDto,
  UpdateBugVersionDto,
  UpsertBugMemberDto,
} from '../dto/project.dto'
import { BugUserOptionQueryDto } from '../dto/common.dto'

type RequestWithUser = Request & { user: { userId: string; username: string } }

@ApiTags('Bug 项目配置')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('bug')
export class BugProjectController {
  constructor(private readonly service: BugProjectService) {}

  @Get('users/options')
  @RequirePermission(
    'bug:ticket:add',
    'bug:ticket:assign',
    'bug:project:add',
    'bug:project:edit',
    'bug:module:add',
    'bug:module:edit',
    'bug:project:member',
  )
  @ApiOperation({ summary: '获取 Bug 用户选项' })
  userOptions(@Query() query: BugUserOptionQueryDto) {
    return this.service.userOptions(query)
  }

  @Get('projects/options')
  @RequirePermission('bug:ticket:list', 'bug:ticket:add', 'bug:project:list')
  @ApiOperation({ summary: '获取项目选项' })
  options(@Req() req: RequestWithUser) {
    return this.service.optionsForUser(req.user.userId)
  }

  @Get('projects')
  @RequirePermission('bug:project:list')
  @ApiOperation({ summary: '查询 Bug 项目列表' })
  listProjects(@Query() query: QueryBugProjectDto, @Req() req: RequestWithUser) {
    return this.service.listProjects(query, req.user.userId)
  }

  @Post('projects')
  @RequirePermission('bug:project:add')
  @Log('Bug 项目', BusinessType.INSERT)
  @ApiOperation({ summary: '新增 Bug 项目' })
  createProject(@Body() dto: CreateBugProjectDto, @Req() req: RequestWithUser) {
    return this.service.createProject(dto, req.user)
  }

  @Put('projects/:projectId')
  @RequirePermission('bug:project:edit')
  @Log('Bug 项目', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改 Bug 项目' })
  updateProject(@Param('projectId') projectId: string, @Body() dto: UpdateBugProjectDto, @Req() req: RequestWithUser) {
    return this.service.updateProject(projectId, dto, req.user.userId)
  }

  @Delete('projects')
  @RequirePermission('bug:project:remove')
  @Log('Bug 项目', BusinessType.DELETE)
  @ApiOperation({ summary: '删除 Bug 项目' })
  removeProjects(@Query('ids') ids: string) {
    return this.service.removeProject(ids ? ids.split(',') : [])
  }

  @Get('modules')
  @RequirePermission('bug:module:list', 'bug:ticket:add', 'bug:ticket:list')
  @ApiOperation({ summary: '查询项目模块列表' })
  listModules(@Query() query: QueryBugModuleDto, @Req() req: RequestWithUser) {
    return this.service.listModules(query, req.user.userId)
  }

  @Post('modules')
  @RequirePermission('bug:module:add')
  @Log('Bug 模块', BusinessType.INSERT)
  @ApiOperation({ summary: '新增项目模块' })
  createModule(@Body() dto: CreateBugModuleDto) {
    return this.service.createModule(dto)
  }

  @Put('modules/:moduleId')
  @RequirePermission('bug:module:edit')
  @Log('Bug 模块', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改项目模块' })
  updateModule(@Param('moduleId') moduleId: string, @Body() dto: UpdateBugModuleDto) {
    return this.service.updateModule(moduleId, dto)
  }

  @Delete('modules')
  @RequirePermission('bug:module:remove')
  @Log('Bug 模块', BusinessType.DELETE)
  @ApiOperation({ summary: '删除项目模块' })
  removeModules(@Query('ids') ids: string) {
    return this.service.removeModule(ids ? ids.split(',') : [])
  }

  @Get('versions')
  @RequirePermission('bug:version:list', 'bug:ticket:add', 'bug:ticket:list')
  @ApiOperation({ summary: '查询项目版本列表' })
  listVersions(@Query() query: QueryBugVersionDto, @Req() req: RequestWithUser) {
    return this.service.listVersions(query, req.user.userId)
  }

  @Post('versions')
  @RequirePermission('bug:version:add')
  @Log('Bug 版本', BusinessType.INSERT)
  @ApiOperation({ summary: '新增项目版本' })
  createVersion(@Body() dto: CreateBugVersionDto) {
    return this.service.createVersion(dto)
  }

  @Put('versions/:versionId')
  @RequirePermission('bug:version:edit')
  @Log('Bug 版本', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改项目版本' })
  updateVersion(@Param('versionId') versionId: string, @Body() dto: UpdateBugVersionDto) {
    return this.service.updateVersion(versionId, dto)
  }

  @Delete('versions')
  @RequirePermission('bug:version:remove')
  @Log('Bug 版本', BusinessType.DELETE)
  @ApiOperation({ summary: '删除项目版本' })
  removeVersions(@Query('ids') ids: string) {
    return this.service.removeVersion(ids ? ids.split(',') : [])
  }

  @Get('projects/:projectId/members')
  @RequirePermission('bug:project:member')
  @ApiOperation({ summary: '查询项目成员' })
  listMembers(@Param('projectId') projectId: string, @Req() req: RequestWithUser) {
    return this.service.listMembers(projectId, req.user.userId)
  }

  @Post('projects/:projectId/members')
  @RequirePermission('bug:project:member')
  @Log('Bug 项目成员', BusinessType.UPDATE)
  @ApiOperation({ summary: '新增或更新项目成员' })
  upsertMember(@Param('projectId') projectId: string, @Body() dto: UpsertBugMemberDto, @Req() req: RequestWithUser) {
    return this.service.upsertMember(projectId, dto, req.user.userId)
  }

  @Delete('projects/members/:memberId')
  @RequirePermission('bug:project:member')
  @Log('Bug 项目成员', BusinessType.DELETE)
  @ApiOperation({ summary: '删除项目成员' })
  removeMember(@Param('memberId') memberId: string, @Req() req: RequestWithUser) {
    return this.service.removeMember(memberId, req.user.userId)
  }
}

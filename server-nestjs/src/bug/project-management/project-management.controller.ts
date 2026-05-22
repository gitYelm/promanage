import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { BusinessType, Log } from '../../common/decorators/log.decorator'
import {
  BatchAssignRequirementsDto,
  CreateIterationDto,
  CreateMilestoneDto,
  CreateRequirementDto,
  PmStatusActionDto,
  QueryIterationDto,
  QueryMilestoneDto,
  QueryRequirementDto,
  RequirementActionDto,
  UpdateIterationDto,
  UpdateMilestoneDto,
  UpdateProjectProgressDto,
  UpdateRequirementDto,
} from '../dto/project-management.dto'
import { ExcelService } from '../../common/excel/excel.service'
import { ProjectDashboardQueryDto } from '../dto/project-dashboard.dto'
import { ProjectRequirementService } from './project-requirement.service'
import {
  ProjectRequirementImportService,
  RequirementImportRow,
} from './project-requirement-import.service'
import { ProjectIterationService } from './project-iteration.service'
import { ProjectMilestoneService } from './project-milestone.service'
import { ProjectOverviewService } from './project-overview.service'
import { ExecutiveDashboardService } from './executive-dashboard.service'
import {
  REQUIREMENT_IMPORT_COLUMN_MAP,
  REQUIREMENT_IMPORT_COLUMNS,
  REQUIREMENT_IMPORT_EXAMPLE,
} from './project-requirement-excel.config'

type RequestWithUser = Request & { user: { userId: string; username: string } }

@ApiTags('项目管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-management')
export class ProjectManagementController {
  constructor(
    private readonly requirements: ProjectRequirementService,
    private readonly requirementImport: ProjectRequirementImportService,
    private readonly iterations: ProjectIterationService,
    private readonly milestones: ProjectMilestoneService,
    private readonly overviewService: ProjectOverviewService,
    private readonly dashboard: ExecutiveDashboardService,
    private readonly excelService: ExcelService,
  ) {}

  @Get('requirements')
  @RequirePermission('pm:requirement:view')
  @ApiOperation({ summary: '需求列表' })
  listRequirements(@Query() query: QueryRequirementDto, @Req() req: RequestWithUser) {
    return this.requirements.list(query, req.user)
  }
  @Get('requirements/import/template')
  @RequirePermission('pm:requirement:create')
  @ApiOperation({ summary: '下载需求导入模板' })
  requirementTemplate(@Res() res: Response) {
    return this.excelService.generateTemplate(
      res,
      REQUIREMENT_IMPORT_COLUMNS,
      '需求导入模板',
      '需求列表',
      REQUIREMENT_IMPORT_EXAMPLE,
    )
  }
  @Post('requirements/import')
  @RequirePermission('pm:requirement:create')
  @Log('项目需求', BusinessType.IMPORT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '导入需求数据' })
  async importRequirements(@UploadedFile() file: Express.Multer.File, @Req() req: RequestWithUser) {
    if (!file) return { code: 400, msg: '请选择要导入的文件' }
    const rows = await this.excelService.parseExcel<RequirementImportRow>(
      file.buffer,
      REQUIREMENT_IMPORT_COLUMN_MAP,
    )
    if (rows.length === 0) return { code: 400, msg: 'Excel 文件中没有数据' }
    return this.requirementImport.importRows(rows, req.user)
  }
  @Get('requirements/:id')
  @RequirePermission('pm:requirement:view')
  @ApiOperation({ summary: '需求详情' })
  requirementDetail(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.requirements.detail(id, req.user)
  }
  @Post('requirements')
  @RequirePermission('pm:requirement:create')
  @Log('项目需求', BusinessType.INSERT)
  @ApiOperation({ summary: '创建需求' })
  createRequirement(@Body() dto: CreateRequirementDto, @Req() req: RequestWithUser) {
    return this.requirements.create(dto, req.user)
  }
  @Put('requirements/:id')
  @RequirePermission('pm:requirement:update')
  @Log('项目需求', BusinessType.UPDATE)
  @ApiOperation({ summary: '编辑需求' })
  updateRequirement(
    @Param('id') id: string,
    @Body() dto: UpdateRequirementDto,
    @Req() req: RequestWithUser,
  ) {
    return this.requirements.update(id, dto, req.user)
  }
  @Post('requirements/batch-assign')
  @RequirePermission('pm:requirement:update')
  @Log('项目需求', BusinessType.UPDATE)
  @ApiOperation({ summary: '批量修改需求负责人/开发/测试人员' })
  batchAssignRequirements(@Body() dto: BatchAssignRequirementsDto, @Req() req: RequestWithUser) {
    return this.requirements.batchAssign(dto, req.user)
  }
  @Post('requirements/:id/status/:action')
  @RequirePermission('pm:requirement:status', 'pm:requirement:review')
  @Log('需求状态', BusinessType.UPDATE)
  @ApiOperation({ summary: '需求状态流转' })
  requirementAction(
    @Param('id') id: string,
    @Param('action') action: string,
    @Body() dto: RequirementActionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.requirements.action(id, action, dto, req.user)
  }
  @Delete('requirements')
  @RequirePermission('pm:requirement:update')
  @Log('项目需求', BusinessType.DELETE)
  @ApiOperation({ summary: '删除需求' })
  removeRequirements(@Query('ids') ids: string, @Req() req: RequestWithUser) {
    return this.requirements.remove(ids ? ids.split(',') : [], req.user)
  }

  @Get('iterations')
  @RequirePermission('pm:iteration:view')
  @ApiOperation({ summary: '迭代列表' })
  listIterations(@Query() query: QueryIterationDto, @Req() req: RequestWithUser) {
    return this.iterations.list(query, req.user)
  }
  @Post('iterations')
  @RequirePermission('pm:iteration:manage')
  @Log('项目迭代', BusinessType.INSERT)
  @ApiOperation({ summary: '创建迭代' })
  createIteration(@Body() dto: CreateIterationDto, @Req() req: RequestWithUser) {
    return this.iterations.create(dto, req.user)
  }
  @Put('iterations/:id')
  @RequirePermission('pm:iteration:manage')
  @Log('项目迭代', BusinessType.UPDATE)
  @ApiOperation({ summary: '编辑迭代' })
  updateIteration(
    @Param('id') id: string,
    @Body() dto: UpdateIterationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.iterations.update(id, dto, req.user)
  }
  @Post('iterations/:id/status/:action')
  @RequirePermission('pm:iteration:manage')
  @Log('迭代状态', BusinessType.UPDATE)
  @ApiOperation({ summary: '迭代状态流转' })
  iterationAction(
    @Param('id') id: string,
    @Param('action') action: string,
    @Body() dto: PmStatusActionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.iterations.action(id, action, dto, req.user)
  }
  @Delete('iterations')
  @RequirePermission('pm:iteration:manage')
  @Log('项目迭代', BusinessType.DELETE)
  @ApiOperation({ summary: '删除迭代' })
  removeIterations(@Query('ids') ids: string, @Req() req: RequestWithUser) {
    return this.iterations.remove(ids ? ids.split(',') : [], req.user)
  }

  @Get('milestones')
  @RequirePermission('pm:milestone:view')
  @ApiOperation({ summary: '里程碑列表' })
  listMilestones(@Query() query: QueryMilestoneDto, @Req() req: RequestWithUser) {
    return this.milestones.list(query, req.user)
  }
  @Post('milestones')
  @RequirePermission('pm:milestone:manage')
  @Log('项目里程碑', BusinessType.INSERT)
  @ApiOperation({ summary: '创建里程碑' })
  createMilestone(@Body() dto: CreateMilestoneDto, @Req() req: RequestWithUser) {
    return this.milestones.create(dto, req.user)
  }
  @Put('milestones/:id')
  @RequirePermission('pm:milestone:manage')
  @Log('项目里程碑', BusinessType.UPDATE)
  @ApiOperation({ summary: '编辑里程碑' })
  updateMilestone(
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneDto,
    @Req() req: RequestWithUser,
  ) {
    return this.milestones.update(id, dto, req.user)
  }
  @Post('milestones/:id/status/:action')
  @RequirePermission('pm:milestone:manage')
  @Log('里程碑状态', BusinessType.UPDATE)
  @ApiOperation({ summary: '里程碑状态流转' })
  milestoneAction(
    @Param('id') id: string,
    @Param('action') action: string,
    @Body() dto: PmStatusActionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.milestones.action(id, action, dto, req.user)
  }
  @Delete('milestones')
  @RequirePermission('pm:milestone:manage')
  @Log('项目里程碑', BusinessType.DELETE)
  @ApiOperation({ summary: '删除里程碑' })
  removeMilestones(@Query('ids') ids: string, @Req() req: RequestWithUser) {
    return this.milestones.remove(ids ? ids.split(',') : [], req.user)
  }

  @Get('projects/:projectId/overview')
  @RequirePermission('pm:project:view')
  @ApiOperation({ summary: '项目概览' })
  overview(@Param('projectId') projectId: string, @Req() req: RequestWithUser) {
    return this.overviewService.overview(projectId, req.user)
  }
  @Put('projects/:projectId/progress')
  @RequirePermission('pm:project:update')
  @Log('项目进度', BusinessType.UPDATE)
  @ApiOperation({ summary: '更新项目阶段、进度和风险' })
  updateProgress(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectProgressDto,
    @Req() req: RequestWithUser,
  ) {
    return this.overviewService.updateProgress(projectId, dto, req.user)
  }
  @Get('executive-dashboard/summary')
  @RequirePermission('pm:executive-dashboard:view')
  @ApiOperation({ summary: '仪表盘总览' })
  summary(@Query() query: ProjectDashboardQueryDto, @Req() req: RequestWithUser) {
    return this.dashboard.summary(query, req.user)
  }
  @Get('executive-dashboard/projects')
  @RequirePermission('pm:executive-dashboard:view')
  @ApiOperation({ summary: '项目健康度' })
  projects(@Query() query: ProjectDashboardQueryDto, @Req() req: RequestWithUser) {
    return this.dashboard.projects(query, req.user)
  }
  @Get('executive-dashboard/risks')
  @RequirePermission('pm:executive-dashboard:view')
  @ApiOperation({ summary: '风险事项' })
  risks(@Query() query: ProjectDashboardQueryDto, @Req() req: RequestWithUser) {
    return this.dashboard.risks(query, req.user)
  }
  @Get('executive-dashboard/upcoming')
  @RequirePermission('pm:executive-dashboard:view')
  @ApiOperation({ summary: '下阶段安排' })
  upcoming(@Query() query: ProjectDashboardQueryDto, @Req() req: RequestWithUser) {
    return this.dashboard.upcoming(query, req.user)
  }
  @Get('executive-dashboard/current-work')
  @RequirePermission('pm:executive-dashboard:view')
  @ApiOperation({ summary: '当前处理事项' })
  currentWork(@Query() query: ProjectDashboardQueryDto, @Req() req: RequestWithUser) {
    return this.dashboard.currentWork(query, req.user)
  }
  @Get('executive-dashboard/completed-history')
  @RequirePermission('pm:executive-dashboard:view')
  @ApiOperation({ summary: '历史完成事项' })
  completedHistory(@Query() query: ProjectDashboardQueryDto, @Req() req: RequestWithUser) {
    return this.dashboard.completedHistory(query, req.user)
  }
  @Get('executive-dashboard/pending-work')
  @RequirePermission('pm:executive-dashboard:view')
  @ApiOperation({ summary: '未处理事项' })
  pendingWork(@Query() query: ProjectDashboardQueryDto, @Req() req: RequestWithUser) {
    return this.dashboard.pendingWork(query, req.user)
  }
  @Get('executive-dashboard/actions')
  @RequirePermission('pm:executive-dashboard:view')
  @ApiOperation({ summary: '管理层行动建议' })
  actions(@Query() query: ProjectDashboardQueryDto, @Req() req: RequestWithUser) {
    return this.dashboard.actions(query, req.user)
  }
}

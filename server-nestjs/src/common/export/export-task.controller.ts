import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import type { Response } from 'express'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { CurrentUser } from '../decorators/current-user.decorator'
import { Log, BusinessType } from '../decorators/log.decorator'
import { ExportTaskService } from './export-task.service'
import { ExportPermissionService } from './export-permission.service'
import { CreateExportTaskDto } from './dto/create-export-task.dto'
import { QueryExportTaskDto } from './dto/query-export-task.dto'

type RequestWithUser = { user: { userId: string; username: string } }

@ApiTags('导出任务')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportTaskController {
  constructor(
    private readonly exportTaskService: ExportTaskService,
    private readonly exportPermissionService: ExportPermissionService,
  ) {}

  @Post('task')
  @Log('导出任务', BusinessType.INSERT)
  @ApiOperation({ summary: '创建导出任务' })
  async create(
    @Body() dto: CreateExportTaskDto,
    @Request() req: RequestWithUser,
    @CurrentUser('username') username: string,
  ) {
    await this.exportPermissionService.assertCanExportModule(req.user.userId, dto.module)
    dto.queryParams = { ...(dto.queryParams || {}), __operatorId: req.user.userId }
    return this.exportTaskService.createTask(dto, username)
  }

  @Get('task')
  @ApiOperation({ summary: '查询导出任务列表' })
  findAll(@Query() query: QueryExportTaskDto, @CurrentUser('username') username: string) {
    return this.exportTaskService.findAll(query, username)
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: '获取任务详情' })
  async findOne(@Param('taskId') taskId: string, @CurrentUser('username') username: string) {
    await this.exportPermissionService.assertCanAccessTask(taskId, username)
    return this.exportTaskService.findOne(taskId)
  }

  @Get('task/:taskId/download')
  @ApiOperation({ summary: '下载导出文件' })
  async download(
    @Param('taskId') taskId: string,
    @Request() req: RequestWithUser,
    @CurrentUser('username') username: string,
    @Res() res: Response,
  ) {
    const task = await this.exportPermissionService.assertCanAccessTask(taskId, username)
    await this.exportPermissionService.assertCanExportModule(req.user.userId, task.module)
    const { filePath, filename } = await this.exportTaskService.getDownloadPath(taskId, username)
    this.sendExportFile(res, filePath, filename)
  }

  @Delete('task/:taskId')
  @Log('导出任务', BusinessType.DELETE)
  @ApiOperation({ summary: '删除导出任务' })
  async remove(@Param('taskId') taskId: string, @CurrentUser('username') username: string) {
    await this.exportPermissionService.assertCanAccessTask(taskId, username)
    return this.exportTaskService.remove(taskId, username)
  }

  @Get('columns/:module')
  @ApiOperation({ summary: '获取模块可导出列' })
  async getColumns(@Param('module') module: string, @Request() req: RequestWithUser) {
    await this.exportPermissionService.assertCanExportModule(req.user.userId, module)
    return this.exportTaskService.getModuleColumns(module)
  }

  @Get('config')
  @ApiOperation({ summary: '获取导出配置' })
  async getConfig() {
    const fileExpireHours = await this.exportTaskService.getFileExpireHours()
    return { fileExpireHours }
  }

  private sendExportFile(res: Response, filePath: string, filename: string) {
    const ext = filename.split('.').pop()
    const contentTypes: Record<string, string> = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv; charset=utf-8',
      json: 'application/json; charset=utf-8',
    }

    res.setHeader('Content-Type', contentTypes[ext || 'xlsx'] || 'application/octet-stream')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    )
    res.sendFile(filePath)
  }
}

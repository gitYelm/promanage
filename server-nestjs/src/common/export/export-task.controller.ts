import { Controller, Get, Post, Delete, Body, Param, Query, Res, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import type { Response } from 'express'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { CurrentUser } from '../decorators/current-user.decorator'
import { ExportTaskService } from './export-task.service'
import { CreateExportTaskDto } from './dto/create-export-task.dto'
import { QueryExportTaskDto } from './dto/query-export-task.dto'

@ApiTags('导出任务')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportTaskController {
  constructor(private readonly exportTaskService: ExportTaskService) {}

  @Post('task')
  @ApiOperation({ summary: '创建导出任务' })
  create(@Body() dto: CreateExportTaskDto, @CurrentUser('username') username: string) {
    return this.exportTaskService.createTask(dto, username)
  }

  @Get('task')
  @ApiOperation({ summary: '查询导出任务列表' })
  findAll(@Query() query: QueryExportTaskDto, @CurrentUser('username') username: string) {
    return this.exportTaskService.findAll(query, username)
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: '获取任务详情' })
  findOne(@Param('taskId') taskId: string) {
    return this.exportTaskService.findOne(taskId)
  }

  @Get('task/:taskId/download')
  @ApiOperation({ summary: '下载导出文件' })
  async download(
    @Param('taskId') taskId: string,
    @CurrentUser('username') username: string,
    @Res() res: Response,
  ) {
    const { filePath, filename } = await this.exportTaskService.getDownloadPath(taskId, username)

    // 根据扩展名设置 Content-Type
    const ext = filename.split('.').pop()
    const contentTypes: Record<string, string> = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv; charset=utf-8',
      json: 'application/json; charset=utf-8',
    }

    res.setHeader('Content-Type', contentTypes[ext || 'xlsx'] || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`)
    res.sendFile(filePath)
  }

  @Delete('task/:taskId')
  @ApiOperation({ summary: '删除导出任务' })
  remove(@Param('taskId') taskId: string, @CurrentUser('username') username: string) {
    return this.exportTaskService.remove(taskId, username)
  }

  @Get('columns/:module')
  @ApiOperation({ summary: '获取模块可导出列' })
  getColumns(@Param('module') module: string) {
    return this.exportTaskService.getModuleColumns(module)
  }

  @Get('config')
  @ApiOperation({ summary: '获取导出配置' })
  async getConfig() {
    const fileExpireHours = await this.exportTaskService.getFileExpireHours()
    return { fileExpireHours }
  }
}

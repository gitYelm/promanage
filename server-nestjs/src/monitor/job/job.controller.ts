import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { JobService } from './job.service'
import { QueryJobDto } from './dto/query-job.dto'
import { CreateJobDto } from './dto/create-job.dto'
import { UpdateJobDto } from './dto/update-job.dto'

@ApiTags('定时任务')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('monitor/job')
export class JobController {
  constructor(private readonly service: JobService) {}

  @Get()
  @RequirePermission('monitor:job:list')
  @ApiOperation({ summary: '查询定时任务列表' })
  list(@Query() query: QueryJobDto) {
    return this.service.findAll(query)
  }

  @Get('log')
  @RequirePermission('monitor:job:list')
  @ApiOperation({ summary: '查询任务执行日志' })
  listLogs(
    @Query('jobName') jobName?: string,
    @Query('jobGroup') jobGroup?: string,
    @Query('status') status?: string,
    @Query('pageNum') pageNum?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.service.findJobLogs({
      jobName,
      jobGroup,
      status,
      pageNum,
      pageSize,
    })
  }

  @Delete('log/clean')
  @RequirePermission('monitor:job:remove')
  @ApiOperation({ summary: '清空任务日志' })
  cleanLogs() {
    return this.service.cleanJobLogs()
  }

  @Post('run')
  @RequirePermission('monitor:job:changeStatus')
  @ApiOperation({ summary: '立即执行一次任务' })
  run(@Body() body: { jobId: string }) {
    return this.service.run(body.jobId)
  }

  @Put('changeStatus')
  @RequirePermission('monitor:job:changeStatus')
  @ApiOperation({ summary: '修改任务状态' })
  changeStatus(@Body() body: { jobId: string; status: string }) {
    return this.service.changeStatus(body.jobId, body.status)
  }

  @Get(':jobId')
  @RequirePermission('monitor:job:query')
  @ApiOperation({ summary: '查询定时任务详情' })
  get(@Param('jobId') jobId: string) {
    return this.service.findOne(jobId)
  }

  @Post()
  @RequirePermission('monitor:job:add')
  @ApiOperation({ summary: '新增定时任务' })
  create(@Body() dto: CreateJobDto) {
    return this.service.create(dto)
  }

  @Put(':jobId')
  @RequirePermission('monitor:job:edit')
  @ApiOperation({ summary: '修改定时任务' })
  update(@Param('jobId') jobId: string, @Body() dto: UpdateJobDto) {
    return this.service.update(jobId, dto)
  }

  @Delete()
  @RequirePermission('monitor:job:remove')
  @ApiOperation({ summary: '删除定时任务' })
  remove(@Query('ids') ids: string) {
    const jobIds = ids ? ids.split(',') : []
    return this.service.remove(jobIds)
  }
}

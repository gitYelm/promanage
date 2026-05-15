import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { Log, BusinessType } from '../../common/decorators/log.decorator'
import { BUG_ACTION, type BugAction } from '../constants/bug.constants'
import { BugTicketService } from './bug-ticket.service'
import { BugStatisticsService } from './bug-statistics.service'
import {
  BugActionDto,
  CreateBugCommentDto,
  CreateBugTicketDto,
  QueryBugTicketDto,
  UpdateBugTicketDto,
} from '../dto/ticket.dto'

type RequestWithUser = Request & { user: { userId: string; username: string } }

@ApiTags('Bug 管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('bug/tickets')
export class BugTicketController {
  constructor(
    private readonly service: BugTicketService,
    private readonly statisticsService: BugStatisticsService,
  ) {}

  @Get('statistics')
  @RequirePermission('bug:statistics:view')
  @ApiOperation({ summary: 'Bug 统计' })
  statistics(@Req() req: RequestWithUser) {
    return this.statisticsService.overview(req.user)
  }

  @Get()
  @RequirePermission('bug:ticket:list', 'bug:ticket:my')
  @ApiOperation({ summary: '查询 Bug 列表' })
  list(@Query() query: QueryBugTicketDto, @Req() req: RequestWithUser) {
    return this.service.list(query, req.user)
  }

  @Get('pending-count')
  @RequirePermission('bug:ticket:list', 'bug:ticket:my')
  @ApiOperation({ summary: '我的待处理 Bug 数量' })
  pendingCount(@Req() req: RequestWithUser) {
    return this.service.pendingCount(req.user)
  }

  @Post()
  @RequirePermission('bug:ticket:add')
  @Log('Bug 工单', BusinessType.INSERT)
  @ApiOperation({ summary: '提交 Bug' })
  create(@Body() dto: CreateBugTicketDto, @Req() req: RequestWithUser) {
    return this.service.create(dto, req.user)
  }

  @Get(':ticketId')
  @RequirePermission('bug:ticket:query')
  @ApiOperation({ summary: '查询 Bug 详情' })
  detail(@Param('ticketId') ticketId: string, @Req() req: RequestWithUser) {
    return this.service.detail(ticketId, req.user)
  }

  @Put(':ticketId')
  @RequirePermission('bug:ticket:edit')
  @Log('Bug 工单', BusinessType.UPDATE)
  @ApiOperation({ summary: '编辑 Bug' })
  update(
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateBugTicketDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.update(ticketId, dto, req.user)
  }

  @Delete()
  @RequirePermission('bug:ticket:remove')
  @Log('Bug 工单', BusinessType.DELETE)
  @ApiOperation({ summary: '删除 Bug' })
  remove(@Query('ids') ids: string, @Req() req: RequestWithUser) {
    return this.service.remove(ids ? ids.split(',') : [], req.user)
  }

  @Post(':ticketId/comments')
  @RequirePermission('bug:comment:add')
  @Log('Bug 评论', BusinessType.INSERT)
  @ApiOperation({ summary: '新增 Bug 评论' })
  comment(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateBugCommentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.comment(ticketId, dto, req.user)
  }

  @Post(':ticketId/actions/:action')
  @RequirePermission(
    'bug:ticket:changeStatus',
    'bug:ticket:list',
    'bug:ticket:my',
    'bug:ticket:confirm',
    'bug:ticket:reject',
    'bug:ticket:startFix',
    'bug:ticket:submitVerify',
    'bug:ticket:verify',
    'bug:ticket:close',
    'bug:ticket:reopen',
  )
  @Log('Bug 状态流转', BusinessType.UPDATE)
  @ApiOperation({ summary: '执行 Bug 状态动作' })
  action(
    @Param('ticketId') ticketId: string,
    @Param('action') action: BugAction,
    @Body() dto: BugActionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.action(ticketId, action, dto, req.user)
  }

  @Post(':ticketId/assign')
  @RequirePermission('bug:ticket:assign')
  @Log('Bug 指派', BusinessType.UPDATE)
  @ApiOperation({ summary: '指派 Bug 负责人' })
  assign(
    @Param('ticketId') ticketId: string,
    @Body() dto: BugActionDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.action(ticketId, BUG_ACTION.ASSIGN, dto, req.user)
  }
}

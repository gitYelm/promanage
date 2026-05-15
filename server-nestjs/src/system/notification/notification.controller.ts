import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Sse,
  UseGuards,
  type MessageEvent,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Observable } from 'rxjs'
import type { Request } from 'express'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { NotificationService } from './notification.service'
import { NotificationStreamService } from './notification-stream.service'
import { QueryNotificationDto } from './dto/query-notification.dto'

type RequestWithUser = Request & { user: { userId: string; username: string } }

@ApiTags('站内通知')
@ApiBearerAuth('JWT-auth')
@Controller('system/notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly streamService: NotificationStreamService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('system:notification:list')
  @ApiOperation({ summary: '查询我的站内通知' })
  list(@Query() query: QueryNotificationDto, @Req() req: RequestWithUser) {
    return this.notificationService.list(query, req.user.userId)
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('system:notification:list')
  @ApiOperation({ summary: '查询我的未读通知数量' })
  unreadCount(@Req() req: RequestWithUser) {
    return this.notificationService.unreadCount(req.user.userId)
  }

  @Post('stream-token')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('system:notification:stream')
  @ApiOperation({ summary: '生成站内通知实时连接令牌' })
  streamToken(@Req() req: RequestWithUser) {
    return this.streamService.createStreamToken(req.user)
  }

  @Put('read-all')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('system:notification:read')
  @ApiOperation({ summary: '全部通知标记已读' })
  markAllRead(@Req() req: RequestWithUser) {
    return this.notificationService.markAllRead(req.user.userId)
  }

  @Put(':notificationId/read')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('system:notification:read')
  @ApiOperation({ summary: '单条通知标记已读' })
  markRead(@Param('notificationId') notificationId: string, @Req() req: RequestWithUser) {
    return this.notificationService.markRead(notificationId, req.user.userId)
  }

  @Sse('stream')
  @ApiOperation({ summary: '站内通知实时推送流' })
  stream(@Query('token') token: string): Observable<MessageEvent> {
    const user = this.streamService.verifyStreamToken(token)
    return this.streamService.stream(user.userId)
  }
}

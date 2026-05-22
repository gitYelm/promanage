import { Controller, Get, Delete, Param, Query, Req, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import type { Request } from 'express'
import { OnlineService } from './online.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { Log, BusinessType } from '../../common/decorators/log.decorator'
import { QueryOnlineDto } from './dto/query-online.dto'
import { TokenBlacklistService } from '../../auth/token-blacklist.service'

type RequestWithUser = Request & { user: { userId: string; username: string } }

@ApiTags('在线用户')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('monitor/online')
export class OnlineController {
  constructor(
    private readonly onlineService: OnlineService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  @Get('list')
  @RequirePermission('monitor:online:list')
  @ApiOperation({ summary: '查询在线用户列表' })
  list(@Query() query: QueryOnlineDto) {
    return this.onlineService.list(query)
  }

  @Get('stream-token')
  @RequirePermission('monitor:online:list')
  @ApiOperation({ summary: '生成在线用户实时推送连接令牌' })
  streamToken(@Req() req: RequestWithUser) {
    return this.onlineService.createStreamToken(req.user)
  }

  @Delete(':token')
  @RequirePermission('monitor:online:forceLogout')
  @Log('在线用户', BusinessType.FORCE)
  @ApiOperation({ summary: '强制下线用户' })
  async remove(@Param('token') token: string) {
    // 将 token 加入黑名单，使其立即失效
    await this.tokenBlacklistService.add(token)
    // 从在线用户列表中移除
    await this.onlineService.remove(token)
    return { removed: true }
  }
}

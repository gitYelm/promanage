import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { OnlineService } from './online.service'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { QueryOnlineDto } from './dto/query-online.dto'
import { TokenBlacklistService } from '../../auth/token-blacklist.service'

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

  @Delete(':token')
  @RequirePermission('monitor:online:forceLogout')
  @ApiOperation({ summary: '强制下线用户' })
  async remove(@Param('token') token: string) {
    // 将 token 加入黑名单，使其立即失效
    await this.tokenBlacklistService.add(token)
    // 从在线用户列表中移除
    await this.onlineService.remove(token)
    return { removed: true }
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { ServerService } from './server.service'

@ApiTags('服务器监控')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('monitor/server')
export class ServerController {
  constructor(private readonly service: ServerService) {}

  @Get()
  @RequirePermission('monitor:server:list')
  @ApiOperation({ summary: '获取服务器信息' })
  get() {
    return this.service.getInfo()
  }
}

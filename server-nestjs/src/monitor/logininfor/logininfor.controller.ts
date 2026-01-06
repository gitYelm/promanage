import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { LogininforService } from './logininfor.service'
import { QueryLogininforDto } from './dto/query-logininfor.dto'

@ApiTags('登录日志')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('monitor/logininfor')
export class LogininforController {
  constructor(private readonly service: LogininforService) {}

  @Get()
  @RequirePermission('monitor:logininfor:list')
  @ApiOperation({ summary: '查询登录日志列表' })
  list(@Query() query: QueryLogininforDto) {
    return this.service.findAll(query)
  }

  @Delete()
  @RequirePermission('monitor:logininfor:remove')
  @ApiOperation({ summary: '删除登录日志' })
  remove(@Query('ids') ids: string) {
    const infoIds = ids ? ids.split(',') : []
    return this.service.remove(infoIds)
  }

  @Get('clean')
  @RequirePermission('monitor:logininfor:remove')
  @ApiOperation({ summary: '清空登录日志' })
  clean() {
    return this.service.clean()
  }
}

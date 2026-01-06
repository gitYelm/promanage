import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { OperlogService } from './operlog.service'
import { QueryOperLogDto } from './dto/query-operlog.dto'

@ApiTags('操作日志')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('monitor/operlog')
export class OperlogController {
  constructor(private readonly service: OperlogService) {}

  @Get()
  @RequirePermission('monitor:operlog:list')
  @ApiOperation({ summary: '查询操作日志列表' })
  list(@Query() query: QueryOperLogDto) {
    return this.service.findAll(query)
  }

  @Delete()
  @RequirePermission('monitor:operlog:remove')
  @ApiOperation({ summary: '删除操作日志' })
  remove(@Query('ids') ids: string) {
    const operIds = ids ? ids.split(',') : []
    return this.service.remove(operIds)
  }

  @Get('clean')
  @RequirePermission('monitor:operlog:remove')
  @ApiOperation({ summary: '清空操作日志' })
  clean() {
    return this.service.clean()
  }
}

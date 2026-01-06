import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { DatabaseService } from './database.service'

@ApiTags('数据库监控')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('monitor/database')
export class DatabaseController {
  constructor(private readonly service: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: '获取数据库信息' })
  getInfo() {
    return this.service.getInfo()
  }
}

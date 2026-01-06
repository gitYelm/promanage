import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ChangelogService } from './changelog.service'

@ApiTags('更新日志')
@Controller('system/changelog')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChangelogController {
  constructor(private readonly service: ChangelogService) {}

  @Get()
  @ApiOperation({ summary: '获取 Git 提交记录' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认 1' })
  @ApiQuery({ name: 'perPage', required: false, description: '每页数量，默认 30' })
  async getCommits(@Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.service.getCommits(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 30,
    )
  }
}

import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { Log, BusinessType } from '../../common/decorators/log.decorator'
import { ConfigService } from './config.service'
import { QueryConfigDto } from './dto/query-config.dto'
import { CreateConfigDto } from './dto/create-config.dto'
import { UpdateConfigDto } from './dto/update-config.dto'

@ApiTags('参数配置')
@Controller('system/config')
export class ConfigController {
  constructor(private readonly service: ConfigService) {}

  @Get('site')
  @ApiOperation({ summary: '获取网站公开配置（无需登录）' })
  async getSiteConfig(): Promise<{
    name: string
    description: string
    logo: string
    favicon: string
    copyright: string
    icp: string
    loginPath: string
  }> {
    return await this.service.getSiteConfig()
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('upload')
  @ApiOperation({ summary: '获取上传配置' })
  async getUploadConfig(): Promise<{
    editorImageMaxSize: number
    editorVideoMaxSize: number
    avatarMaxSize: number
    systemMaxSize: number
  }> {
    return await this.service.getUploadConfig()
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission('system:config:list')
  @Get()
  @ApiOperation({ summary: '查询参数配置列表' })
  list(@Query() query: QueryConfigDto) {
    return this.service.findAll(query)
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission('system:config:query')
  @Get(':configId')
  @ApiOperation({ summary: '查询参数配置详情' })
  get(@Param('configId') configId: string) {
    return this.service.findOne(configId)
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission('system:config:add')
  @Log('参数配置', BusinessType.INSERT)
  @Post()
  @ApiOperation({ summary: '新增参数配置' })
  create(@Body() dto: CreateConfigDto) {
    return this.service.create(dto)
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission('system:config:edit')
  @Log('参数配置', BusinessType.UPDATE)
  @Put(':configId')
  @ApiOperation({ summary: '修改参数配置' })
  update(@Param('configId') configId: string, @Body() dto: UpdateConfigDto) {
    return this.service.update(configId, dto)
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission('system:config:remove')
  @Log('参数配置', BusinessType.DELETE)
  @Delete()
  @ApiOperation({ summary: '删除参数配置' })
  remove(@Query('ids') ids: string) {
    const configIds = ids ? ids.split(',') : []
    return this.service.remove(configIds)
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission('system:config:edit')
  @Log('参数配置', BusinessType.CLEAN)
  @Get('refreshCache')
  @ApiOperation({ summary: '刷新参数缓存' })
  refresh() {
    return this.service.refreshCache()
  }
}

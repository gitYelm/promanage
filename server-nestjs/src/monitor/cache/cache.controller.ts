import { Controller, Get, Query, Delete, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { CacheService } from './cache.service'

@ApiTags('缓存监控')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('monitor/cache')
export class CacheController {
  constructor(private readonly service: CacheService) {}

  @Get()
  @ApiOperation({ summary: '获取缓存信息' })
  async get() {
    return this.service.getCache()
  }

  @Delete('name')
  @ApiOperation({ summary: '清除指定缓存' })
  async clearName(@Query('cacheName') cacheName: string) {
    await this.service.clearCacheName(cacheName)
    return null
  }

  @Delete('all')
  @ApiOperation({ summary: '清空所有缓存' })
  async clearAll() {
    await this.service.clearCacheAll()
    return null
  }

  @Get('names')
  @ApiOperation({ summary: '获取缓存名称列表' })
  async names() {
    return this.service.listCacheName()
  }

  @Get('keys')
  @ApiOperation({ summary: '获取缓存键列表' })
  async keys(@Query('cacheName') cacheName: string) {
    return this.service.listCacheKey(cacheName)
  }

  @Get('value')
  @ApiOperation({ summary: '获取缓存值' })
  async value(@Query('cacheName') cacheName: string, @Query('cacheKey') cacheKey: string) {
    return this.service.getCacheValue(cacheName, cacheKey)
  }
}

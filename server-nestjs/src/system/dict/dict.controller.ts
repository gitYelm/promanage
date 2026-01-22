import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { Log, BusinessType } from '../../common/decorators/log.decorator'
import { DictService } from './dict.service'
import { QueryDictTypeDto } from './dto/query-dict-type.dto'
import { CreateDictTypeDto } from './dto/create-dict-type.dto'
import { UpdateDictTypeDto } from './dto/update-dict-type.dto'

@ApiTags('字典类型')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('system/dict/type')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get()
  @RequirePermission('system:dict:list')
  @ApiOperation({ summary: '查询字典类型列表' })
  list(@Query() query: QueryDictTypeDto) {
    return this.dictService.listTypes(query)
  }

  @Post()
  @RequirePermission('system:dict:add')
  @Log('字典类型', BusinessType.INSERT)
  @ApiOperation({ summary: '新增字典类型' })
  create(@Body() dto: CreateDictTypeDto) {
    return this.dictService.createType(dto)
  }

  @Put('changeStatus')
  @RequirePermission('system:dict:edit')
  @Log('字典类型', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改字典类型状态' })
  changeStatus(@Body() body: { dictId: string; status: string }) {
    return this.dictService.changeTypeStatus(body.dictId, body.status)
  }

  @Get(':dictId')
  @RequirePermission('system:dict:query')
  @ApiOperation({ summary: '查询字典类型详情' })
  get(@Param('dictId') dictId: string) {
    return this.dictService.getType(dictId)
  }

  @Put(':dictId')
  @RequirePermission('system:dict:edit')
  @Log('字典类型', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改字典类型' })
  update(@Param('dictId') dictId: string, @Body() dto: UpdateDictTypeDto) {
    return this.dictService.updateType(dictId, dto)
  }

  @Delete()
  @RequirePermission('system:dict:remove')
  @Log('字典类型', BusinessType.DELETE)
  @ApiOperation({ summary: '删除字典类型' })
  remove(@Query('ids') ids: string) {
    const dictIds = ids ? ids.split(',') : []
    return this.dictService.removeTypes(dictIds)
  }
}

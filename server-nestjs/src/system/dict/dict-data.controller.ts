import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { DictDataService } from './dict-data.service';
import { QueryDictDataDto } from './dto/query-dict-data.dto';
import { CreateDictDataDto } from './dto/create-dict-data.dto';
import { UpdateDictDataDto } from './dto/update-dict-data.dto';

@ApiTags('字典数据')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('system/dict/data')
export class DictDataController {
  constructor(private readonly service: DictDataService) {}

  @Get()
  @RequirePermission('system:dict:list')
  @ApiOperation({ summary: '查询字典数据列表' })
  list(@Query() query: QueryDictDataDto) {
    return this.service.list(query);
  }

  @Post()
  @RequirePermission('system:dict:add')
  @ApiOperation({ summary: '新增字典数据' })
  create(@Body() dto: CreateDictDataDto) {
    return this.service.create(dto);
  }

  @Put('changeStatus')
  @RequirePermission('system:dict:edit')
  @ApiOperation({ summary: '修改字典数据状态' })
  changeStatus(@Body() body: { dictCode: string; status: string }) {
    return this.service.changeStatus(body.dictCode, body.status);
  }

  @Get(':dictCode')
  @RequirePermission('system:dict:query')
  @ApiOperation({ summary: '查询字典数据详情' })
  get(@Param('dictCode') dictCode: string) {
    return this.service.get(dictCode);
  }

  @Put(':dictCode')
  @RequirePermission('system:dict:edit')
  @ApiOperation({ summary: '修改字典数据' })
  update(@Param('dictCode') dictCode: string, @Body() dto: UpdateDictDataDto) {
    return this.service.update(dictCode, dto);
  }

  @Delete()
  @RequirePermission('system:dict:remove')
  @ApiOperation({ summary: '删除字典数据' })
  remove(@Query('ids') ids: string) {
    const dictCodes = ids ? ids.split(',') : [];
    return this.service.remove(dictCodes);
  }
}

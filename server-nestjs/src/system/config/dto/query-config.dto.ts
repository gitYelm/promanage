import { IsOptional, IsString } from 'class-validator'
import { SortableQueryDto } from '../../../common/dto/sortable-query.dto'

export class QueryConfigDto extends SortableQueryDto {
  @IsOptional()
  @IsString()
  configName?: string

  @IsOptional()
  @IsString()
  configKey?: string

  @IsOptional()
  @IsString()
  configType?: string

  @IsOptional()
  pageNum?: number

  @IsOptional()
  pageSize?: number
}

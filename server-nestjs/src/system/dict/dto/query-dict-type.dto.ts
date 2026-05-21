import { IsOptional, IsString } from 'class-validator'
import { SortableQueryDto } from '../../../common/dto/sortable-query.dto'

export class QueryDictTypeDto extends SortableQueryDto {
  @IsOptional()
  @IsString()
  dictName?: string

  @IsOptional()
  @IsString()
  dictType?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  pageNum?: number

  @IsOptional()
  pageSize?: number
}

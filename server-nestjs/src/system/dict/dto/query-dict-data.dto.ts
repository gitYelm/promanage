import { IsOptional, IsString } from 'class-validator'
import { SortableQueryDto } from '../../../common/dto/sortable-query.dto'

export class QueryDictDataDto extends SortableQueryDto {
  @IsOptional()
  @IsString()
  dictType?: string

  @IsOptional()
  @IsString()
  dictLabel?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  pageNum?: number

  @IsOptional()
  pageSize?: number
}

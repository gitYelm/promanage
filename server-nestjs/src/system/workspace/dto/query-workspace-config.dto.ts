import { IsOptional, IsString } from 'class-validator'
import { SortableQueryDto } from '../../../common/dto/sortable-query.dto'

export class QueryWorkspaceConfigDto extends SortableQueryDto {
  @IsOptional()
  @IsString()
  roleKey?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  pageNum?: number

  @IsOptional()
  pageSize?: number
}

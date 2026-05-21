import { IsOptional, IsString } from 'class-validator'
import { SortableQueryDto } from '../../../common/dto/sortable-query.dto'

export class QueryNoticeDto extends SortableQueryDto {
  @IsOptional()
  @IsString()
  noticeTitle?: string

  @IsOptional()
  @IsString()
  noticeType?: string

  @IsOptional()
  @IsString()
  createBy?: string

  @IsOptional()
  pageNum?: number

  @IsOptional()
  pageSize?: number
}

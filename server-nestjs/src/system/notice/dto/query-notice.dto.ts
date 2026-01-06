import { IsOptional, IsString } from 'class-validator'

export class QueryNoticeDto {
  @IsOptional()
  @IsString()
  noticeTitle?: string

  @IsOptional()
  @IsString()
  noticeType?: string

  @IsOptional()
  pageNum?: number

  @IsOptional()
  pageSize?: number
}

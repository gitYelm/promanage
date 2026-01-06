import { IsOptional, IsString } from 'class-validator'

export class QueryDictDataDto {
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

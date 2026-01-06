import { IsOptional, IsString } from 'class-validator'

export class QueryDictTypeDto {
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

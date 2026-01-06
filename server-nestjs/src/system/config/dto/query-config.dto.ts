import { IsOptional, IsString } from 'class-validator'

export class QueryConfigDto {
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

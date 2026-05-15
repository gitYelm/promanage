import { IsOptional, IsString } from 'class-validator'

export class QueryWorkspaceConfigDto {
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

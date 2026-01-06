import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class QueryJobDto {
  @ApiPropertyOptional({ description: '任务名称', example: '系统默认' })
  @IsOptional()
  @IsString()
  jobName?: string

  @ApiPropertyOptional({ description: '任务组名', example: 'DEFAULT' })
  @IsOptional()
  @IsString()
  jobGroup?: string

  @ApiPropertyOptional({ description: '状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  pageNum?: number

  @ApiPropertyOptional({ description: '每页条数', example: 10 })
  @IsOptional()
  pageSize?: number
}

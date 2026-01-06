import { IsOptional, IsString, IsDateString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class QueryLogininforDto {
  @ApiPropertyOptional({ description: '用户名', example: 'admin' })
  @IsOptional()
  @IsString()
  userName?: string

  @ApiPropertyOptional({ description: '登录状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '登录IP', example: '127.0.0.1' })
  @IsOptional()
  @IsString()
  ipaddr?: string

  @ApiPropertyOptional({ description: '开始时间', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  beginTime?: string

  @ApiPropertyOptional({ description: '结束时间', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endTime?: string

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  pageNum?: number

  @ApiPropertyOptional({ description: '每页条数', example: 10 })
  @IsOptional()
  pageSize?: number
}

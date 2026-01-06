import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class QueryOnlineDto {
  @ApiPropertyOptional({ description: '用户名', example: 'admin' })
  @IsOptional()
  @IsString()
  userName?: string

  @ApiPropertyOptional({ description: '登录IP', example: '127.0.0.1' })
  @IsOptional()
  @IsString()
  ipaddr?: string

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  pageNum?: number

  @ApiPropertyOptional({ description: '每页条数', example: 10 })
  @IsOptional()
  pageSize?: number
}

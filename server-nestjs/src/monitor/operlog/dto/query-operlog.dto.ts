import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class QueryOperLogDto {
  @ApiPropertyOptional({ description: '系统模块', example: '用户管理' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ description: '操作人员', example: 'admin' })
  @IsOptional()
  @IsString()
  operName?: string

  @ApiPropertyOptional({ description: '操作状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '业务类型', example: '1' })
  @IsOptional()
  @IsString()
  businessType?: string

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  pageNum?: number

  @ApiPropertyOptional({ description: '每页条数', example: 10 })
  @IsOptional()
  pageSize?: number
}

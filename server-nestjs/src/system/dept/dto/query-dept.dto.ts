import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class QueryDeptDto {
  @ApiPropertyOptional({ description: '部门名称', example: '研发部门' })
  @IsOptional()
  @IsString()
  deptName?: string

  @ApiPropertyOptional({ description: '部门状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string
}

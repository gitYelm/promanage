import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class QueryMenuDto {
  @ApiPropertyOptional({ description: '菜单名称', example: '用户管理' })
  @IsOptional()
  @IsString()
  menuName?: string

  @ApiPropertyOptional({ description: '菜单状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string
}

import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class QueryRoleDto {
  @ApiPropertyOptional({ description: '角色名称', example: '管理员' })
  @IsOptional()
  @IsString()
  roleName?: string

  @ApiPropertyOptional({ description: '权限字符', example: 'admin' })
  @IsOptional()
  @IsString()
  roleKey?: string

  @ApiPropertyOptional({ description: '角色状态', example: '0' })
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

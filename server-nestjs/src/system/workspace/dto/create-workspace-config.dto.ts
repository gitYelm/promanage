import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateWorkspaceConfigDto {
  @ApiProperty({ description: '角色权限字符串', example: 'developer' })
  @IsNotEmpty({ message: '角色标识不能为空' })
  @IsString()
  roleKey!: string

  @ApiProperty({ description: '登录后默认首页', example: '/bug/my' })
  @IsNotEmpty({ message: '默认首页不能为空' })
  @IsString()
  defaultPath!: string

  @ApiPropertyOptional({ description: '仪表盘替代路径', example: '/project-management/statistics' })
  @IsOptional()
  @IsString()
  dashboardPath?: string

  @ApiPropertyOptional({ description: '默认展开菜单路径', example: '/bug' })
  @IsOptional()
  @IsString()
  defaultOpenMenu?: string

  @ApiPropertyOptional({ description: '菜单显示策略', example: 'all', enum: ['all', 'business', 'custom'] })
  @IsOptional()
  @IsIn(['all', 'business', 'custom'])
  menuScope?: string

  @ApiPropertyOptional({ description: '是否启用', example: '0', enum: ['0', '1'] })
  @IsOptional()
  @IsIn(['0', '1'])
  status?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}

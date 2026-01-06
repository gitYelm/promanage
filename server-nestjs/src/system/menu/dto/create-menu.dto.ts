import { IsNotEmpty, IsString, IsNumber, IsOptional, IsIn } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateMenuDto {
  @ApiPropertyOptional({ description: '父菜单ID', example: '0' })
  @IsOptional()
  @IsString()
  parentId?: string

  @ApiProperty({
    description: '菜单类型（M=目录 C=菜单 F=按钮）',
    example: 'C',
    enum: ['M', 'C', 'F'],
  })
  @IsNotEmpty({ message: '菜单类型不能为空' })
  @IsIn(['M', 'C', 'F'])
  menuType: string

  @ApiProperty({ description: '菜单名称', example: '用户管理' })
  @IsNotEmpty({ message: '菜单名称不能为空' })
  @IsString()
  menuName: string

  @ApiProperty({ description: '显示排序', example: 1 })
  @IsNotEmpty({ message: '显示排序不能为空' })
  @IsNumber()
  orderNum: number

  @ApiPropertyOptional({ description: '路由地址', example: 'user' })
  @IsOptional()
  @IsString()
  path?: string

  @ApiPropertyOptional({
    description: '组件路径',
    example: 'system/user/index',
  })
  @IsOptional()
  @IsString()
  component?: string

  @ApiPropertyOptional({ description: '权限标识', example: 'system:user:list' })
  @IsOptional()
  @IsString()
  perms?: string

  @ApiPropertyOptional({ description: '菜单图标', example: 'user' })
  @IsOptional()
  @IsString()
  icon?: string

  @ApiPropertyOptional({
    description: '显示状态',
    example: '0',
    enum: ['0', '1'],
  })
  @IsOptional()
  @IsString()
  visible?: string

  @ApiPropertyOptional({
    description: '菜单状态',
    example: '0',
    enum: ['0', '1'],
  })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({
    description: '是否外链',
    example: 0,
    enum: [0, 1],
  })
  @IsOptional()
  @IsNumber()
  isFrame?: number

  @ApiPropertyOptional({
    description: '是否缓存',
    example: 0,
    enum: [0, 1],
  })
  @IsOptional()
  @IsNumber()
  isCache?: number

  @ApiPropertyOptional({ description: '备注', example: '用户管理菜单' })
  @IsOptional()
  @IsString()
  remark?: string
}

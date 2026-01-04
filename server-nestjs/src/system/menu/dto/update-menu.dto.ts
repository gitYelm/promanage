import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMenuDto {
  @ApiPropertyOptional({ description: '父菜单ID', example: '0' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: '菜单类型',
    example: 'C',
    enum: ['M', 'C', 'F'],
  })
  @IsOptional()
  @IsIn(['M', 'C', 'F'])
  menuType?: string;

  @ApiPropertyOptional({ description: '菜单名称', example: '用户管理' })
  @IsOptional()
  @IsString()
  menuName?: string;

  @ApiPropertyOptional({ description: '显示排序', example: 1 })
  @IsOptional()
  @IsNumber()
  orderNum?: number;

  @ApiPropertyOptional({ description: '路由地址', example: 'user' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    description: '组件路径',
    example: 'system/user/index',
  })
  @IsOptional()
  @IsString()
  component?: string;

  @ApiPropertyOptional({ description: '权限标识', example: 'system:user:list' })
  @IsOptional()
  @IsString()
  perms?: string;

  @ApiPropertyOptional({ description: '菜单图标', example: 'user' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: '显示状态', example: '0' })
  @IsOptional()
  @IsString()
  visible?: string;

  @ApiPropertyOptional({ description: '菜单状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '是否外链', example: 0 })
  @IsOptional()
  @IsNumber()
  isFrame?: number;

  @ApiPropertyOptional({ description: '是否缓存', example: 0 })
  @IsOptional()
  @IsNumber()
  isCache?: number;

  @ApiPropertyOptional({ description: '备注', example: '用户管理菜单' })
  @IsOptional()
  @IsString()
  remark?: string;
}

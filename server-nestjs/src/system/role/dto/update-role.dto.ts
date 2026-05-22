import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
  Max,
  IsInt,
} from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: '角色名称', example: '管理员' })
  @IsOptional()
  @IsString()
  roleName?: string

  @ApiPropertyOptional({ description: '权限字符', example: 'admin' })
  @IsOptional()
  @IsString()
  roleKey?: string

  @ApiPropertyOptional({ description: '显示顺序', example: 1 })
  @IsOptional()
  @IsNumber()
  roleSort?: number

  @ApiPropertyOptional({ description: '安全等级', example: 100 })
  @IsOptional()
  @IsNumber()
  @IsInt({ message: '安全等级必须是整数' })
  @Min(0, { message: '安全等级不能小于0' })
  @Max(1000, { message: '安全等级不能大于1000' })
  securityLevel?: number

  @ApiPropertyOptional({ description: '数据范围', example: '1' })
  @IsOptional()
  @IsString()
  dataScope?: string

  @ApiPropertyOptional({
    description: '菜单树选择项是否关联显示',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  menuCheckStrictly?: boolean

  @ApiPropertyOptional({
    description: '部门树选择项是否关联显示',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  deptCheckStrictly?: boolean

  @ApiPropertyOptional({ description: '角色状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '备注', example: '管理员角色' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({
    description: '菜单ID列表',
    example: ['1', '2', '3'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  menuIds?: string[]
}

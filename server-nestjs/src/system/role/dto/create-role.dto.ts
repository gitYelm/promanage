import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: '管理员' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @IsString()
  roleName: string

  @ApiProperty({ description: '权限字符', example: 'admin' })
  @IsNotEmpty({ message: '权限字符不能为空' })
  @IsString()
  roleKey: string

  @ApiProperty({ description: '显示顺序', example: 1 })
  @IsNotEmpty({ message: '显示顺序不能为空' })
  @IsNumber()
  roleSort: number

  @ApiPropertyOptional({
    description: '数据范围',
    example: '1',
    enum: ['1', '2', '3', '4', '5'],
  })
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

  @ApiPropertyOptional({
    description: '角色状态',
    example: '0',
    enum: ['0', '1'],
  })
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

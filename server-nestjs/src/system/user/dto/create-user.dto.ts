import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  ValidateIf,
  Matches,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * 创建用户 DTO
 */
export class CreateUserDto {
  @ApiProperty({ description: '用户账号', example: 'zhangsan' })
  @IsNotEmpty({ message: '用户名称不能为空' })
  @IsString()
  userName: string

  @ApiProperty({ description: '用户昵称', example: '张三' })
  @IsNotEmpty({ message: '用户昵称不能为空' })
  @IsString()
  nickName: string

  @ApiPropertyOptional({ description: '用户密码', example: '123456' })
  @IsOptional()
  @IsString()
  password?: string

  @ApiPropertyOptional({ description: '部门ID', example: '100' })
  @IsOptional()
  @IsString()
  deptId?: string

  @ApiPropertyOptional({ description: '手机号码', example: '13800138000' })
  @ValidateIf(
    (o: CreateUserDto) =>
      o.phonenumber !== '' && o.phonenumber !== null && o.phonenumber !== undefined,
  )
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phonenumber?: string

  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'zhangsan@example.com',
  })
  @ValidateIf((o: CreateUserDto) => o.email !== '' && o.email !== null && o.email !== undefined)
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string

  @ApiPropertyOptional({
    description: '用户性别（0=男 1=女 2=未知）',
    example: '0',
    enum: ['0', '1', '2'],
  })
  @IsOptional()
  @IsString()
  sex?: string

  @ApiPropertyOptional({
    description: '用户类型（00=系统用户）',
    example: '00',
  })
  @IsOptional()
  @IsString()
  userType?: string

  @ApiPropertyOptional({
    description: '用户状态（0=正常 1=停用）',
    example: '0',
    enum: ['0', '1'],
  })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '备注信息', example: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '头像地址', example: '/avatar.png' })
  @IsOptional()
  @IsString()
  avatar?: string

  @ApiPropertyOptional({
    description: '角色ID列表',
    example: ['1', '2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  roleIds?: string[]

  @ApiPropertyOptional({
    description: '岗位ID列表',
    example: ['1'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  postIds?: string[]
}

import { IsOptional, IsString, IsArray, IsEmail, ValidateIf, Matches } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '用户账号', example: 'zhangsan' })
  @IsOptional()
  @IsString()
  userName?: string

  @ApiPropertyOptional({ description: '用户昵称', example: '张三' })
  @IsOptional()
  @IsString()
  nickName?: string

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
    (o: UpdateUserDto) =>
      o.phonenumber !== '' && o.phonenumber !== null && o.phonenumber !== undefined,
  )
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phonenumber?: string

  @ApiPropertyOptional({
    description: '邮箱地址',
    example: 'zhangsan@example.com',
  })
  @ValidateIf((o: UpdateUserDto) => o.email !== '' && o.email !== null && o.email !== undefined)
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string

  @ApiPropertyOptional({
    description: '用户性别',
    example: '0',
    enum: ['0', '1', '2'],
  })
  @IsOptional()
  @IsString()
  sex?: string

  @ApiPropertyOptional({ description: '用户类型', example: '00' })
  @IsOptional()
  @IsString()
  userType?: string

  @ApiPropertyOptional({
    description: '用户状态',
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

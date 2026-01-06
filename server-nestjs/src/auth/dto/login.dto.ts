import { IsNotEmpty, IsString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({
    description: '用户名',
    example: 'admin',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string

  @ApiProperty({
    description: '密码',
    example: 'admin123',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string

  @ApiPropertyOptional({
    description: '验证码',
    example: 'abcd',
  })
  @IsString()
  @IsOptional()
  code?: string

  @ApiPropertyOptional({
    description: '验证码唯一标识',
    example: 'uuid-xxx',
  })
  @IsString()
  @IsOptional()
  uuid?: string
}

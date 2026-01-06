import { IsNotEmpty, IsString, Length } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class VerifyTwoFactorDto {
  @ApiProperty({ description: '临时令牌', example: 'uuid-xxx' })
  @IsString()
  @IsNotEmpty({ message: '临时令牌不能为空' })
  tempToken: string

  @ApiProperty({ description: '两步验证码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(6, 6, { message: '验证码必须是6位数字' })
  code: string
}

export class SetupTwoFactorDto {
  @ApiProperty({ description: '两步验证码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @Length(6, 6, { message: '验证码必须是6位数字' })
  code: string

  @ApiProperty({ description: '密钥', example: 'JBSWY3DPEHPK3PXP' })
  @IsString()
  @IsNotEmpty({ message: '密钥不能为空' })
  secret: string
}

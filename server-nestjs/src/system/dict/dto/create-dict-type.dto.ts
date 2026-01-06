import { IsString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateDictTypeDto {
  @ApiProperty({ description: '字典名称', example: '用户性别' })
  @IsString()
  dictName!: string

  @ApiProperty({ description: '字典类型', example: 'sys_user_sex' })
  @IsString()
  dictType!: string

  @ApiPropertyOptional({ description: '状态', example: '0', enum: ['0', '1'] })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '备注', example: '用户性别列表' })
  @IsOptional()
  @IsString()
  remark?: string
}

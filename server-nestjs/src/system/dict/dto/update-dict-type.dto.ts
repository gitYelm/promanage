import { IsString, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateDictTypeDto {
  @ApiPropertyOptional({ description: '字典名称', example: '用户性别' })
  @IsOptional()
  @IsString()
  dictName?: string

  @ApiPropertyOptional({ description: '字典类型', example: 'sys_user_sex' })
  @IsOptional()
  @IsString()
  dictType?: string

  @ApiPropertyOptional({ description: '状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '备注', example: '用户性别列表' })
  @IsOptional()
  @IsString()
  remark?: string
}

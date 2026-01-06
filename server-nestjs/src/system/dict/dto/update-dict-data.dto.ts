import { IsString, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateDictDataDto {
  @ApiPropertyOptional({ description: '字典排序', example: 1 })
  @IsOptional()
  dictSort?: number

  @ApiPropertyOptional({ description: '字典标签', example: '男' })
  @IsOptional()
  @IsString()
  dictLabel?: string

  @ApiPropertyOptional({ description: '字典键值', example: '0' })
  @IsOptional()
  @IsString()
  dictValue?: string

  @ApiPropertyOptional({ description: '字典类型', example: 'sys_user_sex' })
  @IsOptional()
  @IsString()
  dictType?: string

  @ApiPropertyOptional({ description: '样式属性', example: '' })
  @IsOptional()
  @IsString()
  cssClass?: string

  @ApiPropertyOptional({ description: '表格回显样式', example: 'primary' })
  @IsOptional()
  @IsString()
  listClass?: string

  @ApiPropertyOptional({ description: '是否默认', example: 'N' })
  @IsOptional()
  @IsString()
  isDefault?: string

  @ApiPropertyOptional({ description: '状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string
}

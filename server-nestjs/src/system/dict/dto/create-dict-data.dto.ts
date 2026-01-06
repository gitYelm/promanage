import { IsString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateDictDataDto {
  @ApiPropertyOptional({ description: '字典排序', example: 1 })
  @IsOptional()
  dictSort?: number

  @ApiProperty({ description: '字典标签', example: '男' })
  @IsString()
  dictLabel!: string

  @ApiProperty({ description: '字典键值', example: '0' })
  @IsString()
  dictValue!: string

  @ApiProperty({ description: '字典类型', example: 'sys_user_sex' })
  @IsString()
  dictType!: string

  @ApiPropertyOptional({ description: '样式属性', example: '' })
  @IsOptional()
  @IsString()
  cssClass?: string

  @ApiPropertyOptional({
    description: '表格回显样式',
    example: 'primary',
    enum: ['default', 'primary', 'success', 'info', 'warning', 'danger'],
  })
  @IsOptional()
  @IsString()
  listClass?: string

  @ApiPropertyOptional({
    description: '是否默认',
    example: 'N',
    enum: ['Y', 'N'],
  })
  @IsOptional()
  @IsString()
  isDefault?: string

  @ApiPropertyOptional({ description: '状态', example: '0', enum: ['0', '1'] })
  @IsOptional()
  @IsString()
  status?: string
}

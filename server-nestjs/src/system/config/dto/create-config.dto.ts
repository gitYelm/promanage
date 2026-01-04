import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConfigDto {
  @ApiProperty({
    description: '参数名称',
    example: '主框架页-默认皮肤样式名称',
  })
  @IsString()
  configName!: string;

  @ApiProperty({ description: '参数键名', example: 'sys.index.skinName' })
  @IsString()
  configKey!: string;

  @ApiProperty({ description: '参数键值', example: 'skin-blue' })
  @IsString()
  configValue!: string;

  @ApiPropertyOptional({
    description: '系统内置',
    example: 'Y',
    enum: ['Y', 'N'],
  })
  @IsOptional()
  @IsString()
  configType?: string;
}

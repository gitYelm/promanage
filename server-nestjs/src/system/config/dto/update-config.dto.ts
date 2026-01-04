import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConfigDto {
  @ApiPropertyOptional({
    description: '参数名称',
    example: '主框架页-默认皮肤样式名称',
  })
  @IsOptional()
  @IsString()
  configName?: string;

  @ApiPropertyOptional({
    description: '参数键名',
    example: 'sys.index.skinName',
  })
  @IsOptional()
  @IsString()
  configKey?: string;

  @ApiPropertyOptional({ description: '参数键值', example: 'skin-blue' })
  @IsOptional()
  @IsString()
  configValue?: string;

  @ApiPropertyOptional({ description: '系统内置', example: 'Y' })
  @IsOptional()
  @IsString()
  configType?: string;
}

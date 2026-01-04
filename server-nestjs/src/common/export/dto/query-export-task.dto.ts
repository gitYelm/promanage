import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../dto/pagination.dto';

export class QueryExportTaskDto extends PaginationDto {
  @ApiPropertyOptional({ description: '模块名称' })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({
    description: '状态',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  status?: string;
}

import { IsString, IsOptional, IsArray, IsEnum, IsObject } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum ExportFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
  JSON = 'json',
}

export enum ExportScope {
  CURRENT_PAGE = 'current',
  ALL = 'all',
  SELECTED = 'selected',
}

export class ExportColumnDto {
  @ApiProperty({ description: '列键名' })
  @IsString()
  key: string

  @ApiProperty({ description: '列标题' })
  @IsString()
  header: string

  @ApiPropertyOptional({ description: '列宽度' })
  @IsOptional()
  width?: number
}

export class CreateExportTaskDto {
  @ApiProperty({ description: '模块名称', example: 'user' })
  @IsString()
  module: string

  @ApiPropertyOptional({ description: '任务名称' })
  @IsOptional()
  @IsString()
  taskName?: string

  @ApiProperty({
    description: '导出格式',
    enum: ExportFormat,
    default: ExportFormat.XLSX,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat = ExportFormat.XLSX

  @ApiProperty({
    description: '导出范围',
    enum: ExportScope,
    default: ExportScope.ALL,
  })
  @IsEnum(ExportScope)
  scope: ExportScope = ExportScope.ALL

  @ApiPropertyOptional({ description: '导出列配置' })
  @IsOptional()
  @IsArray()
  columns?: ExportColumnDto[]

  @ApiPropertyOptional({ description: '查询参数' })
  @IsOptional()
  @IsObject()
  queryParams?: Record<string, any>

  @ApiPropertyOptional({ description: '选中的ID列表 (scope=selected时使用)' })
  @IsOptional()
  @IsArray()
  selectedIds?: string[]
}

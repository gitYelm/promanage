import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class SortableQueryDto {
  @ApiPropertyOptional({ description: '排序字段' })
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiPropertyOptional({ description: '排序方向 asc/desc' })
  @IsOptional()
  @IsString()
  sortOrder?: string
}

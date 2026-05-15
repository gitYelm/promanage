import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class BugPageDto {
  /** 页码 */
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  pageNum?: number

  /** 每页条数 */
  @ApiPropertyOptional({ description: '每页条数', example: 20 })
  @IsOptional()
  pageSize?: number
}

export class BugKeywordDto extends BugPageDto {
  /** 关键词 */
  @ApiPropertyOptional({ description: '关键词' })
  @IsOptional()
  @IsString()
  keyword?: string
}

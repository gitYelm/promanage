import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class QueryPostDto {
  @ApiPropertyOptional({ description: '岗位编码', example: 'ceo' })
  @IsOptional()
  @IsString()
  postCode?: string

  @ApiPropertyOptional({ description: '岗位名称', example: '董事长' })
  @IsOptional()
  @IsString()
  postName?: string

  @ApiPropertyOptional({ description: '岗位状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  pageNum?: number

  @ApiPropertyOptional({ description: '每页条数', example: 10 })
  @IsOptional()
  pageSize?: number
}

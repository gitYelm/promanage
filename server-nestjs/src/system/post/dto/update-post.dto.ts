import { IsString, IsOptional, IsInt } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdatePostDto {
  @ApiPropertyOptional({ description: '岗位编码', example: 'ceo' })
  @IsOptional()
  @IsString()
  postCode?: string

  @ApiPropertyOptional({ description: '岗位名称', example: '董事长' })
  @IsOptional()
  @IsString()
  postName?: string

  @ApiPropertyOptional({ description: '显示顺序', example: 1 })
  @IsOptional()
  @IsInt()
  postSort?: number

  @ApiPropertyOptional({ description: '岗位状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '备注', example: '董事长岗位' })
  @IsOptional()
  @IsString()
  remark?: string
}

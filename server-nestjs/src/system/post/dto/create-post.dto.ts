import { IsString, IsInt, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreatePostDto {
  @ApiProperty({ description: '岗位编码', example: 'ceo' })
  @IsString()
  postCode!: string

  @ApiProperty({ description: '岗位名称', example: '董事长' })
  @IsString()
  postName!: string

  @ApiProperty({ description: '显示顺序', example: 1 })
  @IsInt()
  postSort!: number

  @ApiProperty({ description: '岗位状态', example: '0', enum: ['0', '1'] })
  @IsString()
  status!: string

  @ApiPropertyOptional({ description: '备注', example: '董事长岗位' })
  @IsOptional()
  @IsString()
  remark?: string
}

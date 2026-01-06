import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateNoticeDto {
  @ApiPropertyOptional({ description: '公告标题', example: '系统维护通知' })
  @IsOptional()
  @IsString()
  noticeTitle?: string

  @ApiPropertyOptional({ description: '公告类型', example: '1' })
  @IsOptional()
  @IsString()
  noticeType?: string

  @ApiPropertyOptional({ description: '公告内容', example: '<p>内容</p>' })
  @IsOptional()
  @IsString()
  noticeContent?: string

  @ApiPropertyOptional({ description: '公告状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string
}

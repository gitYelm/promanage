import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class QueryNotificationDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum?: number

  @ApiPropertyOptional({ description: '每页数量', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number

  @ApiPropertyOptional({ description: '读取状态：unread=未读 read=已读' })
  @IsOptional()
  @IsIn(['unread', 'read'])
  readStatus?: string

  @ApiPropertyOptional({ description: '通知类型', example: 'bug_created' })
  @IsOptional()
  @IsString()
  notificationType?: string
}

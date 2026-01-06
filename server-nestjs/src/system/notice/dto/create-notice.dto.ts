import { IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateNoticeDto {
  @ApiProperty({ description: '公告标题', example: '系统维护通知' })
  @IsString()
  noticeTitle!: string

  @ApiProperty({
    description: '公告类型（1=通知 2=公告）',
    example: '1',
    enum: ['1', '2'],
  })
  @IsString()
  noticeType!: string

  @ApiProperty({ description: '公告内容', example: '<p>系统将于今晚维护</p>' })
  @IsString()
  noticeContent!: string

  @ApiProperty({
    description: '公告状态',
    example: '0',
    enum: ['0', '1'],
  })
  @IsString()
  status!: string
}

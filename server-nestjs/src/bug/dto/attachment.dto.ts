import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class UploadBugAttachmentDto {
  /** Bug ID，创建 Bug 前上传可为空 */
  @ApiPropertyOptional({ description: 'Bug ID，创建 Bug 前上传可为空' })
  @IsOptional()
  @IsString()
  ticketId?: string

  /** 附件分类 */
  @ApiPropertyOptional({ description: '附件分类 image/annotated_image/log/video/file' })
  @IsOptional()
  @IsString()
  attachmentType?: string

  /** 原图附件ID */
  @ApiPropertyOptional({ description: '原图附件ID' })
  @IsOptional()
  @IsString()
  originalAttachmentId?: string

  /** 标注元数据 JSON */
  @ApiPropertyOptional({ description: '标注元数据 JSON' })
  @IsOptional()
  @IsString()
  annotationData?: string
}

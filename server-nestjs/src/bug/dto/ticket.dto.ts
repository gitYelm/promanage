import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { BugPageDto } from './common.dto'

export class QueryBugTicketDto extends BugPageDto {
  /** 关键词 */
  @ApiPropertyOptional({ description: '关键词' })
  @IsOptional()
  @IsString()
  keyword?: string

  /** 所属项目ID */
  @ApiPropertyOptional({ description: '所属项目ID' })
  @IsOptional()
  @IsString()
  projectId?: string

  /** 所属模块ID */
  @ApiPropertyOptional({ description: '所属模块ID' })
  @IsOptional()
  @IsString()
  moduleId?: string

  /** 当前状态 */
  @ApiPropertyOptional({ description: '当前状态' })
  @IsOptional()
  @IsString()
  status?: string

  /** 严重程度 */
  @ApiPropertyOptional({ description: '严重程度' })
  @IsOptional()
  @IsString()
  severity?: string

  /** 优先级 */
  @ApiPropertyOptional({ description: '优先级' })
  @IsOptional()
  @IsString()
  priority?: string

  /** 负责人ID */
  @ApiPropertyOptional({ description: '负责人ID' })
  @IsOptional()
  @IsString()
  assigneeId?: string

  /** 提交人ID */
  @ApiPropertyOptional({ description: '提交人ID' })
  @IsOptional()
  @IsString()
  submitterId?: string

  /** 关联需求ID */
  @ApiPropertyOptional({ description: '关联需求ID' })
  @IsOptional()
  @IsString()
  requirementId?: string

  /** 关联迭代ID */
  @ApiPropertyOptional({ description: '关联迭代ID' })
  @IsOptional()
  @IsString()
  iterationId?: string

  /** 关联里程碑ID */
  @ApiPropertyOptional({ description: '关联里程碑ID' })
  @IsOptional()
  @IsString()
  milestoneId?: string

  /** 开始时间 */
  @ApiPropertyOptional({ description: '创建开始时间，ISO 8601' })
  @IsOptional()
  @IsString()
  beginTime?: string

  /** 结束时间 */
  @ApiPropertyOptional({ description: '创建结束时间，ISO 8601' })
  @IsOptional()
  @IsString()
  endTime?: string

  /** 仅查看我的相关 Bug */
  @ApiPropertyOptional({ description: '仅查看我的相关 Bug' })
  @IsOptional()
  @IsString()
  mine?: string

  /** 仅待处理 Bug */
  @ApiPropertyOptional({ description: '仅待处理 Bug' })
  @IsOptional()
  @IsString()
  pending?: string
}

export class CreateBugTicketDto {
  /** 标题 */
  @ApiProperty({ description: '标题' })
  @IsNotEmpty()
  @IsString()
  title!: string

  /** 所属项目ID */
  @ApiPropertyOptional({ description: '所属项目ID；为空时自动使用当前用户可见的第一个启用项目' })
  @IsOptional()
  @IsString()
  projectId?: string

  /** 所属模块ID */
  @ApiPropertyOptional({ description: '所属模块ID' })
  @IsOptional()
  @IsString()
  moduleId?: string

  /** 发现版本ID */
  @ApiPropertyOptional({ description: '发现版本ID' })
  @IsOptional()
  @IsString()
  versionId?: string

  /** 问题类型 */
  @ApiProperty({ description: '问题类型' })
  @IsString()
  type!: string

  /** 严重程度 */
  @ApiProperty({ description: '严重程度' })
  @IsString()
  severity!: string

  /** 优先级 */
  @ApiProperty({ description: '优先级' })
  @IsString()
  priority!: string

  /** 问题描述 */
  @ApiPropertyOptional({ description: '问题描述' })
  @IsOptional()
  @IsString()
  description?: string

  /** 复现步骤 */
  @ApiPropertyOptional({ description: '复现步骤' })
  @IsOptional()
  @IsString()
  reproduceSteps?: string

  /** 期望结果 */
  @ApiPropertyOptional({ description: '期望结果' })
  @IsOptional()
  @IsString()
  expectedResult?: string

  /** 实际结果 */
  @ApiPropertyOptional({ description: '实际结果' })
  @IsOptional()
  @IsString()
  actualResult?: string

  /** 运行环境 */
  @ApiPropertyOptional({ description: '运行环境' })
  @IsOptional()
  @IsString()
  environment?: string

  /** 设备信息 */
  @ApiPropertyOptional({ description: '设备信息' })
  @IsOptional()
  @IsString()
  deviceInfo?: string


  /** 关联需求ID */
  @ApiPropertyOptional({ description: '关联需求ID' })
  @IsOptional()
  @IsString()
  requirementId?: string

  /** 关联迭代ID */
  @ApiPropertyOptional({ description: '关联迭代ID' })
  @IsOptional()
  @IsString()
  iterationId?: string

  /** 关联里程碑ID */
  @ApiPropertyOptional({ description: '关联里程碑ID' })
  @IsOptional()
  @IsString()
  milestoneId?: string

  /** 附件ID列表 */
  @ApiPropertyOptional({ description: '附件ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  attachmentIds?: string[]
}

export class UpdateBugTicketDto extends PartialType(CreateBugTicketDto) {}

export class BugActionDto {
  /** 操作说明 */
  @ApiPropertyOptional({ description: '操作说明' })
  @IsOptional()
  @IsString()
  remark?: string

  /** 负责人ID */
  @ApiPropertyOptional({ description: '负责人ID' })
  @IsOptional()
  @IsString()
  assigneeId?: string

  /** 预计完成时间 */
  @ApiPropertyOptional({ description: '预计完成时间' })
  @IsOptional()
  @IsString()
  dueTime?: string

  /** 重复关联 Bug ID */
  @ApiPropertyOptional({ description: '重复关联 Bug ID' })
  @IsOptional()
  @IsString()
  duplicateOfId?: string
}

export class CreateBugCommentDto {
  /** 评论内容 */
  @ApiProperty({ description: '评论内容' })
  @IsString()
  content!: string


  /** 附件ID列表 */
  @ApiPropertyOptional({ description: '附件ID列表', type: [String] })
  @IsOptional()
  @IsArray()
  attachmentIds?: string[]
}

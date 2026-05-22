import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { BugPageDto } from './common.dto'

export class QueryRequirementDto extends BugPageDto {
  @ApiPropertyOptional({ description: '关键词' }) @IsOptional() @IsString() keyword?: string
  @ApiPropertyOptional({ description: '需求编号' }) @IsOptional() @IsString() requirementNo?: string
  @ApiPropertyOptional({ description: '需求标题' }) @IsOptional() @IsString() title?: string
  @ApiPropertyOptional({ description: '项目ID' }) @IsOptional() @IsString() projectId?: string
  @ApiPropertyOptional({ description: '模块ID' }) @IsOptional() @IsString() moduleId?: string
  @ApiPropertyOptional({ description: '需求类型' }) @IsOptional() @IsString() type?: string
  @ApiPropertyOptional({ description: '需求来源' }) @IsOptional() @IsString() source?: string
  @ApiPropertyOptional({ description: '状态' }) @IsOptional() @IsString() status?: string
  @ApiPropertyOptional({ description: '优先级' }) @IsOptional() @IsString() priority?: string
  @ApiPropertyOptional({ description: '负责人ID' }) @IsOptional() @IsString() ownerId?: string
  @ApiPropertyOptional({ description: '开发负责人ID' })
  @IsOptional()
  @IsString()
  developerId?: string
  @ApiPropertyOptional({ description: '测试负责人ID' }) @IsOptional() @IsString() testerId?: string
  @ApiPropertyOptional({ description: '迭代ID' }) @IsOptional() @IsString() iterationId?: string
  @ApiPropertyOptional({ description: '里程碑ID' }) @IsOptional() @IsString() milestoneId?: string
  @ApiPropertyOptional({ description: '目标版本ID' }) @IsOptional() @IsString() versionId?: string
  @ApiPropertyOptional({ description: '业务价值分最小值' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  valueScoreMin?: number
  @ApiPropertyOptional({ description: '业务价值分最大值' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  valueScoreMax?: number
  @ApiPropertyOptional({ description: '实现难度分最小值' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  difficultyScoreMin?: number
  @ApiPropertyOptional({ description: '实现难度分最大值' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  difficultyScoreMax?: number
  @ApiPropertyOptional({ description: '计划开始时间起' })
  @IsOptional()
  @IsString()
  plannedStartTimeStart?: string
  @ApiPropertyOptional({ description: '计划开始时间止' })
  @IsOptional()
  @IsString()
  plannedStartTimeEnd?: string
  @ApiPropertyOptional({ description: '计划完成时间起' })
  @IsOptional()
  @IsString()
  plannedEndTimeStart?: string
  @ApiPropertyOptional({ description: '计划完成时间止' })
  @IsOptional()
  @IsString()
  plannedEndTimeEnd?: string
  @ApiPropertyOptional({ description: '创建时间起' })
  @IsOptional()
  @IsString()
  createTimeStart?: string
  @ApiPropertyOptional({ description: '创建时间止' })
  @IsOptional()
  @IsString()
  createTimeEnd?: string
  @ApiPropertyOptional({ description: '排序字段' }) @IsOptional() @IsString() sortBy?: string
  @ApiPropertyOptional({ description: '排序方向 asc/desc' })
  @IsOptional()
  @IsString()
  sortOrder?: string
}

export class CreateRequirementDto {
  @ApiProperty({ description: '需求标题' }) @IsString() title!: string
  @ApiProperty({ description: '项目ID' }) @IsString() projectId!: string
  @ApiPropertyOptional({ description: '模块ID' }) @IsOptional() @IsString() moduleId?: string
  @ApiPropertyOptional({ description: '需求类型' }) @IsOptional() @IsString() type?: string
  @ApiPropertyOptional({ description: '需求来源' }) @IsOptional() @IsString() source?: string
  @ApiPropertyOptional({ description: '优先级' }) @IsOptional() @IsString() priority?: string
  @ApiPropertyOptional({ description: '业务价值分' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  valueScore?: number
  @ApiPropertyOptional({ description: '实现难度分' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  difficultyScore?: number
  @ApiPropertyOptional({ description: '需求负责人ID' }) @IsOptional() @IsString() ownerId?: string
  @ApiPropertyOptional({ description: '开发负责人ID' })
  @IsOptional()
  @IsString()
  developerId?: string
  @ApiPropertyOptional({ description: '测试负责人ID' }) @IsOptional() @IsString() testerId?: string
  @ApiPropertyOptional({ description: '迭代ID' }) @IsOptional() @IsString() iterationId?: string
  @ApiPropertyOptional({ description: '里程碑ID' }) @IsOptional() @IsString() milestoneId?: string
  @ApiPropertyOptional({ description: '目标版本ID' }) @IsOptional() @IsString() versionId?: string
  @ApiPropertyOptional({ description: '计划开始时间' })
  @IsOptional()
  @IsString()
  plannedStartTime?: string
  @ApiPropertyOptional({ description: '计划完成时间' })
  @IsOptional()
  @IsString()
  plannedEndTime?: string
  @ApiPropertyOptional({ description: '需求描述' }) @IsOptional() @IsString() description?: string
  @ApiPropertyOptional({ description: '验收标准' })
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string
  @ApiPropertyOptional({ description: '备注' }) @IsOptional() @IsString() remark?: string
}

export class UpdateRequirementDto extends PartialType(CreateRequirementDto) {}

export class BatchAssignRequirementsDto {
  @ApiProperty({ description: '需求ID列表', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[]
  @ApiPropertyOptional({ description: '需求负责人ID，传 null 表示清空，不传表示不修改' })
  @IsOptional()
  @IsString()
  ownerId?: string | null
  @ApiPropertyOptional({ description: '开发负责人ID，传 null 表示清空，不传表示不修改' })
  @IsOptional()
  @IsString()
  developerId?: string | null
  @ApiPropertyOptional({ description: '测试负责人ID，传 null 表示清空，不传表示不修改' })
  @IsOptional()
  @IsString()
  testerId?: string | null
}

export class RequirementActionDto {
  @ApiPropertyOptional({ description: '操作说明' }) @IsOptional() @IsString() remark?: string
}

export class QueryIterationDto extends BugPageDto {
  @ApiPropertyOptional({ description: '关键词' }) @IsOptional() @IsString() keyword?: string
  @ApiPropertyOptional({ description: '项目ID' }) @IsOptional() @IsString() projectId?: string
  @ApiPropertyOptional({ description: '状态' }) @IsOptional() @IsString() status?: string
  @ApiPropertyOptional({ description: '负责人ID' }) @IsOptional() @IsString() ownerId?: string
  @ApiPropertyOptional({ description: '开始日期起' })
  @IsOptional()
  @IsString()
  startDateStart?: string
  @ApiPropertyOptional({ description: '开始日期止' })
  @IsOptional()
  @IsString()
  startDateEnd?: string
  @ApiPropertyOptional({ description: '结束日期起' })
  @IsOptional()
  @IsString()
  endDateStart?: string
  @ApiPropertyOptional({ description: '结束日期止' }) @IsOptional() @IsString() endDateEnd?: string
  @ApiPropertyOptional({ description: '排序字段' }) @IsOptional() @IsString() sortBy?: string
  @ApiPropertyOptional({ description: '排序方向 asc/desc' })
  @IsOptional()
  @IsString()
  sortOrder?: string
}

export class CreateIterationDto {
  @ApiProperty({ description: '项目ID' }) @IsString() projectId!: string
  @ApiProperty({ description: '迭代名称' }) @IsString() iterationName!: string
  @ApiPropertyOptional({ description: '迭代目标' }) @IsOptional() @IsString() goal?: string
  @ApiPropertyOptional({ description: '状态' }) @IsOptional() @IsString() status?: string
  @ApiPropertyOptional({ description: '负责人ID' }) @IsOptional() @IsString() ownerId?: string
  @ApiPropertyOptional({ description: '开始日期' }) @IsOptional() @IsString() startDate?: string
  @ApiPropertyOptional({ description: '结束日期' }) @IsOptional() @IsString() endDate?: string
  @ApiPropertyOptional({ description: '范围说明' }) @IsOptional() @IsString() summary?: string
  @ApiPropertyOptional({ description: '风险说明' }) @IsOptional() @IsString() riskNote?: string
}

export class UpdateIterationDto extends PartialType(CreateIterationDto) {}

export class QueryMilestoneDto extends BugPageDto {
  @ApiPropertyOptional({ description: '关键词' }) @IsOptional() @IsString() keyword?: string
  @ApiPropertyOptional({ description: '项目ID' }) @IsOptional() @IsString() projectId?: string
  @ApiPropertyOptional({ description: '状态' }) @IsOptional() @IsString() status?: string
  @ApiPropertyOptional({ description: '项目阶段' }) @IsOptional() @IsString() stage?: string
  @ApiPropertyOptional({ description: '负责人ID' }) @IsOptional() @IsString() ownerId?: string
  @ApiPropertyOptional({ description: '目标日期起' })
  @IsOptional()
  @IsString()
  targetDateStart?: string
  @ApiPropertyOptional({ description: '目标日期止' })
  @IsOptional()
  @IsString()
  targetDateEnd?: string
  @ApiPropertyOptional({ description: '排序字段' }) @IsOptional() @IsString() sortBy?: string
  @ApiPropertyOptional({ description: '排序方向 asc/desc' })
  @IsOptional()
  @IsString()
  sortOrder?: string
}

export class CreateMilestoneDto {
  @ApiProperty({ description: '项目ID' }) @IsString() projectId!: string
  @ApiProperty({ description: '里程碑名称' }) @IsString() milestoneName!: string
  @ApiProperty({ description: '对应项目阶段' }) @IsString() stage!: string
  @ApiPropertyOptional({ description: '状态' }) @IsOptional() @IsString() status?: string
  @ApiPropertyOptional({ description: '负责人ID' }) @IsOptional() @IsString() ownerId?: string
  @ApiPropertyOptional({ description: '目标日期' }) @IsOptional() @IsString() targetDate?: string
  @ApiPropertyOptional({ description: '完成条件' })
  @IsOptional()
  @IsString()
  completionCriteria?: string
  @ApiPropertyOptional({ description: '备注' }) @IsOptional() @IsString() remark?: string
}

export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {}

export class PmStatusActionDto {
  @ApiPropertyOptional({ description: '操作说明' }) @IsOptional() @IsString() remark?: string
}

export class UpdateProjectProgressDto {
  @ApiPropertyOptional({ description: '项目阶段' }) @IsOptional() @IsString() projectStage?: string
  @ApiPropertyOptional({ description: '计划开始时间' })
  @IsOptional()
  @IsString()
  plannedStartTime?: string
  @ApiPropertyOptional({ description: '计划完成时间' })
  @IsOptional()
  @IsString()
  plannedEndTime?: string
  @ApiPropertyOptional({ description: '实际开始时间' })
  @IsOptional()
  @IsString()
  actualStartTime?: string
  @ApiPropertyOptional({ description: '实际完成时间' })
  @IsOptional()
  @IsString()
  actualEndTime?: string
  @ApiPropertyOptional({ description: '项目进度 0-100' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number
  @ApiPropertyOptional({ description: '风险等级' }) @IsOptional() @IsString() riskLevel?: string
  @ApiPropertyOptional({ description: '风险说明' }) @IsOptional() @IsString() riskNote?: string
  @ApiPropertyOptional({ description: '操作说明' }) @IsOptional() @IsString() remark?: string
}

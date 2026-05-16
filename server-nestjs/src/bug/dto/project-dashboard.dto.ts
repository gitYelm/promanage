import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { BugPageDto } from './common.dto'

export class ProjectDashboardQueryDto extends BugPageDto {
  @ApiPropertyOptional({ description: '项目ID' }) @IsOptional() @IsString() projectId?: string
  @ApiPropertyOptional({ description: '项目阶段' }) @IsOptional() @IsString() projectStage?: string
  @ApiPropertyOptional({ description: '项目负责人ID' }) @IsOptional() @IsString() ownerId?: string
  @ApiPropertyOptional({ description: '风险等级' }) @IsOptional() @IsString() riskLevel?: string
  @ApiPropertyOptional({ description: '开始时间' }) @IsOptional() @IsString() beginTime?: string
  @ApiPropertyOptional({ description: '结束时间' }) @IsOptional() @IsString() endTime?: string
}

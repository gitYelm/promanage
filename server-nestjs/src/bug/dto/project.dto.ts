import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsOptional, IsString, IsInt } from 'class-validator'
import { Type } from 'class-transformer'
import { BugKeywordDto } from './common.dto'

export class QueryBugProjectDto extends BugKeywordDto {
  /** 项目状态 */
  @ApiPropertyOptional({ description: '状态（0正常 1停用）' })
  @IsOptional()
  @IsString()
  status?: string
}

export class CreateBugProjectDto {
  /** 项目名称 */
  @ApiProperty({ description: '项目名称', example: '后台管理系统' })
  @IsString()
  projectName!: string

  /** 项目标识 */
  @ApiProperty({ description: '项目标识', example: 'ADMIN' })
  @IsString()
  projectKey!: string

  /** 项目负责人ID */
  @ApiPropertyOptional({ description: '项目负责人ID' })
  @IsOptional()
  @IsString()
  ownerId?: string

  /** 项目描述 */
  @ApiPropertyOptional({ description: '项目描述' })
  @IsOptional()
  @IsString()
  description?: string

  /** 状态 */
  @ApiPropertyOptional({ description: '状态（0正常 1停用）', default: '0' })
  @IsOptional()
  @IsString()
  status?: string
}

export class UpdateBugProjectDto extends PartialType(CreateBugProjectDto) {}

export class QueryBugModuleDto extends BugKeywordDto {
  /** 所属项目ID */
  @ApiPropertyOptional({ description: '所属项目ID' })
  @IsOptional()
  @IsString()
  projectId?: string
}

export class CreateBugModuleDto {
  /** 所属项目ID */
  @ApiProperty({ description: '所属项目ID' })
  @IsString()
  projectId!: string

  /** 模块名称 */
  @ApiProperty({ description: '模块名称' })
  @IsString()
  moduleName!: string

  /** 默认负责人ID */
  @ApiPropertyOptional({ description: '默认负责人ID' })
  @IsOptional()
  @IsString()
  defaultAssigneeId?: string

  /** 排序 */
  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orderNum?: number

  /** 状态 */
  @ApiPropertyOptional({ description: '状态（0正常 1停用）' })
  @IsOptional()
  @IsString()
  status?: string
}

export class UpdateBugModuleDto extends PartialType(CreateBugModuleDto) {}

export class QueryBugVersionDto extends BugKeywordDto {
  /** 所属项目ID */
  @ApiPropertyOptional({ description: '所属项目ID' })
  @IsOptional()
  @IsString()
  projectId?: string
}

export class CreateBugVersionDto {
  /** 所属项目ID */
  @ApiProperty({ description: '所属项目ID' })
  @IsString()
  projectId!: string

  /** 版本号 */
  @ApiProperty({ description: '版本号', example: 'v1.0.0' })
  @IsString()
  versionNo!: string

  /** 版本名称 */
  @ApiPropertyOptional({ description: '版本名称' })
  @IsOptional()
  @IsString()
  versionName?: string

  /** 版本状态 */
  @ApiPropertyOptional({ description: '版本状态' })
  @IsOptional()
  @IsString()
  status?: string
}

export class UpdateBugVersionDto extends PartialType(CreateBugVersionDto) {}

export class UpsertBugMemberDto {
  /** 用户ID */
  @ApiProperty({ description: '用户ID' })
  @IsString()
  userId!: string

  /** 项目内角色 */
  @ApiProperty({ description: '项目内角色', enum: ['owner', 'product', 'developer', 'tester', 'viewer'] })
  @IsString()
  @IsIn(['owner', 'product', 'developer', 'tester', 'viewer'])
  memberRole!: string

  /** 是否默认负责人 */
  @ApiPropertyOptional({ description: '是否默认负责人' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  /** 状态 */
  @ApiPropertyOptional({ description: '状态（0正常 1停用）' })
  @IsOptional()
  @IsIn(['0', '1'])
  status?: string
}

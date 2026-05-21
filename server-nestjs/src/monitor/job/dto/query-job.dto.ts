import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { SortableQueryDto } from '../../../common/dto/sortable-query.dto'

export class QueryJobDto extends SortableQueryDto {
  @ApiPropertyOptional({ description: '任务名称', example: '系统默认' })
  @IsOptional()
  @IsString()
  jobName?: string

  @ApiPropertyOptional({ description: '任务组名', example: 'DEFAULT' })
  @IsOptional()
  @IsString()
  jobGroup?: string

  @ApiPropertyOptional({ description: '状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '调用目标字符串', example: 'task.clean' })
  @IsOptional()
  @IsString()
  invokeTarget?: string

  @ApiPropertyOptional({ description: 'Cron 执行表达式', example: '0 0 * * * ?' })
  @IsOptional()
  @IsString()
  cronExpression?: string

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  pageNum?: number

  @ApiPropertyOptional({ description: '每页条数', example: 10 })
  @IsOptional()
  pageSize?: number
}

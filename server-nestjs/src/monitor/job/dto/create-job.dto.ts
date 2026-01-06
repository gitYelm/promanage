import { IsString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateJobDto {
  @ApiProperty({ description: '任务名称', example: '系统默认（无参）' })
  @IsString()
  jobName!: string

  @ApiProperty({ description: '任务组名', example: 'DEFAULT' })
  @IsString()
  jobGroup!: string

  @ApiProperty({ description: '调用目标字符串', example: 'ryTask.ryNoParams' })
  @IsString()
  invokeTarget!: string

  @ApiProperty({ description: 'cron执行表达式', example: '0/10 * * * * ?' })
  @IsString()
  cronExpression!: string

  @ApiProperty({
    description: '计划执行错误策略',
    example: '1',
    enum: ['1', '2', '3'],
  })
  @IsString()
  misfirePolicy!: string

  @ApiProperty({
    description: '是否并发执行',
    example: '1',
    enum: ['0', '1'],
  })
  @IsString()
  concurrent!: string

  @ApiProperty({ description: '状态', example: '0', enum: ['0', '1'] })
  @IsString()
  status!: string

  @ApiPropertyOptional({ description: '备注', example: '定时任务备注' })
  @IsOptional()
  @IsString()
  remark?: string
}

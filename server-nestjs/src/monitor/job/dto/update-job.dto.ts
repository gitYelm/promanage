import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateJobDto {
  @ApiPropertyOptional({ description: '任务名称', example: '系统默认（无参）' })
  @IsOptional()
  @IsString()
  jobName?: string;

  @ApiPropertyOptional({ description: '任务组名', example: 'DEFAULT' })
  @IsOptional()
  @IsString()
  jobGroup?: string;

  @ApiPropertyOptional({
    description: '调用目标字符串',
    example: 'ryTask.ryNoParams',
  })
  @IsOptional()
  @IsString()
  invokeTarget?: string;

  @ApiPropertyOptional({
    description: 'cron执行表达式',
    example: '0/10 * * * * ?',
  })
  @IsOptional()
  @IsString()
  cronExpression?: string;

  @ApiPropertyOptional({ description: '计划执行错误策略', example: '1' })
  @IsOptional()
  @IsString()
  misfirePolicy?: string;

  @ApiPropertyOptional({ description: '是否并发执行', example: '1' })
  @IsOptional()
  @IsString()
  concurrent?: string;

  @ApiPropertyOptional({ description: '状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '备注', example: '定时任务备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

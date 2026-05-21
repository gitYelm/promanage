import { IsOptional, IsString } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { SortableQueryDto } from '../../../common/dto/sortable-query.dto'

export class QueryUserDto extends SortableQueryDto {
  @ApiPropertyOptional({ description: '用户名', example: 'admin' })
  @IsOptional()
  @IsString()
  userName?: string

  @ApiPropertyOptional({ description: '手机号码', example: '13800138000' })
  @IsOptional()
  @IsString()
  phonenumber?: string

  @ApiPropertyOptional({ description: '用户状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '部门ID', example: '100' })
  @IsOptional()
  @IsString()
  deptId?: string

  @ApiPropertyOptional({ description: '角色ID', example: '2' })
  @IsOptional()
  @IsString()
  roleId?: string

  @ApiPropertyOptional({ description: '创建开始时间', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  beginTime?: string

  @ApiPropertyOptional({ description: '创建结束时间', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endTime?: string

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  pageNum?: number

  @ApiPropertyOptional({ description: '每页条数', example: 10 })
  @IsOptional()
  pageSize?: number
}

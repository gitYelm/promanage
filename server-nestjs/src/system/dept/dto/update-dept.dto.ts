import { IsOptional, IsString, IsNumber, IsEmail, ValidateIf, Matches } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateDeptDto {
  @ApiPropertyOptional({ description: '父部门ID', example: '100' })
  @IsOptional()
  @IsString()
  parentId?: string

  @ApiPropertyOptional({ description: '部门名称', example: '研发部门' })
  @IsOptional()
  @IsString()
  deptName?: string

  @ApiPropertyOptional({ description: '显示排序', example: 1 })
  @IsOptional()
  @IsNumber()
  orderNum?: number

  @ApiPropertyOptional({ description: '负责人', example: '张三' })
  @IsOptional()
  @IsString()
  leader?: string

  @ApiPropertyOptional({ description: '联系电话', example: '13800138000' })
  @ValidateIf((o: UpdateDeptDto) => o.phone !== '' && o.phone !== null && o.phone !== undefined)
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string

  @ApiPropertyOptional({ description: '邮箱', example: 'dept@example.com' })
  @ValidateIf((o: UpdateDeptDto) => o.email !== '' && o.email !== null && o.email !== undefined)
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string

  @ApiPropertyOptional({ description: '部门状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string
}

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEmail,
  ValidateIf,
  Matches,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateDeptDto {
  @ApiPropertyOptional({ description: '父部门ID', example: '100' })
  @IsOptional()
  @IsString()
  parentId?: string

  @ApiProperty({ description: '部门名称', example: '研发部门' })
  @IsNotEmpty({ message: '部门名称不能为空' })
  @IsString()
  deptName: string

  @ApiProperty({ description: '显示排序', example: 1 })
  @IsNotEmpty({ message: '显示排序不能为空' })
  @IsNumber()
  orderNum: number

  @ApiPropertyOptional({ description: '负责人', example: '张三' })
  @IsOptional()
  @IsString()
  leader?: string

  @ApiPropertyOptional({ description: '联系电话', example: '13800138000' })
  @ValidateIf((o: CreateDeptDto) => o.phone !== '' && o.phone !== null && o.phone !== undefined)
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string

  @ApiPropertyOptional({ description: '邮箱', example: 'dept@example.com' })
  @ValidateIf((o: CreateDeptDto) => o.email !== '' && o.email !== null && o.email !== undefined)
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string

  @ApiPropertyOptional({
    description: '部门状态',
    example: '0',
    enum: ['0', '1'],
  })
  @IsOptional()
  @IsString()
  status?: string
}

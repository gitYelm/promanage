import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ExportTaskService, ExportDataProvider } from '../../common/export/export-task.service'
import { ExcelColumn } from '../../common/excel/excel.service'
import { Prisma } from '@prisma/client'

/** 用户导出列配置 */
export const USER_EXPORT_COLUMNS: ExcelColumn[] = [
  { key: 'userId', header: '用户ID', width: 10 },
  { key: 'userName', header: '用户账号', width: 15 },
  { key: 'nickName', header: '用户昵称', width: 15 },
  { key: 'deptName', header: '部门', width: 20 },
  { key: 'phonenumber', header: '手机号码', width: 15 },
  { key: 'email', header: '邮箱', width: 25 },
  { key: 'sex', header: '性别', width: 8 },
  { key: 'status', header: '状态', width: 8 },
  { key: 'createTime', header: '创建时间', width: 20 },
]

@Injectable()
export class UserExportProvider implements ExportDataProvider, OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private exportTaskService: ExportTaskService,
  ) {}

  onModuleInit() {
    // 注册到导出任务服务
    this.exportTaskService.registerProvider('user', this)
  }

  getModuleName(): string {
    return '用户数据'
  }

  getDefaultColumns(): ExcelColumn[] {
    return USER_EXPORT_COLUMNS
  }

  async getTotal(query: Record<string, any>): Promise<number> {
    const where = this.buildWhere(query)
    return this.prisma.sysUser.count({ where })
  }

  async getData(
    query: Record<string, any>,
    skip: number,
    take: number,
  ): Promise<Record<string, any>[]> {
    const where = this.buildWhere(query)

    const users = await this.prisma.sysUser.findMany({
      where,
      skip,
      take,
      include: { dept: true },
      orderBy: { userId: 'asc' },
    })

    return users.map((user) => ({
      userId: user.userId.toString(),
      userName: user.userName,
      nickName: user.nickName,
      deptName: user.dept?.deptName || '',
      phonenumber: user.phonenumber || '',
      email: user.email || '',
      sex: user.sex === '0' ? '男' : user.sex === '1' ? '女' : '未知',
      status: user.status === '0' ? '正常' : '停用',
      createTime: user.createTime ? new Date(user.createTime).toLocaleString('zh-CN') : '',
    }))
  }

  private buildWhere(query: Record<string, any>): Prisma.SysUserWhereInput {
    const where: Prisma.SysUserWhereInput = { delFlag: '0' }

    if (query.userName) {
      where.userName = { contains: query.userName }
    }
    if (query.phonenumber) {
      where.phonenumber = { contains: query.phonenumber }
    }
    // 忽略特殊的 "全部" 值
    if (query.status && query.status !== '__all__') {
      where.status = query.status
    }
    if (query.deptId) {
      where.deptId = BigInt(query.deptId)
    }
    // 选中导出
    if (query.selectedIds?.length) {
      where.userId = { in: query.selectedIds.map((id: string) => BigInt(id)) }
    }

    return where
  }
}

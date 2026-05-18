import { Injectable, OnModuleInit } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { ExcelColumn } from '../../common/excel/excel.service'
import { ExportDataProvider, ExportTaskService } from '../../common/export/export-task.service'
import { PrismaService } from '../../prisma/prisma.service'
import { BugAccessService } from '../bug-access.service'

const BUG_STATISTICS_EXPORT_COLUMNS: ExcelColumn[] = [
  { key: 'ticketNo', header: 'Bug编号', width: 24 },
  { key: 'title', header: '标题', width: 32 },
  { key: 'projectName', header: '项目', width: 20 },
  { key: 'moduleName', header: '模块', width: 18 },
  { key: 'status', header: '状态', width: 14 },
  { key: 'severity', header: '严重程度', width: 12 },
  { key: 'priority', header: '优先级', width: 12 },
  { key: 'submitterName', header: '提交人', width: 16 },
  { key: 'assigneeName', header: '负责人', width: 16 },
  { key: 'createTime', header: '创建时间', width: 20 },
]

@Injectable()
export class BugStatisticsExportProvider implements ExportDataProvider, OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exportTaskService: ExportTaskService,
    private readonly access: BugAccessService,
  ) {}

  onModuleInit() {
    this.exportTaskService.registerProvider('bug-statistics', this)
  }

  getModuleName(): string {
    return 'Bug统计'
  }

  getDefaultColumns(): ExcelColumn[] {
    return BUG_STATISTICS_EXPORT_COLUMNS
  }

  async getTotal(query: Record<string, any>): Promise<number> {
    return this.prisma.bugTicket.count({ where: await this.buildWhere(query) })
  }

  async getData(query: Record<string, any>, skip: number, take: number) {
    const rows = await this.prisma.bugTicket.findMany({
      where: await this.buildWhere(query),
      skip,
      take,
      include: { project: true, module: true, submitter: true, assignee: true },
      orderBy: { ticketId: 'desc' },
    })
    return rows.map((row) => ({
      ticketNo: row.ticketNo,
      title: row.title,
      projectName: row.project.projectName,
      moduleName: row.module?.moduleName || '',
      status: row.status,
      severity: row.severity,
      priority: row.priority,
      submitterName: row.submitter.nickName || row.submitter.userName,
      assigneeName: row.assignee?.nickName || row.assignee?.userName || '',
      createTime: row.createTime ? new Date(row.createTime).toLocaleString('zh-CN') : '',
    }))
  }

  private async buildWhere(query: Record<string, any>): Promise<Prisma.BugTicketWhereInput> {
    const where: Prisma.BugTicketWhereInput = { delFlag: '0' }
    if (query.projectId) where.projectId = BigInt(String(query.projectId))
    if (query.status) where.status = String(query.status)
    if (query.severity) where.severity = String(query.severity)
    if (query.priority) where.priority = String(query.priority)
    const operatorId = typeof query.__operatorId === 'string' ? query.__operatorId : undefined
    if (operatorId) {
      const visibleProjectIds = await this.access.getVisibleProjectIds(operatorId)
      where.AND = [{ projectId: { in: visibleProjectIds } }]
    }
    return where
  }
}

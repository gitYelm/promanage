import { Injectable, OnModuleInit } from '@nestjs/common'
import { ExcelColumn } from '../../common/excel/excel.service'
import { ExportDataProvider, ExportTaskService } from '../../common/export/export-task.service'
import { PrismaService } from '../../prisma/prisma.service'
import { BugAccessService } from '../bug-access.service'
import {
  REQUIREMENT_EXPORT_COLUMNS,
  REQUIREMENT_EXPORT_MODULE,
  REQUIREMENT_PRIORITY_LABELS,
  REQUIREMENT_STATUS_LABELS,
  REQUIREMENT_TYPE_LABELS,
} from './project-requirement-excel.config'
import { buildRequirementExportWhere } from './project-requirement-export-query.util'
import { formatDateTime, optionLabel, userDisplayName } from './project-requirement-label.util'

@Injectable()
export class ProjectRequirementExportProvider implements ExportDataProvider, OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exportTaskService: ExportTaskService,
    private readonly access: BugAccessService,
  ) {}

  onModuleInit() {
    this.exportTaskService.registerProvider(REQUIREMENT_EXPORT_MODULE, this)
  }

  getModuleName(): string {
    return '需求数据'
  }

  getDefaultColumns(): ExcelColumn[] {
    return REQUIREMENT_EXPORT_COLUMNS
  }

  async getTotal(query: Record<string, any>) {
    return this.prisma.projectRequirement.count({ where: await this.buildWhere(query) })
  }

  async getData(query: Record<string, any>, skip: number, take: number) {
    const rows = await this.prisma.projectRequirement.findMany({
      where: await this.buildWhere(query),
      skip,
      take,
      include: {
        project: true,
        module: true,
        owner: true,
        developer: true,
        tester: true,
        iteration: true,
        milestone: true,
        version: true,
      },
      orderBy: { requirementId: 'desc' },
    })
    return rows.map((row) => ({
      requirementNo: row.requirementNo,
      title: row.title,
      projectName: row.project.projectName,
      moduleName: row.module?.moduleName || '',
      type: optionLabel(REQUIREMENT_TYPE_LABELS, row.type),
      source: row.source || '',
      priority: optionLabel(REQUIREMENT_PRIORITY_LABELS, row.priority),
      status: optionLabel(REQUIREMENT_STATUS_LABELS, row.status),
      valueScore: row.valueScore ?? 0,
      difficultyScore: row.difficultyScore ?? 0,
      ownerName: userDisplayName(row.owner),
      developerName: userDisplayName(row.developer),
      testerName: userDisplayName(row.tester),
      iterationName: row.iteration?.iterationName || '',
      milestoneName: row.milestone?.milestoneName || '',
      versionNo: row.version?.versionNo || '',
      plannedStartTime: formatDateTime(row.plannedStartTime),
      plannedEndTime: formatDateTime(row.plannedEndTime),
      description: row.description || '',
      acceptanceCriteria: row.acceptanceCriteria || '',
      remark: row.remark || '',
    }))
  }

  private async buildWhere(query: Record<string, any>) {
    return buildRequirementExportWhere(this.access, query)
  }
}

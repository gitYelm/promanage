import { Injectable } from '@nestjs/common'
import { BusinessException } from '../../common/exceptions/business.exception'
import { LoggerService } from '../../common/logger/logger.service'
import { BUG_MEMBER_ROLE, type BugMemberRole } from '../constants/bug.constants'
import { BugAccessService, type RequestUserLike } from '../bug-access.service'
import { RoleSecurityService } from '../security/role-security.service'
import { CreateRequirementDto } from '../dto/project-management.dto'
import { ProjectRequirementService } from './project-requirement.service'
import {
  REQUIREMENT_PRIORITY_LABELS,
  REQUIREMENT_TYPE_LABELS,
} from './project-requirement-excel.config'
import { optionValue } from './project-requirement-label.util'
import { PrismaService } from '../../prisma/prisma.service'

export interface RequirementImportRow {
  title?: string
  projectName?: string
  moduleName?: string
  type?: string
  source?: string
  priority?: string
  valueScore?: number | string
  difficultyScore?: number | string
  ownerName?: string
  developerName?: string
  testerName?: string
  iterationName?: string
  milestoneName?: string
  versionNo?: string
  plannedStartTime?: string | Date
  plannedEndTime?: string | Date
  description?: string
  acceptanceCriteria?: string
  remark?: string
}

@Injectable()
export class ProjectRequirementImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly access: BugAccessService,
    private readonly roleSecurity: RoleSecurityService,
    private readonly requirements: ProjectRequirementService,
  ) {}

  async importRows(rows: RequirementImportRow[], user: RequestUserLike) {
    this.logger.log(`导入需求: ${rows.length} 条`, 'ProjectRequirementImportService')
    let success = 0
    let fail = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const result = await this.importOne(rows[i], i + 2, user)
      if (result.ok) success++
      else {
        fail++
        errors.push(result.error)
      }
    }
    return { success, fail, errors }
  }

  private async importOne(row: RequirementImportRow, rowNum: number, user: RequestUserLike) {
    try {
      const dto = await this.toCreateDto(row, rowNum, user)
      await this.requirements.create(dto, user)
      return { ok: true, error: '' }
    } catch (error) {
      return { ok: false, error: `第${rowNum}行: ${(error as Error).message}` }
    }
  }

  private async toCreateDto(
    row: RequirementImportRow,
    rowNum: number,
    user: RequestUserLike,
  ): Promise<CreateRequirementDto> {
    if (!row.title?.trim()) throw BusinessException.invalidParams('需求标题不能为空')
    const project = await this.resolveProject(row.projectName, user.userId)
    const projectId = String(project.projectId)
    return {
      title: row.title.trim(),
      projectId,
      moduleId: await this.resolveModuleId(project.projectId, row.moduleName),
      type: optionValue(REQUIREMENT_TYPE_LABELS, row.type, 'feature'),
      source: String(row.source || ''),
      priority: optionValue(REQUIREMENT_PRIORITY_LABELS, row.priority, 'medium'),
      valueScore: this.numberScore(row.valueScore, '业务价值分'),
      difficultyScore: this.numberScore(row.difficultyScore, '实现难度分'),
      ownerId: await this.resolveAssignableUser(
        project.projectId,
        row.ownerName,
        user,
        [BUG_MEMBER_ROLE.OWNER, BUG_MEMBER_ROLE.PRODUCT, BUG_MEMBER_ROLE.REVIEWER],
        '需求负责人',
      ),
      developerId: await this.resolveAssignableUser(
        project.projectId,
        row.developerName,
        user,
        [BUG_MEMBER_ROLE.DEVELOPER],
        '开发负责人',
      ),
      testerId: await this.resolveAssignableUser(
        project.projectId,
        row.testerName,
        user,
        [BUG_MEMBER_ROLE.TESTER],
        '测试负责人',
      ),
      iterationId: await this.resolveIterationId(project.projectId, row.iterationName),
      milestoneId: await this.resolveMilestoneId(project.projectId, row.milestoneName),
      versionId: await this.resolveVersionId(project.projectId, row.versionNo),
      plannedStartTime: this.dateText(row.plannedStartTime),
      plannedEndTime: this.dateText(row.plannedEndTime),
      description: String(row.description || ''),
      acceptanceCriteria: String(row.acceptanceCriteria || ''),
      remark: String(row.remark || ''),
    }
  }

  private async resolveProject(projectName: string | undefined, userId: string) {
    if (!projectName?.trim()) throw BusinessException.invalidParams('所属项目不能为空')
    const visibleProjectIds = await this.access.getVisibleProjectIds(userId)
    const project = await this.prisma.bugProject.findFirst({
      where: {
        projectName: projectName.trim(),
        projectId: { in: visibleProjectIds },
        delFlag: '0',
        status: '0',
      },
      select: { projectId: true },
    })
    if (!project) throw BusinessException.invalidParams(`所属项目"${projectName}"不存在或无权访问`)
    return project
  }

  private async resolveModuleId(projectId: bigint, moduleName?: string) {
    if (!moduleName?.trim()) return undefined
    const module = await this.prisma.bugProjectModule.findFirst({
      where: { projectId, moduleName: moduleName.trim(), delFlag: '0' },
      select: { moduleId: true },
    })
    if (!module) throw BusinessException.invalidParams(`模块"${moduleName}"不属于所选项目`)
    return String(module.moduleId)
  }

  private async resolveAssignableUser(
    projectId: bigint,
    name: string | undefined,
    user: RequestUserLike,
    roles: BugMemberRole[],
    label: string,
  ) {
    if (!name?.trim()) return undefined
    const target = await this.prisma.sysUser.findFirst({
      where: { userName: name.trim(), delFlag: '0', status: '0' },
      select: { userId: true },
    })
    if (!target) throw BusinessException.invalidParams(`${label}"${name}"不存在或已停用`)
    await this.roleSecurity.assertAssignableProjectFieldUser({
      operatorId: user.userId,
      projectId,
      targetUserId: String(target.userId),
      allowedMemberRoles: roles,
      label,
    })
    return String(target.userId)
  }

  private async resolveIterationId(projectId: bigint, name?: string) {
    if (!name?.trim()) return undefined
    const row = await this.prisma.projectIteration.findFirst({
      where: { projectId, iterationName: name.trim(), delFlag: '0' },
      select: { iterationId: true },
    })
    if (!row) throw BusinessException.invalidParams(`迭代"${name}"不属于所选项目`)
    return String(row.iterationId)
  }

  private async resolveMilestoneId(projectId: bigint, name?: string) {
    if (!name?.trim()) return undefined
    const row = await this.prisma.projectMilestone.findFirst({
      where: { projectId, milestoneName: name.trim(), delFlag: '0' },
      select: { milestoneId: true },
    })
    if (!row) throw BusinessException.invalidParams(`里程碑"${name}"不属于所选项目`)
    return String(row.milestoneId)
  }

  private async resolveVersionId(projectId: bigint, versionNo?: string) {
    if (!versionNo?.trim()) return undefined
    const row = await this.prisma.bugProjectVersion.findFirst({
      where: { projectId, versionNo: versionNo.trim(), delFlag: '0' },
      select: { versionId: true },
    })
    if (!row) throw BusinessException.invalidParams(`版本"${versionNo}"不属于所选项目`)
    return String(row.versionId)
  }

  private numberScore(value: unknown, label: string) {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    if (!Number.isInteger(num) || num < 0 || num > 100)
      throw BusinessException.invalidParams(`${label}必须是0-100的整数`)
    return num
  }

  private dateText(value?: string | Date) {
    if (!value) return undefined
    return value instanceof Date ? value.toISOString() : String(value)
  }
}

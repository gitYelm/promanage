import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../../common/logger/logger.service'
import { BusinessException } from '../../common/exceptions/business.exception'
import { ErrorCode } from '../../common/enums/error-code.enum'
import { BugProjectHelperService } from './bug-project-helper.service'
import { BUG_MEMBER_ROLE } from '../constants/bug.constants'
import { BugUserOptionQueryDto } from '../dto/common.dto'
import { RoleSecurityService } from '../security/role-security.service'
import {
  CreateBugModuleDto,
  CreateBugProjectDto,
  CreateBugVersionDto,
  QueryBugModuleDto,
  QueryBugProjectDto,
  QueryBugVersionDto,
  UpdateBugModuleDto,
  UpdateBugProjectDto,
  UpdateBugVersionDto,
  UpsertBugMemberDto,
} from '../dto/project.dto'
import { buildModuleOrderBy, buildProjectOrderBy, buildVersionOrderBy } from './bug-project-order.util'

type RequestUserLike = { userId: string; username: string }

@Injectable()
export class BugProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly helper: BugProjectHelperService,
    private readonly roleSecurity: RoleSecurityService,
  ) {}

  async listProjects(query: QueryBugProjectDto, userId?: string) {
    const where: Prisma.BugProjectWhereInput = { delFlag: '0' }
    if (userId) where.projectId = { in: await this.helper.visibleProjectIds(userId) }
    if (query.keyword) {
      where.OR = [
        { projectName: { contains: query.keyword } },
        { projectKey: { contains: query.keyword } },
      ]
    }
    if (query.status) where.status = query.status
    return this.paginateProjects(where, query)
  }

  async userOptions(query: BugUserOptionQueryDto = {}, operatorId?: string) {
    if (query.projectId) await this.helper.ensureProject(query.projectId)
    return this.roleSecurity.assignableUserOptions(operatorId, query)
  }

  async optionsForUser(userId: string) {
    const projectIds = await this.helper.visibleProjectIds(userId)
    return this.prisma.bugProject.findMany({
      where: { projectId: { in: projectIds }, delFlag: '0', status: '0' },
      orderBy: { projectId: 'asc' },
      include: { owner: true },
    })
  }

  async createProject(dto: CreateBugProjectDto, user: RequestUserLike) {
    const existed = await this.prisma.bugProject.findFirst({
      where: { projectKey: dto.projectKey, delFlag: '0' },
    })
    if (existed) throw new BusinessException(ErrorCode.BUG_PROJECT_EXISTS, '项目标识已存在')
    if (!(await this.roleSecurity.isAdmin(user.userId)) && dto.ownerId && dto.ownerId !== user.userId) {
      throw BusinessException.forbidden('项目负责人只能创建自己负责的项目')
    }
    const ownerId = dto.ownerId ? BigInt(dto.ownerId) : BigInt(user.userId)
    await this.roleSecurity.assertTargetHasRole(user.userId, ownerId, ['bug_project_owner', 'project_owner'], '项目负责人', {
      allowAdminBypassRole: true,
    })
    this.logger.log(`创建 Bug 项目: ${dto.projectName}`, 'BugProjectService')
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.bugProject.create({
        data: {
          projectName: dto.projectName,
          projectKey: dto.projectKey.toUpperCase(),
          ownerId,
          description: dto.description ?? '',
          projectStage: dto.projectStage ?? 'requirement',
          plannedStartTime: dto.plannedStartTime ? new Date(dto.plannedStartTime) : undefined,
          plannedEndTime: dto.plannedEndTime ? new Date(dto.plannedEndTime) : undefined,
          actualStartTime: dto.actualStartTime ? new Date(dto.actualStartTime) : undefined,
          actualEndTime: dto.actualEndTime ? new Date(dto.actualEndTime) : undefined,
          progress: dto.progress ?? 0,
          riskLevel: dto.riskLevel ?? 'low',
          riskNote: dto.riskNote ?? '',
          status: dto.status ?? '0',
        },
      })
      await tx.bugProjectMember.create({
        data: { projectId: project.projectId, userId: ownerId, memberRole: BUG_MEMBER_ROLE.OWNER, isDefault: true, status: '0' },
      })
      return project
    })
  }

  async updateProject(projectId: string, dto: UpdateBugProjectDto, operatorId?: string) {
    const project = await this.helper.ensureProject(projectId)
    if (operatorId) await this.assertProjectManageAllowed(operatorId, project.projectId)
    if (operatorId && dto.ownerId !== undefined && dto.ownerId !== String(project.ownerId ?? '')) {
      if (!(await this.roleSecurity.isAdmin(operatorId))) throw BusinessException.forbidden('项目负责人不允许直接变更项目负责人，请联系管理员执行负责人交接')
      if (dto.ownerId) {
        await this.roleSecurity.assertTargetHasRole(operatorId, dto.ownerId, ['bug_project_owner', 'project_owner'], '项目负责人', {
          allowAdminBypassRole: true,
        })
      }
    }
    return this.prisma.bugProject.update({
      where: { projectId: BigInt(projectId) },
      data: this.projectUpdateData(dto),
    })
  }

  async removeProject(ids: string[]) {
    await this.prisma.bugProject.updateMany({
      where: { projectId: { in: ids.map((id) => BigInt(id)) } },
      data: { delFlag: '2' },
    })
    return {}
  }

  async listModules(query: QueryBugModuleDto, userId?: string) {
    const where: Prisma.BugProjectModuleWhereInput = { delFlag: '0' }
    const scopedProjectId = await this.scopedProjectIdFilter(query.projectId, userId)
    if (scopedProjectId) where.projectId = scopedProjectId
    if (query.keyword) where.moduleName = { contains: query.keyword }
    if (query.status) where.status = query.status
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.bugProjectModule.count({ where }),
      this.prisma.bugProjectModule.findMany({
        where,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: { project: true, defaultAssignee: true },
        orderBy: buildModuleOrderBy(query),
      }),
    ])
    return { total, rows }
  }

  private async scopedProjectIdFilter(queryProjectId: string | undefined, userId?: string) {
    if (!userId) return queryProjectId ? { equals: BigInt(queryProjectId) } : undefined
    const visibleProjectIds = await this.helper.visibleProjectIds(userId)
    if (queryProjectId) {
      const projectId = BigInt(queryProjectId)
      return visibleProjectIds.some((id) => id === projectId) ? { equals: projectId } : { in: [] }
    }
    return { in: visibleProjectIds }
  }

  async createModule(dto: CreateBugModuleDto, operatorId?: string) {
    await this.helper.ensureProject(dto.projectId)
    if (operatorId) {
      await this.assertProjectManageAllowed(operatorId, BigInt(dto.projectId))
      await this.assertModuleAssigneeAllowed(operatorId, dto.projectId, dto.defaultAssigneeId)
    }
    await this.helper.assertUniqueModule(dto.projectId, dto.moduleName)
    return this.prisma.bugProjectModule.create({ data: this.moduleCreateData(dto) })
  }

  async updateModule(moduleId: string, dto: UpdateBugModuleDto, operatorId?: string) {
    const module = await this.helper.ensureModule(moduleId)
    const projectId = dto.projectId ?? String(module.projectId)
    if (dto.projectId) await this.helper.ensureProject(dto.projectId)
    if (operatorId) {
      await this.assertProjectManageAllowed(operatorId, module.projectId)
      if (dto.projectId && dto.projectId !== String(module.projectId)) await this.assertProjectManageAllowed(operatorId, BigInt(dto.projectId))
      if (dto.defaultAssigneeId !== undefined) await this.assertModuleAssigneeAllowed(operatorId, projectId, dto.defaultAssigneeId)
    }
    if (dto.moduleName) {
      await this.helper.assertUniqueModule(
        dto.projectId ?? String(module.projectId),
        dto.moduleName,
        moduleId,
      )
    }
    return this.prisma.bugProjectModule.update({
      where: { moduleId: BigInt(moduleId) },
      data: this.moduleUpdateData(dto),
    })
  }

  async removeModule(ids: string[]) {
    await this.prisma.bugProjectModule.updateMany({
      where: { moduleId: { in: ids.map((id) => BigInt(id)) } },
      data: { delFlag: '2' },
    })
    return {}
  }

  async listVersions(query: QueryBugVersionDto, userId?: string) {
    const where: Prisma.BugProjectVersionWhereInput = { delFlag: '0' }
    const scopedProjectId = await this.scopedProjectIdFilter(query.projectId, userId)
    if (scopedProjectId) where.projectId = scopedProjectId
    if (query.keyword) {
      where.OR = [
        { versionNo: { contains: query.keyword } },
        { versionName: { contains: query.keyword } },
      ]
    }
    if (query.status) where.status = query.status
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.bugProjectVersion.count({ where }),
      this.prisma.bugProjectVersion.findMany({
        where,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: { project: true },
        orderBy: buildVersionOrderBy(query),
      }),
    ])
    return { total, rows }
  }

  async createVersion(dto: CreateBugVersionDto, operatorId?: string) {
    await this.helper.ensureProject(dto.projectId)
    if (operatorId) await this.assertProjectManageAllowed(operatorId, BigInt(dto.projectId))
    await this.helper.assertUniqueVersion(dto.projectId, dto.versionNo)
    return this.prisma.bugProjectVersion.create({ data: this.versionCreateData(dto) })
  }

  async updateVersion(versionId: string, dto: UpdateBugVersionDto, operatorId?: string) {
    const version = await this.helper.ensureVersion(versionId)
    if (dto.projectId) await this.helper.ensureProject(dto.projectId)
    if (operatorId) {
      await this.assertProjectManageAllowed(operatorId, version.projectId)
      if (dto.projectId && dto.projectId !== String(version.projectId)) await this.assertProjectManageAllowed(operatorId, BigInt(dto.projectId))
    }
    if (dto.versionNo) {
      await this.helper.assertUniqueVersion(
        dto.projectId ?? String(version.projectId),
        dto.versionNo,
        versionId,
      )
    }
    return this.prisma.bugProjectVersion.update({
      where: { versionId: BigInt(versionId) },
      data: this.versionUpdateData(dto),
    })
  }

  async removeVersion(ids: string[]) {
    await this.prisma.bugProjectVersion.updateMany({
      where: { versionId: { in: ids.map((id) => BigInt(id)) } },
      data: { delFlag: '2' },
    })
    return {}
  }

  async listMembers(projectId: string, operatorId: string) {
    await this.helper.ensureProject(projectId)
    await this.assertProjectManageAllowed(operatorId, BigInt(projectId))
    return this.prisma.bugProjectMember.findMany({
      where: { projectId: BigInt(projectId) },
      include: { user: true },
      orderBy: { memberId: 'asc' },
    })
  }

  async upsertMember(projectId: string, dto: UpsertBugMemberDto, operatorId: string) {
    const project = await this.helper.ensureProject(projectId)
    await this.assertProjectManageAllowed(operatorId, project.projectId)
    await this.helper.ensureUser(dto.userId)
    await this.assertMemberChangeAllowed(operatorId, project, BigInt(dto.userId), dto.status)
    await this.roleSecurity.assertAssignableProjectMember(operatorId, dto.userId, dto.memberRole)
    if (dto.memberRole === BUG_MEMBER_ROLE.DEVELOPER) await this.assertReviewerExists(projectId)
    return this.prisma.bugProjectMember.upsert({
      where: {
        projectId_userId_memberRole: {
          projectId: BigInt(projectId),
          userId: BigInt(dto.userId),
          memberRole: dto.memberRole,
        },
      },
      update: { isDefault: dto.isDefault ?? false, status: dto.status ?? '0' },
      create: {
        projectId: BigInt(projectId),
        userId: BigInt(dto.userId),
        memberRole: dto.memberRole,
        isDefault: dto.isDefault ?? false,
        status: dto.status ?? '0',
      },
    })
  }

  async removeMember(memberId: string, operatorId: string) {
    const member = await this.prisma.bugProjectMember.findUnique({
      where: { memberId: BigInt(memberId) },
      include: { project: true },
    })
    if (!member) throw BusinessException.notFound('项目成员不存在')
    await this.assertProjectManageAllowed(operatorId, member.projectId)
    await this.assertMemberChangeAllowed(operatorId, member.project, member.userId, '1')
    await this.prisma.bugProjectMember.delete({ where: { memberId: BigInt(memberId) } })
    return {}
  }

  private async assertProjectManageAllowed(userId: string, projectId: bigint) {
    if (await this.roleSecurity.isAdmin(userId)) return
    const [ownedProject, ownerMember] = await Promise.all([
      this.prisma.bugProject.findFirst({
        where: { projectId, ownerId: BigInt(userId), delFlag: '0', status: '0' },
        select: { projectId: true },
      }),
      this.prisma.bugProjectMember.findFirst({
        where: { projectId, userId: BigInt(userId), memberRole: BUG_MEMBER_ROLE.OWNER, status: '0' },
        select: { memberId: true },
      }),
    ])
    if (!ownedProject && !ownerMember) throw BusinessException.forbidden('只有超级管理员或该项目负责人可以维护项目配置')
  }

  private async assertMemberChangeAllowed(
    operatorId: string,
    project: { ownerId: bigint | null },
    targetUserId: bigint,
    targetStatus?: string,
  ) {
    if (await this.roleSecurity.isAdmin(operatorId)) return
    await this.roleSecurity.assertNotHigher(operatorId, targetUserId, '项目负责人不能维护权限高于自己的项目成员关系')
    if (targetStatus === '1' && project.ownerId === targetUserId) throw BusinessException.forbidden('不能移除或停用项目负责人字段对应的用户')
  }

  private async assertModuleAssigneeAllowed(operatorId: string, projectId: string, assigneeId?: string | null) {
    await this.roleSecurity.assertAssignableProjectFieldUser({
      operatorId,
      projectId,
      targetUserId: assigneeId,
      allowedMemberRoles: [BUG_MEMBER_ROLE.DEVELOPER],
      label: '默认负责人',
    })
  }

  private async assertReviewerExists(projectId: string) {
    const reviewers = await this.prisma.bugProjectMember.count({
      where: {
        projectId: BigInt(projectId),
        memberRole: { in: [BUG_MEMBER_ROLE.OWNER, BUG_MEMBER_ROLE.PRODUCT, BUG_MEMBER_ROLE.REVIEWER] },
        status: '0',
      },
    })
    const projectOwner = await this.prisma.bugProject.findFirst({
      where: { projectId: BigInt(projectId), ownerId: { not: null }, delFlag: '0', status: '0' },
      select: { projectId: true },
    })
    if (reviewers === 0 && !projectOwner) throw BusinessException.invalidParams('添加开发人员前，请先配置项目负责人、产品负责人或审核人员')
  }

  private projectUpdateData(dto: UpdateBugProjectDto): Prisma.BugProjectUncheckedUpdateInput {
    const data: Prisma.BugProjectUncheckedUpdateInput = {}
    if (dto.projectName !== undefined) data.projectName = dto.projectName
    if (dto.projectKey !== undefined) data.projectKey = dto.projectKey.toUpperCase()
    if (dto.ownerId !== undefined) data.ownerId = dto.ownerId ? BigInt(dto.ownerId) : null
    if (dto.description !== undefined) data.description = dto.description
    if (dto.projectStage !== undefined) data.projectStage = dto.projectStage
    if (dto.plannedStartTime !== undefined) data.plannedStartTime = dto.plannedStartTime ? new Date(dto.plannedStartTime) : null
    if (dto.plannedEndTime !== undefined) data.plannedEndTime = dto.plannedEndTime ? new Date(dto.plannedEndTime) : null
    if (dto.actualStartTime !== undefined) data.actualStartTime = dto.actualStartTime ? new Date(dto.actualStartTime) : null
    if (dto.actualEndTime !== undefined) data.actualEndTime = dto.actualEndTime ? new Date(dto.actualEndTime) : null
    if (dto.progress !== undefined) data.progress = Number(dto.progress)
    if (dto.riskLevel !== undefined) data.riskLevel = dto.riskLevel
    if (dto.riskNote !== undefined) data.riskNote = dto.riskNote
    if (dto.status !== undefined) data.status = dto.status
    return data
  }

  private moduleCreateData(dto: CreateBugModuleDto): Prisma.BugProjectModuleUncheckedCreateInput {
    return {
      projectId: BigInt(dto.projectId),
      moduleName: dto.moduleName,
      defaultAssigneeId: dto.defaultAssigneeId ? BigInt(dto.defaultAssigneeId) : undefined,
      orderNum: Number(dto.orderNum ?? 0),
      status: dto.status ?? '0',
    }
  }

  private moduleUpdateData(dto: UpdateBugModuleDto): Prisma.BugProjectModuleUncheckedUpdateInput {
    const data: Prisma.BugProjectModuleUncheckedUpdateInput = {}
    if (dto.projectId !== undefined) data.projectId = BigInt(dto.projectId)
    if (dto.moduleName !== undefined) data.moduleName = dto.moduleName
    if (dto.defaultAssigneeId !== undefined) {
      data.defaultAssigneeId = dto.defaultAssigneeId ? BigInt(dto.defaultAssigneeId) : null
    }
    if (dto.orderNum !== undefined) data.orderNum = Number(dto.orderNum)
    if (dto.status !== undefined) data.status = dto.status
    return data
  }

  private versionCreateData(dto: CreateBugVersionDto): Prisma.BugProjectVersionUncheckedCreateInput {
    return {
      projectId: BigInt(dto.projectId),
      versionNo: dto.versionNo,
      versionName: dto.versionName ?? '',
      iterationId: dto.iterationId ? BigInt(dto.iterationId) : undefined,
      milestoneId: dto.milestoneId ? BigInt(dto.milestoneId) : undefined,
      releaseNote: dto.releaseNote ?? '',
      status: dto.status ?? 'planning',
    }
  }

  private versionUpdateData(dto: UpdateBugVersionDto): Prisma.BugProjectVersionUncheckedUpdateInput {
    const data: Prisma.BugProjectVersionUncheckedUpdateInput = {}
    if (dto.projectId !== undefined) data.projectId = BigInt(dto.projectId)
    if (dto.versionNo !== undefined) data.versionNo = dto.versionNo
    if (dto.versionName !== undefined) data.versionName = dto.versionName
    if (dto.iterationId !== undefined) data.iterationId = dto.iterationId ? BigInt(dto.iterationId) : null
    if (dto.milestoneId !== undefined) data.milestoneId = dto.milestoneId ? BigInt(dto.milestoneId) : null
    if (dto.releaseNote !== undefined) data.releaseNote = dto.releaseNote
    if (dto.status !== undefined) data.status = dto.status
    return data
  }

  private async paginateProjects(where: Prisma.BugProjectWhereInput, query: QueryBugProjectDto) {
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.bugProject.count({ where }),
      this.prisma.bugProject.findMany({
        where,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        include: { owner: true },
        orderBy: buildProjectOrderBy(query),
      }),
    ])
    return { total, rows }
  }
}

import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { BusinessException } from '../../common/exceptions/business.exception'
import { type BugMemberRole } from '../constants/bug.constants'
import {
  ASSIGN_CONTEXT_MEMBER_ROLES,
  PROJECT_MEMBER_ROLE_KEYS,
  PROJECT_MEMBERSHIP_CONTEXTS,
} from './role-security.config'
import {
  defaultRoleSecurityLevel,
  expandEquivalentRoleKeys,
  isLegacyBusinessRole,
} from '../../common/security/role-level.config'

interface AssignableUserOptionsQuery {
  keyword?: string
  projectId?: string
  memberRole?: string
  assignContext?: string
  assignableOnly?: string
}

interface TargetRoleOptions {
  allowAdminBypassRole?: boolean
}

type UserWithRoles = Prisma.SysUserGetPayload<{ include: { roles: { include: { role: true } } } }>

@Injectable()
export class RoleSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async isAdmin(userId: string | bigint) {
    return this.hasAnyRole(userId, ['admin'])
  }

  async hasAnyRole(userId: string | bigint, roleKeys: string[]) {
    const role = await this.prisma.sysUserRole.findFirst({
      where: {
        userId: BigInt(userId),
        role: { roleKey: { in: expandEquivalentRoleKeys(roleKeys) }, delFlag: '0', status: '0' },
      },
      select: { userId: true },
    })
    return Boolean(role)
  }

  async getUserSecurityLevel(userId: string | bigint) {
    const roles = await this.getUserRoleKeys(userId)
    return this.levelFromRoles(roles)
  }

  async getUserRoleKeys(userId: string | bigint) {
    const rows = await this.prisma.sysUserRole.findMany({
      where: { userId: BigInt(userId), role: { delFlag: '0', status: '0' } },
      select: { role: { select: { roleKey: true, securityLevel: true } } },
    })
    return rows
      .filter((row) => !isLegacyBusinessRole(row.role.roleKey))
      .map((row) => ({
        roleKey: row.role.roleKey,
        securityLevel: row.role.securityLevel ?? defaultRoleSecurityLevel(row.role.roleKey),
      }))
  }

  async assertActiveUser(userId: string | bigint) {
    const user = await this.prisma.sysUser.findFirst({
      where: { userId: BigInt(userId), delFlag: '0', status: '0' },
      select: { userId: true },
    })
    if (!user) throw BusinessException.notFound('用户不存在或已停用')
  }

  async assertNotHigher(operatorId: string | bigint, targetUserId: string | bigint, message = '不能选择权限高于自己的用户') {
    if (await this.isAdmin(operatorId)) return
    const [operatorLevel, targetLevel] = await Promise.all([
      this.getUserSecurityLevel(operatorId),
      this.getTargetUserSecurityLevel(targetUserId),
    ])
    if (targetLevel > operatorLevel) throw BusinessException.forbidden(message)
  }

  async assertTargetHasRole(
    operatorId: string | bigint,
    targetUserId: string | bigint,
    roleKeys: string[],
    label: string,
    options: TargetRoleOptions = {},
  ) {
    await this.assertActiveUser(targetUserId)
    if (options.allowAdminBypassRole && await this.isAdmin(operatorId)) return
    await this.assertNotHigher(operatorId, targetUserId, `不能选择权限高于自己的${label}`)
    if (await this.isAdmin(targetUserId)) return
    if (!(await this.hasAnyRole(targetUserId, roleKeys))) {
      throw BusinessException.invalidParams(`${label}必须具备对应系统角色`)
    }
  }

  async assertAssignableProjectMember(operatorId: string | bigint, targetUserId: string | bigint, memberRole: string) {
    await this.assertActiveUser(targetUserId)
    await this.assertNotHigher(operatorId, targetUserId, '不能维护权限高于自己的项目成员')
    await this.assertUserMatchesMemberRole(targetUserId, memberRole)
  }

  async assertAssignableProjectFieldUser(options: {
    operatorId: string | bigint
    projectId: string | bigint
    targetUserId?: string | null
    allowedMemberRoles: BugMemberRole[]
    label: string
  }) {
    const { operatorId, projectId, targetUserId, allowedMemberRoles, label } = options
    if (!targetUserId) return
    const operatorIsAdmin = await this.isAdmin(operatorId)
    await this.assertActiveUser(targetUserId)
    if (!operatorIsAdmin) {
      await this.assertNotHigher(operatorId, targetUserId, `不能选择权限高于自己的${label}`)
      const member = await this.prisma.bugProjectMember.findFirst({
        where: {
          projectId: BigInt(projectId),
          userId: BigInt(targetUserId),
          memberRole: { in: allowedMemberRoles },
          status: '0',
        },
        select: { memberRole: true },
      })
      if (!member) throw BusinessException.invalidParams(`${label}必须是当前项目的有效成员`)
    }
    await this.assertUserMatchesAnyMemberRole(targetUserId, allowedMemberRoles, `${label}必须具备对应系统角色`)
  }

  async assignableUserOptions(operatorId: string | bigint | undefined, query: AssignableUserOptionsQuery = {}) {
    const users = await this.prisma.sysUser.findMany({
      where: this.userOptionWhere(query),
      include: { roles: { include: { role: true } } },
      orderBy: { userId: 'asc' },
      take: 200,
    })
    const filtered = await this.filterUsersByContext(operatorId, users, query)
    const securityFiltered = operatorId && this.shouldApplySecurity(query)
      ? await this.filterUsersBySecurity(operatorId, filtered)
      : filtered
    return securityFiltered.slice(0, 100).map((user) => ({ userId: user.userId, userName: user.userName, nickName: user.nickName }))
  }

  private userOptionWhere(query: AssignableUserOptionsQuery): Prisma.SysUserWhereInput {
    const memberRoles = this.resolveProjectMemberRoles(query)
    const shouldFilterProjectMember = Boolean(
      query.projectId &&
      memberRoles.length &&
      this.shouldFilterByProjectMembership(query) &&
      !this.shouldBypassProjectMembershipFilter(query),
    )
    return {
      delFlag: '0',
      status: '0',
      ...(query.keyword ? { OR: [{ userName: { contains: query.keyword } }, { nickName: { contains: query.keyword } }] } : {}),
      ...(shouldFilterProjectMember
        ? {
            bugProjectMembers: {
              some: {
                projectId: BigInt(query.projectId!),
                memberRole: { in: memberRoles },
                status: '0',
              },
            },
          }
        : {}),
    }
  }

  private async filterUsersByContext(
    operatorId: string | bigint | undefined,
    users: UserWithRoles[],
    query: AssignableUserOptionsQuery,
  ) {
    // 超级管理员维护项目负责人时具备兜底能力：候选人只要求启用，不强制预先具备业务角色。
    if (await this.canAdminBypassProjectOwnerRoleFilter(operatorId, query)) return users
    const roleKeys = this.requiredSystemRoleKeys(query)
    if (!roleKeys.length) return users
    return users.filter((user) => this.userHasAnyRole(user, roleKeys) || this.userHasAnyRole(user, ['admin']))
  }

  private async canAdminBypassProjectOwnerRoleFilter(
    operatorId: string | bigint | undefined,
    query: AssignableUserOptionsQuery,
  ) {
    if (!operatorId || query.assignContext !== 'projectOwner') return false
    return this.isAdmin(operatorId)
  }

  private async filterUsersBySecurity(operatorId: string | bigint, users: UserWithRoles[]) {
    if (await this.isAdmin(operatorId)) return users
    const operatorLevel = await this.getUserSecurityLevel(operatorId)
    return users.filter((user) => this.levelFromRoles(this.activeRoleKeys(user)) <= operatorLevel)
  }

  private shouldApplySecurity(query: AssignableUserOptionsQuery) {
    return query.assignableOnly === 'true' || Boolean(query.assignContext) || Boolean(query.memberRole)
  }

  private shouldFilterByProjectMembership(query: AssignableUserOptionsQuery) {
    if (!query.assignContext) return true
    return PROJECT_MEMBERSHIP_CONTEXTS.has(query.assignContext)
  }

  private shouldBypassProjectMembershipFilter(query: AssignableUserOptionsQuery) {
    return query.assignableOnly === 'true' && Boolean(query.assignContext)
  }

  private resolveProjectMemberRoles(query: AssignableUserOptionsQuery): BugMemberRole[] {
    if (query.assignContext && ASSIGN_CONTEXT_MEMBER_ROLES[query.assignContext]) return ASSIGN_CONTEXT_MEMBER_ROLES[query.assignContext]
    return query.memberRole ? [query.memberRole as BugMemberRole] : []
  }

  private requiredSystemRoleKeys(query: AssignableUserOptionsQuery) {
    if (query.assignContext === 'projectOwner') return expandEquivalentRoleKeys(['bug_project_owner'])
    const memberRoles = this.resolveProjectMemberRoles(query)
    return expandEquivalentRoleKeys(memberRoles.flatMap((role) => PROJECT_MEMBER_ROLE_KEYS[role] ?? []))
  }

  private async assertUserMatchesMemberRole(userId: string | bigint, memberRole: string) {
    await this.assertUserMatchesAnyMemberRole(userId, [memberRole as BugMemberRole], '项目成员必须具备对应系统角色')
  }

  private async assertUserMatchesAnyMemberRole(userId: string | bigint, memberRoles: BugMemberRole[], message: string) {
    if (await this.isAdmin(userId)) return
    const requiredRoleKeys = [...new Set(memberRoles.flatMap((role) => PROJECT_MEMBER_ROLE_KEYS[role] ?? []))]
    if (!requiredRoleKeys.length) return
    if (!(await this.hasAnyRole(userId, requiredRoleKeys))) throw BusinessException.invalidParams(message)
  }

  private userHasAnyRole(user: UserWithRoles, roleKeys: string[]) {
    return user.roles.some((item) =>
      roleKeys.includes(item.role.roleKey) &&
      item.role.delFlag === '0' &&
      item.role.status === '0' &&
      !isLegacyBusinessRole(item.role.roleKey),
    )
  }

  private activeRoleKeys(user: UserWithRoles) {
    return user.roles
      .filter((item) => item.role.delFlag === '0' && item.role.status === '0' && !isLegacyBusinessRole(item.role.roleKey))
      .map((item) => ({
        roleKey: item.role.roleKey,
        securityLevel: item.role.securityLevel ?? defaultRoleSecurityLevel(item.role.roleKey),
      }))
  }

  private async getTargetUserSecurityLevel(userId: string | bigint) {
    const roles = await this.getUserRoleKeys(userId)
    return this.levelFromRoles(roles)
  }

  private levelFromRoles(roles: Array<{ roleKey: string; securityLevel: number }>) {
    return Math.max(0, ...roles.map((role) => role.securityLevel))
  }
}

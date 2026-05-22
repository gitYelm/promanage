import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { BusinessException } from '../common/exceptions/business.exception'
import { isLegacyBusinessRole } from '../common/security/role-level.config'
import { PrismaService } from '../prisma/prisma.service'
import { BUG_ACTION, BUG_MEMBER_ROLE, BUG_STATUS, type BugAction } from './constants/bug.constants'

const PROJECT_WIDE_ROLES = [
  BUG_MEMBER_ROLE.OWNER,
  BUG_MEMBER_ROLE.PRODUCT,
  BUG_MEMBER_ROLE.REVIEWER,
  BUG_MEMBER_ROLE.VIEWER,
]

export interface RequestUserLike {
  userId: string
  username: string
}

export interface BugTicketActorInfo {
  ticketId: bigint
  projectId: bigint
  submitterId: bigint
  assigneeId: bigint | null
  verifierId: bigint | null
  status: string
}

@Injectable()
export class BugAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async isAdmin(userId: string): Promise<boolean> {
    const roles = await this.prisma.sysUserRole.findMany({
      where: { userId: BigInt(userId), role: { delFlag: '0', status: '0' } },
      include: { role: true },
    })
    return roles.some((item) => item.role.roleKey === 'admin')
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
      include: { roles: { include: { role: true } } },
    })
    if (!user) return []
    const activeRoles = user.roles.filter(
      (item) =>
        item.role.delFlag === '0' &&
        item.role.status === '0' &&
        !isLegacyBusinessRole(item.role.roleKey),
    )
    if (activeRoles.some((item) => item.role.roleKey === 'admin')) return ['*:*:*']

    const roleIds = activeRoles.map((item) => item.roleId)
    const menus = await this.prisma.sysMenu.findMany({
      where: { roles: { some: { roleId: { in: roleIds } } }, status: '0', perms: { not: '' } },
      select: { perms: true },
    })
    return menus.map((item) => item.perms).filter((perms): perms is string => Boolean(perms))
  }

  async assertAnyPermission(userId: string, permissions: string[]): Promise<void> {
    const userPermissions = await this.getUserPermissions(userId)
    if (userPermissions.includes('*:*:*')) return
    if (!permissions.some((permission) => this.matchPermission(userPermissions, permission))) {
      throw BusinessException.forbidden(`没有操作权限，需要: ${permissions.join(' 或 ')}`)
    }
  }

  async getVisibleProjectIds(userId: string): Promise<bigint[]> {
    if (await this.isAdmin(userId)) {
      const projects = await this.prisma.bugProject.findMany({
        where: { delFlag: '0', status: '0' },
        select: { projectId: true },
      })
      return projects.map((item) => item.projectId)
    }

    const [memberProjects, ownedProjects] = await Promise.all([
      this.prisma.bugProjectMember.findMany({
        where: { userId: BigInt(userId), status: '0', project: { delFlag: '0', status: '0' } },
        select: { projectId: true },
      }),
      this.prisma.bugProject.findMany({
        where: { ownerId: BigInt(userId), delFlag: '0', status: '0' },
        select: { projectId: true },
      }),
    ])
    return [...new Set([...memberProjects, ...ownedProjects].map((item) => item.projectId))]
  }

  async buildTicketWhere(userId: string, mine?: boolean): Promise<Prisma.BugTicketWhereInput> {
    if (await this.isAdmin(userId)) return { delFlag: '0' }

    const personalWhere: Prisma.BugTicketWhereInput[] = [
      { submitterId: BigInt(userId) },
      { assigneeId: BigInt(userId) },
      { verifierId: BigInt(userId) },
      { comments: { some: { userId: BigInt(userId), delFlag: '0' } } },
    ]

    if (mine) {
      return {
        delFlag: '0',
        OR: personalWhere,
      }
    }

    const projectWideProjectIds = await this.getProjectWideProjectIds(userId)
    const testerProjectIds = await this.getTesterProjectIds(userId)
    return {
      delFlag: '0',
      OR: [
        { projectId: { in: projectWideProjectIds } },
        { projectId: { in: testerProjectIds }, status: BUG_STATUS.PENDING_VERIFY },
        ...personalWhere,
      ],
    }
  }

  async buildRequirementWhere(userId: string): Promise<Prisma.ProjectRequirementWhereInput> {
    if (await this.isAdmin(userId)) return { delFlag: '0' }

    const projectWideProjectIds = await this.getProjectWideProjectIds(userId)
    const userIdBigInt = BigInt(userId)

    return {
      delFlag: '0',
      OR: [
        { projectId: { in: projectWideProjectIds } },
        { ownerId: userIdBigInt },
        { developerId: userIdBigInt },
        { testerId: userIdBigInt },
      ],
    }
  }

  async assertRequirementVisible(userId: string, requirementId: string): Promise<void> {
    const where = await this.buildRequirementWhere(userId)
    const requirement = await this.prisma.projectRequirement.findFirst({
      where: { AND: [where, { requirementId: BigInt(requirementId) }] },
      select: { requirementId: true },
    })
    if (!requirement) throw BusinessException.forbidden('无权访问该需求')
  }

  private async getProjectWideProjectIds(userId: string): Promise<bigint[]> {
    const [memberProjects, ownedProjects] = await Promise.all([
      this.prisma.bugProjectMember.findMany({
        where: {
          userId: BigInt(userId),
          memberRole: { in: PROJECT_WIDE_ROLES },
          status: '0',
          project: { delFlag: '0', status: '0' },
        },
        select: { projectId: true },
      }),
      this.prisma.bugProject.findMany({
        where: { ownerId: BigInt(userId), delFlag: '0', status: '0' },
        select: { projectId: true },
      }),
    ])
    return [...new Set([...memberProjects, ...ownedProjects].map((item) => item.projectId))]
  }

  private async getTesterProjectIds(userId: string): Promise<bigint[]> {
    const members = await this.prisma.bugProjectMember.findMany({
      where: {
        userId: BigInt(userId),
        memberRole: BUG_MEMBER_ROLE.TESTER,
        status: '0',
        project: { delFlag: '0', status: '0' },
      },
      select: { projectId: true },
    })
    return [...new Set(members.map((item) => item.projectId))]
  }

  async assertTicketVisible(userId: string, ticketId: string): Promise<void> {
    const where = await this.buildTicketWhere(userId)
    const ticket = await this.prisma.bugTicket.findFirst({
      where: { AND: [where, { ticketId: BigInt(ticketId) }] },
      select: { ticketId: true },
    })
    if (!ticket) throw BusinessException.forbidden('无权访问该 Bug')
  }

  async assertTicketActionAllowed(
    userId: string,
    permissions: string[],
    ticket: BugTicketActorInfo,
    action: BugAction,
  ): Promise<void> {
    const userPermissions = await this.getUserPermissions(userId)
    if (userPermissions.includes('*:*:*')) return
    if (!permissions.some((permission) => this.matchPermission(userPermissions, permission))) {
      throw BusinessException.forbidden(`没有操作权限，需要: ${permissions.join(' 或 ')}`)
    }
    if (this.isReviewerAction(action)) {
      await this.assertProjectReviewer(userId, ticket.projectId)
      return
    }
    if (this.isDeveloperAction(action)) {
      this.assertAssignedDeveloper(userId, ticket)
      return
    }
    if (this.isVerifyAction(action)) {
      await this.assertTicketVerifier(userId, ticket)
      return
    }
    if (action === BUG_ACTION.REOPEN) {
      await this.assertCanReopen(userId, ticket)
      return
    }
    if (action === BUG_ACTION.CLOSE) {
      if (ticket.status === BUG_STATUS.SUSPENDED)
        await this.assertProjectReviewer(userId, ticket.projectId)
      else await this.assertTicketVerifier(userId, ticket)
    }
  }

  async canTicketAction(
    userId: string,
    permissions: string[],
    ticket: BugTicketActorInfo,
    action: BugAction,
  ): Promise<boolean> {
    try {
      await this.assertTicketActionAllowed(userId, permissions, ticket, action)
      return true
    } catch {
      return false
    }
  }

  async isProjectReviewer(userId: string, projectId: bigint) {
    if (await this.isAdmin(userId)) return true
    return this.hasProjectRole(userId, projectId, [
      BUG_MEMBER_ROLE.OWNER,
      BUG_MEMBER_ROLE.PRODUCT,
      BUG_MEMBER_ROLE.REVIEWER,
    ])
  }

  async isReadonlyProjectViewer(userId: string, projectId: bigint) {
    if (await this.isAdmin(userId)) return false
    const [viewer, elevated] = await Promise.all([
      this.hasProjectRole(userId, projectId, [BUG_MEMBER_ROLE.VIEWER]),
      this.hasProjectRole(userId, projectId, [
        BUG_MEMBER_ROLE.OWNER,
        BUG_MEMBER_ROLE.PRODUCT,
        BUG_MEMBER_ROLE.REVIEWER,
        BUG_MEMBER_ROLE.DEVELOPER,
        BUG_MEMBER_ROLE.TESTER,
      ]),
    ])
    return viewer && !elevated
  }

  async assertCanRemoveAttachment(
    userId: string,
    attachment: { uploaderId: bigint; ticketId: bigint | null },
  ) {
    if (await this.isAdmin(userId)) return
    if (attachment.uploaderId === BigInt(userId)) return
    if (!attachment.ticketId) throw BusinessException.forbidden('无权删除该附件')
    const ticket = await this.prisma.bugTicket.findFirst({
      where: { ticketId: attachment.ticketId, delFlag: '0' },
      select: { projectId: true },
    })
    if (!ticket) throw BusinessException.forbidden('无权删除该附件')
    const isOwner = await this.isActiveProjectMember(userId, ticket.projectId, ['owner'])
    if (!isOwner) throw BusinessException.forbidden('只能删除本人上传或负责项目内的附件')
  }

  private async assertProjectReviewer(userId: string, projectId: bigint) {
    if (await this.isProjectReviewer(userId, projectId)) return
    throw BusinessException.forbidden('只有审核人员可以确认、驳回或分派 Bug')
  }

  private assertAssignedDeveloper(userId: string, ticket: BugTicketActorInfo) {
    if (ticket.assigneeId === BigInt(userId)) return
    throw BusinessException.forbidden('只有被分派的开发人员可以修复该 Bug')
  }

  private async assertTicketVerifier(userId: string, ticket: BugTicketActorInfo) {
    const userIdBigInt = BigInt(userId)
    if (ticket.verifierId === userIdBigInt) return
    if (
      await this.hasProjectRole(userId, ticket.projectId, [
        BUG_MEMBER_ROLE.OWNER,
        BUG_MEMBER_ROLE.PRODUCT,
        BUG_MEMBER_ROLE.REVIEWER,
        BUG_MEMBER_ROLE.TESTER,
      ])
    )
      return
    throw BusinessException.forbidden('只有测试人员或审核人员可以验证该 Bug')
  }

  private async assertCanReopen(userId: string, ticket: BugTicketActorInfo) {
    const userIdBigInt = BigInt(userId)
    if (ticket.submitterId === userIdBigInt || ticket.verifierId === userIdBigInt) return
    if (
      await this.hasProjectRole(userId, ticket.projectId, [
        BUG_MEMBER_ROLE.OWNER,
        BUG_MEMBER_ROLE.PRODUCT,
        BUG_MEMBER_ROLE.REVIEWER,
        BUG_MEMBER_ROLE.TESTER,
      ])
    )
      return
    throw BusinessException.forbidden('只有提交人、测试人员或审核人员可以重新打开该 Bug')
  }

  private async isActiveProjectMember(userId: string, projectId: bigint, roles: string[]) {
    const member = await this.prisma.bugProjectMember.findFirst({
      where: { projectId, userId: BigInt(userId), memberRole: { in: roles }, status: '0' },
      select: { memberId: true },
    })
    return Boolean(member)
  }

  private async hasProjectRole(userId: string, projectId: bigint, roles: string[]) {
    const [member, project] = await Promise.all([
      this.isActiveProjectMember(userId, projectId, roles),
      roles.includes(BUG_MEMBER_ROLE.OWNER)
        ? this.prisma.bugProject.findFirst({
            where: { projectId, ownerId: BigInt(userId), delFlag: '0', status: '0' },
            select: { projectId: true },
          })
        : null,
    ])
    return member || Boolean(project)
  }

  private isReviewerAction(action: BugAction) {
    const reviewerActions: readonly BugAction[] = [
      BUG_ACTION.CONFIRM,
      BUG_ACTION.REJECT,
      BUG_ACTION.CANNOT_REPRODUCE,
      BUG_ACTION.DUPLICATE,
      BUG_ACTION.SUSPEND,
      BUG_ACTION.RESTORE,
      BUG_ACTION.ASSIGN,
    ]
    return reviewerActions.includes(action)
  }

  private isDeveloperAction(action: BugAction) {
    return action === BUG_ACTION.START_FIX || action === BUG_ACTION.SUBMIT_VERIFY
  }

  private isVerifyAction(action: BugAction) {
    return action === BUG_ACTION.VERIFY_PASS || action === BUG_ACTION.VERIFY_FAIL
  }

  private matchPermission(userPermissions: string[], required: string): boolean {
    return userPermissions.some((userPerm) => {
      if (userPerm === required) return true
      if (userPerm.endsWith(':*')) return required.startsWith(userPerm.slice(0, -1))
      const userParts = userPerm.split(':')
      const requiredParts = required.split(':')
      const sameLength = userParts.length === requiredParts.length
      return (
        sameLength &&
        userParts.every((part, index) => {
          return part === '*' || part === requiredParts[index]
        })
      )
    })
  }
}

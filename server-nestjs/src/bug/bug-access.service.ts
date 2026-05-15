import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { BusinessException } from '../common/exceptions/business.exception'
import { PrismaService } from '../prisma/prisma.service'

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
      where: { userId: BigInt(userId) },
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
    if (user.roles.some((item) => item.role.roleKey === 'admin')) return ['*:*:*']

    const roleIds = user.roles.map((item) => item.roleId)
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
        where: { delFlag: '0' },
        select: { projectId: true },
      })
      return projects.map((item) => item.projectId)
    }

    const members = await this.prisma.bugProjectMember.findMany({
      where: { userId: BigInt(userId), status: '0' },
      select: { projectId: true },
    })
    return [...new Set(members.map((item) => item.projectId))]
  }

  async buildTicketWhere(userId: string, mine?: boolean): Promise<Prisma.BugTicketWhereInput> {
    if (await this.isAdmin(userId)) return { delFlag: '0' }

    if (mine) {
      return {
        delFlag: '0',
        OR: [
          { submitterId: BigInt(userId) },
          { assigneeId: BigInt(userId) },
          { verifierId: BigInt(userId) },
          { comments: { some: { userId: BigInt(userId), delFlag: '0' } } },
        ],
      }
    }

    const projectIds = await this.getVisibleProjectIds(userId)
    return {
      delFlag: '0',
      OR: [
        { projectId: { in: projectIds } },
        { submitterId: BigInt(userId) },
        { assigneeId: BigInt(userId) },
        { verifierId: BigInt(userId) },
      ],
    }
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
  ): Promise<void> {
    void ticket
    if (permissions.some((permission) => this.isDeveloperAction(permission))) return
    const userPermissions = await this.getUserPermissions(userId)
    if (userPermissions.includes('*:*:*')) return
    if (!permissions.some((permission) => this.matchPermission(userPermissions, permission))) {
      throw BusinessException.forbidden(`没有操作权限，需要: ${permissions.join(' 或 ')}`)
    }
    if (permissions.includes('bug:ticket:reopen')) {
      const isParticipant = await this.isTicketParticipant(userId, ticket)
      if (!isParticipant) throw BusinessException.forbidden('无权重新打开该 Bug')
    }
  }

  async assertCanRemoveAttachment(userId: string, attachment: { uploaderId: bigint; ticketId: bigint | null }) {
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

  private async isTicketParticipant(userId: string, ticket: BugTicketActorInfo) {
    const userIdBigInt = BigInt(userId)
    if (
      ticket.submitterId === userIdBigInt ||
      ticket.assigneeId === userIdBigInt ||
      ticket.verifierId === userIdBigInt
    ) {
      return true
    }
    return this.isActiveProjectMember(userId, ticket.projectId, ['owner', 'product', 'tester'])
  }

  private async isActiveProjectMember(userId: string, projectId: bigint, roles: string[]) {
    const member = await this.prisma.bugProjectMember.findFirst({
      where: { projectId, userId: BigInt(userId), memberRole: { in: roles }, status: '0' },
      select: { memberId: true },
    })
    return Boolean(member)
  }

  private isDeveloperAction(permission: string) {
    return permission === 'bug:ticket:startFix' || permission === 'bug:ticket:submitVerify'
  }

  private matchPermission(userPermissions: string[], required: string): boolean {
    return userPermissions.some((userPerm) => {
      if (userPerm === required) return true
      if (userPerm.endsWith(':*')) return required.startsWith(userPerm.slice(0, -1))
      const userParts = userPerm.split(':')
      const requiredParts = required.split(':')
      const sameLength = userParts.length === requiredParts.length
      return sameLength && userParts.every((part, index) => {
        return part === '*' || part === requiredParts[index]
      })
    })
  }
}

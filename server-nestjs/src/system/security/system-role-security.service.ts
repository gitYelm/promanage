import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { BusinessException } from '../../common/exceptions/business.exception'
import { PrismaService } from '../../prisma/prisma.service'
import { defaultRoleSecurityLevel, isLegacyBusinessRole } from '../../common/security/role-level.config'

@Injectable()
export class SystemRoleSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanAssignRoles(operatorId: string, roleIds?: string[]) {
    if (!roleIds?.length) return
    const targetLevel = await this.roleIdsLevel(roleIds)
    if (await this.isAdmin(operatorId)) return
    const operatorLevel = await this.userLevel(operatorId)
    if (targetLevel > operatorLevel) throw BusinessException.forbidden('不能分配权限高于自己的角色')
  }

  async assertCanMaintainUser(operatorId: string, targetUserId: string) {
    this.parseBigInt(targetUserId, '用户ID格式不正确')
    if (await this.isAdmin(operatorId)) return
    await this.assertTargetUserNotHigher(operatorId, targetUserId, '不能维护权限高于自己的用户')
  }

  async assertCanMaintainRole(operatorId: string, roleId: string) {
    const role = await this.prisma.sysRole.findFirst({
      where: { roleId: this.parseBigInt(roleId, '角色ID格式不正确'), delFlag: '0' },
      select: { roleKey: true, securityLevel: true },
    })
    if (!role) throw BusinessException.invalidParams('角色不存在')
    if (await this.isAdmin(operatorId)) return
    const [operatorLevel, targetLevel] = await Promise.all([
      this.userLevel(operatorId),
      Promise.resolve(role.securityLevel ?? defaultRoleSecurityLevel(role.roleKey)),
    ])
    if (targetLevel > operatorLevel) throw BusinessException.forbidden('不能维护权限高于自己的角色')
  }

  async assertCanSetRoleLevel(operatorId: string, securityLevel: number) {
    if (await this.isAdmin(operatorId)) return
    const operatorLevel = await this.userLevel(operatorId)
    if (securityLevel > operatorLevel) throw BusinessException.forbidden('不能设置高于自己安全等级的角色')
  }

  async assertCanMaintainRoleKey(operatorId: string, roleKey: string) {
    const role = await this.prisma.sysRole.findFirst({
      where: { roleKey, delFlag: '0' },
      select: { roleId: true },
    })
    if (!role) throw BusinessException.invalidParams('角色不存在')
    await this.assertCanMaintainRole(operatorId, role.roleId.toString())
  }

  async assertCanGrantMenus(operatorId: string, menuIds?: string[]) {
    if (!menuIds?.length || await this.isAdmin(operatorId)) return
    const grantMenuIds = [...new Set(menuIds.map((id) => this.parseBigInt(id, '菜单ID格式不正确')))]
    const ownedMenus = await this.prisma.sysMenu.findMany({
      where: {
        menuId: { in: grantMenuIds },
        roles: {
          some: {
            role: {
              delFlag: '0',
              status: '0',
              users: { some: { userId: BigInt(operatorId) } },
            },
          },
        },
      },
      select: { menuId: true },
    })
    if (ownedMenus.length !== grantMenuIds.length) {
      throw BusinessException.forbidden('不能给角色分配自己未拥有的菜单权限')
    }
  }

  async listMaxSecurityLevel(operatorId: string) {
    return await this.isAdmin(operatorId) ? undefined : this.userLevel(operatorId)
  }

  async accessibleUserWhere(operatorId: string): Promise<Prisma.SysUserWhereInput | undefined> {
    if (await this.isAdmin(operatorId)) return undefined
    const operatorLevel = await this.userLevel(operatorId)
    return {
      roles: {
        none: {
          role: { delFlag: '0', status: '0', securityLevel: { gt: operatorLevel } },
        },
      },
    }
  }

  async listAccessibleUsers(operatorId: string, query: {
    userName?: string
    phonenumber?: string
    status?: string
    deptId?: string
    roleId?: string
    pageNum?: number
    pageSize?: number
  }) {
    const { pageNum = 1, pageSize = 20 } = query
    const where = await this.userListWhere(operatorId, query)
    const [total, rows] = await Promise.all([
      this.prisma.sysUser.count({ where }),
      this.prisma.sysUser.findMany({
        where,
        skip: Number((pageNum - 1) * pageSize),
        take: Number(pageSize),
        include: { dept: true },
        orderBy: { userId: 'asc' },
      }),
    ])
    return { total, rows: rows.map(({ password: _password, twoFactorSecret: _secret, ...rest }) => rest) }
  }

  async listAccessibleUsersForExport(operatorId: string, query: {
    userName?: string
    phonenumber?: string
    status?: string
    deptId?: string
    roleId?: string
  }) {
    const where = await this.userListWhere(operatorId, query)
    const users = await this.prisma.sysUser.findMany({
      where,
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

  private async userListWhere(operatorId: string, query: {
    userName?: string
    phonenumber?: string
    status?: string
    deptId?: string
    roleId?: string
  }) {
    const where: Prisma.SysUserWhereInput = { delFlag: '0' }
    if (query.userName) where.userName = { contains: query.userName }
    if (query.phonenumber) where.phonenumber = { contains: query.phonenumber }
    if (query.status) where.status = query.status
    if (query.deptId) where.deptId = this.parseBigInt(query.deptId, '部门ID格式不正确')
    if (query.roleId) {
      await this.assertCanMaintainRole(operatorId, query.roleId)
      where.roles = { some: { roleId: this.parseBigInt(query.roleId, '角色ID格式不正确') } }
    }
    const accessibleWhere = await this.accessibleUserWhere(operatorId)
    return accessibleWhere ? { AND: [where, accessibleWhere] } : where
  }

  private async assertTargetUserNotHigher(operatorId: string, targetUserId: string, message: string) {
    const [operatorLevel, targetLevel] = await Promise.all([
      this.userLevel(operatorId),
      this.userLevel(targetUserId),
    ])
    if (targetLevel > operatorLevel) throw BusinessException.forbidden(message)
  }

  private async isAdmin(userId: string) {
    const role = await this.prisma.sysUserRole.findFirst({
      where: { userId: BigInt(userId), role: { roleKey: 'admin', delFlag: '0', status: '0' } },
      select: { userId: true },
    })
    return Boolean(role)
  }

  private async userLevel(userId: string) {
    const rows = await this.prisma.sysUserRole.findMany({
      where: { userId: BigInt(userId), role: { delFlag: '0', status: '0' } },
      select: { role: { select: { roleKey: true, securityLevel: true } } },
    })
    return Math.max(
      0,
      ...rows
        .filter((row) => !isLegacyBusinessRole(row.role.roleKey))
        .map((row) => row.role.securityLevel ?? defaultRoleSecurityLevel(row.role.roleKey)),
    )
  }

  private async roleIdsLevel(roleIds: string[]) {
    const uniqueRoleIds = [...new Set(roleIds)]
    const rows = await this.prisma.sysRole.findMany({
      where: { roleId: { in: uniqueRoleIds.map((id) => this.parseBigInt(id, '角色ID格式不正确')) }, delFlag: '0', status: '0' },
      select: { roleKey: true, securityLevel: true },
    })
    if (rows.length !== uniqueRoleIds.length) throw BusinessException.invalidParams('角色不存在或已停用')
    return Math.max(...rows.map((row) => row.securityLevel ?? defaultRoleSecurityLevel(row.roleKey)))
  }

  private parseBigInt(value: string, message: string) {
    if (!/^\d+$/.test(value)) throw BusinessException.invalidParams(message)
    return BigInt(value)
  }
}

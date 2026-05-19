import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../../common/logger/logger.service'
import { isLegacyBusinessRole } from '../../common/security/role-level.config'

@Injectable()
export class UserInfoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async getUserInfo(userId: string) {
    this.logger.debug(`获取用户信息: ${userId}`, 'UserInfoService')
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        dept: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) return null

    // 为什么只取启用角色：后端守卫已经只认启用角色，前端权限态也必须一致，
    // 避免停用/删除角色继续让页面按钮误显示。
    const activeRoles = user.roles.filter((ur) => {
      return ur.role.delFlag === '0' && ur.role.status === '0' && !isLegacyBusinessRole(ur.role.roleKey)
    })
    const roleKeys = activeRoles.map((ur) => ur.role.roleKey)
    const roleList = activeRoles.map((ur) => ({
      roleId: ur.role.roleId.toString(),
      roleName: ur.role.roleName,
      roleKey: ur.role.roleKey,
      securityLevel: ur.role.securityLevel,
    }))
    const isAdmin = roleKeys.includes('admin')
    const permissions = isAdmin ? ['*:*:*'] : await this.getPermissions(activeRoles.map((ur) => ur.roleId))

    const { password: _password, twoFactorSecret: _secret, roles: _roles, ...userInfo } = user
    return {
      user: userInfo,
      roles: roleKeys,
      roleList,
      permissions,
    }
  }

  private async getPermissions(roleIds: bigint[]) {
    if (roleIds.length === 0) return []
    const menus = await this.prisma.sysMenu.findMany({
      where: {
        roles: {
          some: {
            roleId: { in: roleIds },
            role: { delFlag: '0', status: '0' },
          },
        },
        status: '0',
        perms: { not: '' },
      },
      select: { perms: true },
    })
    return menus
      .map((menu) => menu.perms)
      .filter((perms): perms is string => Boolean(perms))
  }
}

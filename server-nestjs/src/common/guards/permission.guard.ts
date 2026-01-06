import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSION_KEY } from '../decorators/permission.decorator'
import { PrismaService } from '../../prisma/prisma.service'

interface RequestUser {
  userId: string
  username: string
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取装饰器中定义的权限
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // 没有设置权限要求，直接放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>()
    const user = request.user

    if (!user?.userId) {
      throw new ForbiddenException('用户未登录')
    }

    // 获取用户权限
    const userPermissions = await this.getUserPermissions(user.userId)

    // 超级管理员拥有所有权限
    if (userPermissions.includes('*:*:*')) {
      return true
    }

    // 检查是否拥有所需权限（满足其一即可）
    const hasPermission = requiredPermissions.some((permission) =>
      this.matchPermission(userPermissions, permission),
    )

    if (!hasPermission) {
      throw new ForbiddenException(`没有操作权限，需要: ${requiredPermissions.join(' 或 ')}`)
    }

    return true
  }

  /**
   * 获取用户权限列表
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) return []

    const roleKeys = user.roles.map((ur) => ur.role.roleKey)

    // 超级管理员
    if (roleKeys.includes('admin')) {
      return ['*:*:*']
    }

    // 查询角色关联的菜单权限
    const roleIds = user.roles.map((ur) => ur.roleId)
    const menus = await this.prisma.sysMenu.findMany({
      where: {
        roles: {
          some: {
            roleId: { in: roleIds },
          },
        },
        status: '0',
        perms: { not: '' },
      },
      select: { perms: true },
    })

    return menus.map((m) => m.perms).filter((p): p is string => !!p)
  }

  /**
   * 权限匹配（支持通配符）
   * @param userPermissions 用户拥有的权限
   * @param required 需要的权限
   */
  private matchPermission(userPermissions: string[], required: string): boolean {
    return userPermissions.some((userPerm) => {
      // 完全匹配
      if (userPerm === required) return true

      // 通配符匹配，如 system:user:* 匹配 system:user:add
      if (userPerm.endsWith(':*')) {
        const prefix = userPerm.slice(0, -1) // 去掉最后的 *
        return required.startsWith(prefix)
      }

      // 模块级通配符，如 system:*:* 匹配 system:user:add
      const userParts = userPerm.split(':')
      const requiredParts = required.split(':')

      if (userParts.length !== requiredParts.length) return false

      return userParts.every((part, index) => part === '*' || part === requiredParts[index])
    })
  }
}

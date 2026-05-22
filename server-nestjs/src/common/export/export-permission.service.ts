import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { isLegacyBusinessRole } from '../security/role-level.config'

const EXPORT_MODULE_PERMISSIONS: Record<string, string> = {
  user: 'system:user:export',
  'bug-statistics': 'bug:statistics:export',
  'pm-requirement': 'pm:requirement:view',
}

@Injectable()
export class ExportPermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanExportModule(userId: string, module: string) {
    const permission = EXPORT_MODULE_PERMISSIONS[module]
    if (!permission) throw new NotFoundException(`未找到模块 ${module} 的导出权限配置`)
    const permissions = await this.getUserPermissions(userId)
    if (permissions.includes('*:*:*')) return
    if (!this.matchPermission(permissions, permission)) {
      throw new ForbiddenException(`没有导出权限，需要: ${permission}`)
    }
  }

  async assertCanAccessTask(taskId: string, username: string) {
    const task = await this.prisma.sysExportTask.findUnique({
      where: { taskId },
      select: { createBy: true, module: true },
    })
    if (!task) throw new NotFoundException('任务不存在')
    if (task.createBy !== username) throw new NotFoundException('无权访问')
    return task
  }

  private async getUserPermissions(userId: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
      include: { roles: { include: { role: true } } },
    })
    if (!user) return []
    const activeRoles = user.roles.filter((item) => {
      return (
        item.role.delFlag === '0' &&
        item.role.status === '0' &&
        !isLegacyBusinessRole(item.role.roleKey)
      )
    })
    if (activeRoles.some((item) => item.role.roleKey === 'admin')) return ['*:*:*']
    const roleIds = activeRoles.map((item) => item.roleId)
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
    return menus.map((menu) => menu.perms).filter((perms): perms is string => Boolean(perms))
  }

  private matchPermission(userPermissions: string[], required: string) {
    return userPermissions.some((userPerm) => {
      if (userPerm === required) return true
      if (userPerm.endsWith(':*')) return required.startsWith(userPerm.slice(0, -1))
      const userParts = userPerm.split(':')
      const requiredParts = required.split(':')
      return (
        userParts.length === requiredParts.length &&
        userParts.every((part, index) => part === '*' || part === requiredParts[index])
      )
    })
  }
}

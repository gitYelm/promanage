import { Injectable } from '@nestjs/common'
import { BusinessException } from '../../common/exceptions/business.exception'
import { ErrorCode } from '../../common/enums/error-code.enum'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class BugProjectHelperService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureProject(projectId: string) {
    const project = await this.prisma.bugProject.findFirst({
      where: { projectId: BigInt(projectId), delFlag: '0' },
    })
    if (!project) throw new BusinessException(ErrorCode.BUG_PROJECT_NOT_FOUND, '项目不存在')
    return project
  }

  async ensureModule(moduleId: string) {
    const module = await this.prisma.bugProjectModule.findFirst({
      where: { moduleId: BigInt(moduleId), delFlag: '0' },
    })
    if (!module) throw BusinessException.notFound('模块不存在')
    return module
  }

  async ensureVersion(versionId: string) {
    const version = await this.prisma.bugProjectVersion.findFirst({
      where: { versionId: BigInt(versionId), delFlag: '0' },
    })
    if (!version) throw BusinessException.notFound('版本不存在')
    return version
  }

  async ensureUser(userId: string) {
    const user = await this.prisma.sysUser.findFirst({
      where: { userId: BigInt(userId), delFlag: '0', status: '0' },
    })
    if (!user) throw BusinessException.notFound('用户不存在或已停用')
    return user
  }

  async visibleProjectIds(userId: string) {
    const roles = await this.prisma.sysUserRole.findMany({
      where: { userId: BigInt(userId) },
      include: { role: true },
    })
    if (roles.some((item) => item.role.roleKey === 'admin')) {
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

  async assertUniqueModule(projectId: string, moduleName: string, excludeId?: string) {
    const existed = await this.prisma.bugProjectModule.findFirst({
      where: { projectId: BigInt(projectId), moduleName, delFlag: '0' },
    })
    if (existed && String(existed.moduleId) !== excludeId) {
      throw new BusinessException(ErrorCode.BUG_PROJECT_EXISTS, '模块名称已存在')
    }
  }

  async assertUniqueVersion(projectId: string, versionNo: string, excludeId?: string) {
    const existed = await this.prisma.bugProjectVersion.findFirst({
      where: { projectId: BigInt(projectId), versionNo, delFlag: '0' },
    })
    if (existed && String(existed.versionId) !== excludeId) {
      throw new BusinessException(ErrorCode.BUG_PROJECT_EXISTS, '版本号已存在')
    }
  }
}

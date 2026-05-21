import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { QueryConfigDto } from './dto/query-config.dto'
import { CreateConfigDto } from './dto/create-config.dto'
import { UpdateConfigDto } from './dto/update-config.dto'
import { Prisma } from '@prisma/client'
import { resolveSortDirection } from '../../common/utils/sort-order.util'
import { LoggerService } from '../../common/logger/logger.service'

@Injectable()
export class ConfigService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async findAll(query: QueryConfigDto) {
    const where: Prisma.SysConfigWhereInput = {}
    if (query.configName) where.configName = { contains: query.configName }
    if (query.configKey) where.configKey = { contains: query.configKey }
    if (query.configType) where.configType = query.configType
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.sysConfig.count({ where }),
      this.prisma.sysConfig.findMany({
        where,
        skip: Number((pageNum - 1) * pageSize),
        take: Number(pageSize),
        orderBy: this.buildOrderBy(query),
      }),
    ])
    return { total, rows }
  }

  private buildOrderBy(query: QueryConfigDto): Prisma.SysConfigOrderByWithRelationInput[] {
    const direction = resolveSortDirection(query.sortOrder)
    const sortMap: Record<string, Prisma.SysConfigOrderByWithRelationInput> = {
      configId: { configId: direction },
      configName: { configName: direction },
      configKey: { configKey: direction },
      configType: { configType: direction },
      createTime: { createTime: direction },
    }
    if (direction && query.sortBy && sortMap[query.sortBy]) return [sortMap[query.sortBy], { configId: 'asc' }]
    return [{ configId: 'asc' }]
  }

  async findOne(configId: string) {
    return this.prisma.sysConfig.findUnique({
      where: { configId: BigInt(configId) },
    })
  }

  async create(dto: CreateConfigDto) {
    this.logger.log(`创建系统参数: ${dto.configName} (${dto.configKey})`, 'ConfigService')

    const exist = await this.prisma.sysConfig.findFirst({
      where: { configKey: dto.configKey },
    })
    if (exist) {
      this.logger.warn(`创建参数失败,键已存在: ${dto.configKey}`, 'ConfigService')
      throw new BadRequestException('参数键已存在')
    }

    const result = await this.prisma.sysConfig.create({
      data: { ...dto, createTime: new Date() },
    })

    this.logger.log(
      `系统参数创建成功: ${result.configName} (ID: ${result.configId})`,
      'ConfigService',
    )
    return result
  }

  async update(configId: string, dto: UpdateConfigDto) {
    this.logger.log(`更新系统参数: ${configId}`, 'ConfigService')

    const config = await this.findOne(configId)
    if (!config) {
      this.logger.warn(`更新参数失败,参数不存在: ${configId}`, 'ConfigService')
      throw new BadRequestException('参数不存在')
    }

    const result = await this.prisma.sysConfig.update({
      where: { configId: BigInt(configId) },
      data: { ...dto, updateTime: new Date() },
    })

    this.logger.log(
      `系统参数更新成功: ${result.configName} (${result.configKey}=${result.configValue})`,
      'ConfigService',
    )
    return result
  }

  async remove(configIds: string[]) {
    this.logger.log(`删除系统参数: ${configIds.length} 个`, 'ConfigService')

    await this.prisma.sysConfig.deleteMany({
      where: { configId: { in: configIds.map((id) => BigInt(id)) } },
    })

    this.logger.log(`系统参数删除成功: ${configIds.length} 个`, 'ConfigService')
    return {}
  }

  async refreshCache() {
    this.logger.log('刷新系统参数缓存', 'ConfigService')
    await Promise.resolve()
    this.logger.log('系统参数缓存刷新成功', 'ConfigService')
    return {}
  }

  /**
   * 根据配置键获取配置值
   */
  async getConfigValue(configKey: string): Promise<string | null> {
    const config = await this.prisma.sysConfig.findFirst({
      where: { configKey },
    })
    return config?.configValue ?? null
  }

  /**
   * 获取初始密码配置
   */
  async getInitPassword(): Promise<string> {
    const password = await this.getConfigValue('sys.account.initPassword')
    return password || 'admin123'
  }

  /**
   * 获取上传配置
   */
  async getUploadConfig(): Promise<{
    editorImageMaxSize: number
    editorVideoMaxSize: number
    avatarMaxSize: number
    systemMaxSize: number
  }> {
    const configs = await this.prisma.sysConfig.findMany({
      where: {
        configKey: {
          in: [
            'sys.upload.editor.imageMaxSize',
            'sys.upload.editor.videoMaxSize',
            'sys.upload.avatar.maxSize',
            'sys.upload.system.maxSize',
          ],
        },
      },
    })

    const configMap: Record<string, string> = {}
    configs.forEach((c) => {
      if (c.configKey) {
        configMap[c.configKey] = c.configValue ?? ''
      }
    })

    return {
      editorImageMaxSize: parseInt(configMap['sys.upload.editor.imageMaxSize'] || '5', 10),
      editorVideoMaxSize: parseInt(configMap['sys.upload.editor.videoMaxSize'] || '50', 10),
      avatarMaxSize: parseInt(configMap['sys.upload.avatar.maxSize'] || '2', 10),
      systemMaxSize: parseInt(configMap['sys.upload.system.maxSize'] || '2', 10),
    }
  }

  /**
   * 获取网站公开配置（无需登录）
   */
  async getSiteConfig(): Promise<{
    name: string
    description: string
    logo: string
    favicon: string
    copyright: string
    icp: string
    loginPath: string
    requestTimeout: number
    uploadTimeout: number
  }> {
    const configs = await this.prisma.sysConfig.findMany({
      where: {
        configKey: {
          in: [
            'sys.app.name',
            'sys.app.description',
            'sys.app.logo',
            'sys.app.favicon',
            'sys.app.copyright',
            'sys.app.icp',
            'sys.security.loginPath',
            'sys.request.timeout',
            'sys.request.uploadTimeout',
          ],
        },
      },
    })

    const configMap: Record<string, string> = {}
    configs.forEach((c) => {
      if (c.configKey) {
        configMap[c.configKey] = c.configValue ?? ''
      }
    })

    return {
      name: configMap['sys.app.name'] || 'RBAC Admin Pro',
      description: configMap['sys.app.description'] || '企业级权限管理系统',
      logo: configMap['sys.app.logo'] || '',
      favicon: configMap['sys.app.favicon'] || '',
      copyright: configMap['sys.app.copyright'] || '© 2025 RBAC Admin Pro. All rights reserved.',
      icp: configMap['sys.app.icp'] || '',
      loginPath: configMap['sys.security.loginPath'] || '/login',
      requestTimeout: parseInt(configMap['sys.request.timeout'] || '10', 10),
      uploadTimeout: parseInt(configMap['sys.request.uploadTimeout'] || '30', 10),
    }
  }
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../../common/logger/logger.service'
import { BusinessException } from '../../common/exceptions'
import { QueryWorkspaceConfigDto } from './dto/query-workspace-config.dto'
import { CreateWorkspaceConfigDto } from './dto/create-workspace-config.dto'
import { UpdateWorkspaceConfigDto } from './dto/update-workspace-config.dto'
import { expandEquivalentRoleKeys, isLegacyBusinessRole } from '../../common/security/role-level.config'
import { resolveSortDirection } from '../../common/utils/sort-order.util'

export interface WorkspaceConfigRow {
  configId: bigint
  roleKey: string
  roleName: string | null
  defaultPath: string
  dashboardPath: string | null
  defaultOpenMenu: string | null
  menuScope: string
  status: string
  remark: string | null
  createTime: Date | null
  updateTime: Date | null
}

export type WorkspaceConfigVo = Omit<WorkspaceConfigRow, 'configId'> & { configId: string }

@Injectable()
export class WorkspaceConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findAll(query: QueryWorkspaceConfigDto, maxSecurityLevel?: number) {
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const offset = (pageNum - 1) * pageSize
    const where = this.buildWhere(query, maxSecurityLevel)
    const rows = await this.prisma.$queryRawUnsafe<WorkspaceConfigRow[]>(
      `${this.selectSql()} ${where.sql} ${this.buildOrderBy(query)} limit $${where.params.length + 1} offset $${where.params.length + 2}`,
      ...where.params,
      pageSize,
      offset,
    )
    const totalRows = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `select count(*)::bigint as count from sys_role_workspace_config c ${where.sql}`,
      ...where.params,
    )
    return { total: Number(totalRows[0]?.count ?? 0), rows: rows.map((row) => this.toVo(row)) }
  }

  async roleOptions(maxSecurityLevel?: number) {
    return this.prisma.sysRole.findMany({
      where: {
        delFlag: '0',
        status: '0',
        ...(maxSecurityLevel !== undefined ? { securityLevel: { lte: maxSecurityLevel } } : {}),
      },
      orderBy: [{ roleSort: 'asc' }, { roleId: 'asc' }],
      select: { roleId: true, roleName: true, roleKey: true },
    })
  }

  async menuOptions() {
    const menus = await this.prisma.sysMenu.findMany({
      where: { menuType: { in: ['M', 'C'] }, visible: '0', status: '0' },
      orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }, { menuId: 'asc' }],
      select: { menuId: true, parentId: true, menuName: true, path: true, menuType: true },
    })
    const menuMap = new Map(menus.map((item) => [item.menuId.toString(), item]))
    return menus.map((item) => ({
      menuId: item.menuId.toString(),
      parentId: item.parentId?.toString() ?? null,
      menuName: item.menuName,
      menuType: item.menuType,
      path: this.fullMenuPath(item, menuMap),
    }))
  }

  async findOne(configId: string, maxSecurityLevel?: number) {
    const rows = await this.prisma.$queryRawUnsafe<WorkspaceConfigRow[]>(
      `${this.selectSql()} where c.config_id = $1 ${this.securitySql(maxSecurityLevel, 2)} limit 1`,
      BigInt(configId),
      ...(maxSecurityLevel !== undefined ? [maxSecurityLevel] : []),
    )
    if (!rows[0]) throw BusinessException.notFound('工作台配置不存在')
    return this.toVo(rows[0])
  }

  async resolveForUser(userId: string) {
    const roles = await this.prisma.sysUserRole.findMany({
      where: { userId: BigInt(userId), role: { delFlag: '0', status: '0' } },
      include: { role: true },
      orderBy: { role: { roleSort: 'asc' } },
    })
    const roleKeys = roles
      .filter((item) => item.role.delFlag === '0' && item.role.status === '0' && !isLegacyBusinessRole(item.role.roleKey))
      .map((item) => item.role.roleKey)
    if (roleKeys.length === 0) return this.defaultConfig()
    const effectiveRoleKeys = expandEquivalentRoleKeys(roleKeys)
    const rows = await this.prisma.$queryRawUnsafe<WorkspaceConfigRow[]>(
      `${this.selectSql()} where c.status = '0' and c.role_key = any($1) order by c.config_id asc`,
      effectiveRoleKeys,
    )
    const config = this.pickConfig(effectiveRoleKeys, rows)
    return this.toClientVo(config ?? this.defaultConfig())
  }

  async create(dto: CreateWorkspaceConfigDto) {
    await this.assertRoleExists(dto.roleKey)
    const existed = await this.findByRoleKey(dto.roleKey)
    if (existed) throw BusinessException.alreadyExists('该角色已存在工作台配置')
    const rows = await this.prisma.$queryRawUnsafe<WorkspaceConfigRow[]>(
      `insert into sys_role_workspace_config
       (role_key, default_path, dashboard_path, default_open_menu, menu_scope, status, remark, create_time, update_time)
       values ($1, $2, $3, $4, $5, $6, $7, now(), now()) returning config_id as "configId"`,
      dto.roleKey,
      dto.defaultPath,
      dto.dashboardPath || null,
      dto.defaultOpenMenu || null,
      dto.menuScope || 'all',
      dto.status || '0',
      dto.remark || null,
    )
    this.logger.log(`创建工作台配置: ${dto.roleKey}`, 'WorkspaceConfigService')
    return this.findOne(rows[0].configId.toString())
  }

  async update(configId: string, dto: UpdateWorkspaceConfigDto, current?: WorkspaceConfigVo) {
    current = current ?? await this.findOne(configId)
    const nextRoleKey = dto.roleKey ?? current.roleKey
    await this.assertRoleExists(nextRoleKey)
    const existed = await this.findByRoleKey(nextRoleKey)
    if (existed && existed.configId.toString() !== configId) {
      throw BusinessException.alreadyExists('该角色已存在工作台配置')
    }
    await this.prisma.$executeRawUnsafe(
      `update sys_role_workspace_config set
       role_key = $1,
       default_path = $2,
       dashboard_path = $3,
       default_open_menu = $4,
       menu_scope = $5,
       status = $6,
       remark = $7,
       update_time = now()
       where config_id = $8`,
      nextRoleKey,
      dto.defaultPath ?? current.defaultPath,
      dto.dashboardPath ?? current.dashboardPath ?? null,
      dto.defaultOpenMenu ?? current.defaultOpenMenu ?? null,
      dto.menuScope ?? current.menuScope,
      dto.status ?? current.status,
      dto.remark ?? current.remark ?? null,
      BigInt(configId),
    )
    this.logger.log(`更新工作台配置: ${configId}`, 'WorkspaceConfigService')
    return this.findOne(configId)
  }

  async remove(configIds: string[]) {
    await this.prisma.$executeRawUnsafe(
      `delete from sys_role_workspace_config where config_id = any($1)`,
      configIds.map((id) => BigInt(id)),
    )
    this.logger.log(`删除工作台配置: ${configIds.length} 个`, 'WorkspaceConfigService')
    return {}
  }

  private selectSql() {
    return `select c.config_id as "configId",
      c.role_key as "roleKey",
      r.role_name as "roleName",
      c.default_path as "defaultPath",
      c.dashboard_path as "dashboardPath",
      c.default_open_menu as "defaultOpenMenu",
      c.menu_scope as "menuScope",
      c.status,
      c.remark,
      c.create_time as "createTime",
      c.update_time as "updateTime"
      from sys_role_workspace_config c
      left join sys_role r on r.role_key = c.role_key and r.del_flag = '0'`
  }

  private buildWhere(query: QueryWorkspaceConfigDto, maxSecurityLevel?: number) {
    const conditions: string[] = []
    const params: unknown[] = []
    if (query.roleKey) {
      params.push(`%${query.roleKey}%`)
      conditions.push(`c.role_key like $${params.length}`)
    }
    if (query.status) {
      params.push(query.status)
      conditions.push(`c.status = $${params.length}`)
    }
    if (maxSecurityLevel !== undefined) {
      params.push(maxSecurityLevel)
      conditions.push(`coalesce(r.security_level, 0) <= $${params.length}`)
    }
    return { sql: conditions.length ? `where ${conditions.join(' and ')}` : '', params }
  }

  private securitySql(maxSecurityLevel: number | undefined, paramIndex: number) {
    return maxSecurityLevel === undefined ? '' : `and coalesce(r.security_level, 0) <= $${paramIndex}`
  }

  private buildOrderBy(query: QueryWorkspaceConfigDto) {
    const direction = resolveSortDirection(query.sortOrder)
    const sortMap: Record<string, string> = {
      roleKey: 'c.role_key',
      roleName: 'r.role_name',
      defaultPath: 'c.default_path',
      dashboardPath: 'c.dashboard_path',
      defaultOpenMenu: 'c.default_open_menu',
      menuScope: 'c.menu_scope',
      status: 'c.status',
      createTime: 'c.create_time',
    }
    if (direction && query.sortBy && sortMap[query.sortBy]) {
      return `order by ${sortMap[query.sortBy]} ${direction}, c.config_id asc`
    }
    return 'order by c.config_id asc'
  }

  private async assertRoleExists(roleKey: string) {
    const role = await this.prisma.sysRole.findFirst({ where: { roleKey, delFlag: '0' } })
    if (!role) throw BusinessException.notFound('角色不存在')
  }

  private async findByRoleKey(roleKey: string) {
    const rows = await this.prisma.$queryRawUnsafe<WorkspaceConfigRow[]>(
      `${this.selectSql()} where c.role_key = $1 limit 1`,
      roleKey,
    )
    return rows[0]
  }

  private pickConfig(roleKeys: string[], configs: WorkspaceConfigRow[]) {
    if (roleKeys.includes('admin')) {
      return configs.find((item) => item.roleKey === 'admin') ?? this.defaultConfig()
    }
    for (const roleKey of roleKeys) {
      const config = configs.find((item) => item.roleKey === roleKey)
      if (config) return config
    }
    return undefined
  }

  private defaultConfig(): WorkspaceConfigRow {
    return {
      configId: 0n,
      roleKey: 'default',
      roleName: '默认配置',
      defaultPath: '/dashboard',
      dashboardPath: '/dashboard',
      defaultOpenMenu: null,
      menuScope: 'all',
      status: '0',
      remark: null,
      createTime: null,
      updateTime: null,
    }
  }

  private fullMenuPath(
    menu: { menuId: bigint; parentId: bigint | null; path: string | null },
    menuMap: Map<string, { menuId: bigint; parentId: bigint | null; path: string | null }>,
  ): string {
    if (!menu.parentId) return this.normalizeMenuPath(menu.path || '')
    const parent = menuMap.get(menu.parentId.toString())
    const parentPath: string = parent ? this.fullMenuPath(parent, menuMap) : ''
    const child = menu.path || ''
    return child.startsWith('/') ? child : `${parentPath}/${child}`
  }

  private normalizeMenuPath(path: string) {
    return path.startsWith('/') ? path : `/${path}`
  }


  private toVo(row: WorkspaceConfigRow) {
    return { ...row, configId: row.configId.toString() }
  }

  private toClientVo(row: WorkspaceConfigRow) {
    const vo = this.toVo(row)
    return {
      defaultPath: vo.defaultPath,
      dashboardPath: vo.dashboardPath || vo.defaultPath,
      defaultOpenMenu: vo.defaultOpenMenu,
      menuScope: vo.menuScope,
      roleKey: vo.roleKey,
      roleName: vo.roleName,
    }
  }
}

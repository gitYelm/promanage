import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { SysMenu, Prisma } from '@prisma/client'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { QueryMenuDto } from './dto/query-menu.dto'
import { LoggerService } from '../../common/logger/logger.service'

// 扩展 SysMenu 类型以包含 children
export type SysMenuWithChildren = SysMenu & {
  children?: SysMenuWithChildren[]
}

export interface RouterVo {
  name: string
  path: string
  hidden: boolean
  redirect?: string
  component: string
  alwaysShow?: boolean
  meta: {
    title: string
    icon: string
    noCache: boolean
    link: string | null
  }
  children?: RouterVo[]
}

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * 查询菜单列表
   */
  async findAll(query: QueryMenuDto) {
    const { menuName, status } = query
    const where: Prisma.SysMenuWhereInput = {}

    if (menuName) {
      where.menuName = { contains: menuName }
    }
    if (status) {
      where.status = status
    }

    const menus = await this.prisma.sysMenu.findMany({
      where,
      orderBy: { orderNum: 'asc' },
    })

    return menus
  }

  /**
   * 查询菜单详情
   */
  async findOne(menuId: string) {
    return this.prisma.sysMenu.findUnique({
      where: { menuId: BigInt(menuId) },
    })
  }

  /**
   * 新增菜单
   */
  async create(createMenuDto: CreateMenuDto) {
    this.logger.log(`创建菜单: ${createMenuDto.menuName}`, 'MenuService')

    const { parentId, ...rest } = createMenuDto
    const result = await this.prisma.sysMenu.create({
      data: {
        ...rest,
        parentId: parentId ? BigInt(parentId) : null,
        createTime: new Date(),
      },
    })

    this.logger.log(`菜单创建成功: ${result.menuName} (ID: ${result.menuId})`, 'MenuService')
    return result
  }

  /**
   * 修改菜单
   */
  async update(menuId: string, updateMenuDto: UpdateMenuDto) {
    this.logger.log(`更新菜单: ${menuId}`, 'MenuService')

    const menu = await this.findOne(menuId)
    if (!menu) {
      this.logger.warn(`更新菜单失败,菜单不存在: ${menuId}`, 'MenuService')
      throw new BadRequestException('菜单不存在')
    }

    if (updateMenuDto.parentId && updateMenuDto.parentId === menuId) {
      this.logger.warn(`更新菜单失败,上级菜单不能选择自己: ${menuId}`, 'MenuService')
      throw new BadRequestException('上级菜单不能选择自己')
    }

    const { parentId, ...rest } = updateMenuDto
    const result = await this.prisma.sysMenu.update({
      where: { menuId: BigInt(menuId) },
      data: {
        ...rest,
        ...(parentId !== undefined ? { parentId: parentId ? BigInt(parentId) : null } : {}),
        updateTime: new Date(),
      },
    })

    this.logger.log(`菜单更新成功: ${result.menuName} (ID: ${menuId})`, 'MenuService')
    return result
  }

  /**
   * 删除菜单
   */
  async remove(menuId: string) {
    const menuIdBigInt = BigInt(menuId)
    // 检查是否有子菜单
    const childCount = await this.prisma.sysMenu.count({
      where: { parentId: menuIdBigInt },
    })
    if (childCount > 0) {
      throw new BadRequestException('存在子菜单,不允许删除')
    }

    // 检查是否已分配给角色
    const roleCount = await this.prisma.sysRoleMenu.count({
      where: { menuId: menuIdBigInt },
    })
    if (roleCount > 0) {
      throw new BadRequestException('菜单已分配,不允许删除')
    }

    return this.prisma.sysMenu.delete({
      where: { menuId: menuIdBigInt },
    })
  }

  /**
   * 获取菜单树 (用于下拉选择)
   */
  async listTree(query: QueryMenuDto) {
    const menus = await this.findAll(query)
    return this.handleTree(menus, null)
  }

  /**
   * 根据用户ID获取菜单树
   */
  async getRouters(userId: string): Promise<RouterVo[]> {
    // 1. 获取用户角色
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        roles: {
          include: { role: true },
        },
      },
    })

    if (!user) return []

    const roles = user.roles.map((ur: { role: { roleId: bigint; roleKey: string } }) => ur.role)
    const isAdmin = roles.some((r: { roleId: bigint; roleKey: string }) => r.roleKey === 'admin')

    let menus: SysMenu[] = []

    // 2. 查询菜单数据
    if (isAdmin) {
      // 超级管理员查询所有菜单 (类型为 M和C，排除按钮F)
      menus = await this.prisma.sysMenu.findMany({
        where: {
          menuType: { in: ['M', 'C'] },
          status: '0',
          visible: '0',
        },
        orderBy: { orderNum: 'asc' },
      })
    } else {
      // 普通用户查询关联菜单
      const roleIds = roles.map((r: { roleId: bigint; roleKey: string }) => r.roleId)
      menus = await this.prisma.sysMenu.findMany({
        where: {
          menuType: { in: ['M', 'C'] },
          status: '0',
          visible: '0',
          roles: {
            some: {
              roleId: { in: roleIds },
            },
          },
        },
        orderBy: { orderNum: 'asc' },
      })
    }

    // 3. 转换为树形结构
    const menuTree = this.handleTree(menus, null)

    // 4. 转换为前端路由结构
    return this.buildMenus(menuTree)
  }

  /**
   * 构造树型结构数据
   */
  private handleTree(data: SysMenu[], parentId: bigint | null): SysMenuWithChildren[] {
    const tree: SysMenuWithChildren[] = []
    data.forEach((item) => {
      if (item.parentId === parentId) {
        const children = this.handleTree(data, item.menuId)
        const newItem: SysMenuWithChildren = { ...item }
        if (children.length > 0) {
          newItem.children = children
        }
        tree.push(newItem)
      }
    })
    // 按 orderNum 排序
    return tree.sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0))
  }

  /**
   * 构建前端路由
   */
  private buildMenus(menus: SysMenuWithChildren[]): RouterVo[] {
    const routers: RouterVo[] = []

    menus.forEach((menu) => {
      const children = menu.children?.length ? this.buildMenus(menu.children) : []
      if (menu.menuType === 'M' && children.length === 0) return
      const router: RouterVo = {
        name: this.getRouteName(menu),
        path: this.getRouterPath(menu),
        hidden: menu.visible === '1',
        redirect: menu.menuType === 'M' ? 'noRedirect' : undefined,
        component: this.getComponent(menu),
        meta: {
          title: menu.menuName,
          icon: menu.icon || '#',
          noCache: menu.isCache === 1,
          link: menu.isFrame === 0 ? menu.path : null,
        },
      }

      if (children.length > 0) {
        router.children = children
        // 如果是目录且有子菜单，处理 alwaysShow 逻辑等 (这里简化)
      }

      routers.push(router)
    })

    return routers
  }

  /**
   * 获取路由名称
   */
  private getRouteName(menu: SysMenu): string {
    // 首字母大写
    const path = menu.path || ''
    // 简单处理，实际可能需要更复杂的逻辑
    return path.charAt(0).toUpperCase() + path.slice(1)
  }

  /**
   * 获取路由路径
   */
  private getRouterPath(menu: SysMenu): string {
    let routerPath = menu.path || ''
    // 如果是内链，且不是 http 开头
    if (menu.parentId === null && menu.menuType === 'M' && menu.isFrame === 1) {
      if (!routerPath.startsWith('/')) {
        routerPath = '/' + routerPath
      }
    }
    return routerPath
  }

  /**
   * 获取组件路径
   */
  private getComponent(menu: SysMenu): string {
    let component = 'Layout'
    if (menu.component && menu.component.length > 0 && menu.component !== 'Layout') {
      component = menu.component
    } else if (menu.component === 'Layout') {
      component = 'Layout'
    } else if (menu.parentId !== null && menu.menuType === 'M') {
      // 二级目录
      component = 'ParentView'
    }
    return component
  }

  /**
   * 修改菜单状态
   */
  async changeStatus(menuId: string, status: string) {
    this.logger.log(`切换菜单状态: ${menuId} -> ${status}`, 'MenuService')

    const menu = await this.findOne(menuId)
    if (!menu) {
      throw new BadRequestException('菜单不存在')
    }

    await this.prisma.sysMenu.update({
      where: { menuId: BigInt(menuId) },
      data: { status, updateTime: new Date() },
    })

    return {}
  }
}

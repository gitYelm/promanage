import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'
import Redis from 'ioredis'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

/**
 * 清除 Redis 中的用户状态缓存
 * 避免重新初始化数据后，旧的无效标记导致无法登录
 */
async function clearUserStatusCache() {
  const redisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true'
  if (!redisEnabled) {
    console.log('Redis disabled, skip clearing user status cache')
    return
  }

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  const redis = new Redis(redisUrl)

  try {
    // 清除所有用户状态缓存
    const invalidKeys = await redis.keys('auth:invalid_users:*')
    const validKeys = await redis.keys('auth:valid_users:*')
    const allKeys = [...invalidKeys, ...validKeys]

    if (allKeys.length > 0) {
      await redis.del(...allKeys)
      console.log(`Cleared ${allKeys.length} user status cache keys`)
    } else {
      console.log('No user status cache to clear')
    }
  } catch (error) {
    console.warn(`Failed to clear user status cache: ${(error as Error).message}`)
  } finally {
    redis.disconnect()
  }
}

async function main() {
  console.log('Start seeding ...')

  // 清除用户状态缓存
  await clearUserStatusCache()

  // 1. Init Dept (层级结构)
  const ensureDept = async (data: {
    deptName: string
    orderNum?: number
    status?: '0' | '1'
    parentId?: bigint | null
    leader?: string
    phone?: string
    email?: string
  }) => {
    const existed = await prisma.sysDept.findFirst({
      where: { deptName: data.deptName, delFlag: '0' },
    })
    let ancestors = '0'
    if (data.parentId) {
      const parent = await prisma.sysDept.findUnique({
        where: { deptId: data.parentId },
      })
      if (parent) {
        ancestors = `${parent.ancestors || '0'},${data.parentId}`
      }
    }
    if (existed) {
      return prisma.sysDept.update({
        where: { deptId: existed.deptId },
        data: {
          ...data,
          ancestors,
        },
      })
    }
    return prisma.sysDept.create({
      data: {
        deptName: data.deptName,
        orderNum: data.orderNum ?? 0,
        status: data.status ?? '0',
        parentId: data.parentId ?? null,
        leader: data.leader ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        ancestors,
      },
    })
  }

  const rootDept = await ensureDept({
    deptName: '总公司',
    orderNum: 0,
    status: '0',
    parentId: null,
    leader: '张总',
  })
  const techDept = await ensureDept({
    deptName: '技术部',
    orderNum: 1,
    parentId: rootDept.deptId,
    leader: '李工',
  })
  const devDept = await ensureDept({
    deptName: '研发一部',
    orderNum: 2,
    parentId: techDept.deptId,
    leader: '王工',
  })
  const testDept = await ensureDept({
    deptName: '测试一部',
    orderNum: 3,
    parentId: techDept.deptId,
    leader: '赵工',
  })
  await ensureDept({
    deptName: '人事部',
    orderNum: 4,
    parentId: rootDept.deptId,
    leader: '刘姐',
  })
  await ensureDept({
    deptName: '财务部',
    orderNum: 5,
    parentId: rootDept.deptId,
    leader: '钱会',
  })
  const eastBranch = await ensureDept({
    deptName: '华东分公司',
    orderNum: 6,
    parentId: rootDept.deptId,
    leader: '孙总',
  })
  await ensureDept({
    deptName: '上海办事处',
    orderNum: 7,
    parentId: eastBranch.deptId,
    leader: '周主任',
  })
  await ensureDept({
    deptName: '杭州办事处',
    orderNum: 8,
    parentId: eastBranch.deptId,
    leader: '吴主任',
  })
  console.log('Initialized department hierarchy')

  // 2. Init Roles (管理后台角色体系 - 幂等,所有角色启用状态)
  const ensureRole = async (data: {
    roleKey: string
    roleName: string
    roleSort: number
    status?: '0' | '1'
    dataScope?: '1' | '2' | '3' | '4'
    menuCheckStrictly?: boolean
    deptCheckStrictly?: boolean
    remark?: string
  }) => {
    const existed = await prisma.sysRole.findFirst({
      where: { roleKey: data.roleKey, delFlag: '0' },
    })
    if (existed) {
      return prisma.sysRole.update({
        where: { roleId: existed.roleId },
        data: {
          roleName: data.roleName,
          roleSort: data.roleSort,
          status: data.status ?? '0',
          dataScope: data.dataScope ?? '1',
          menuCheckStrictly: data.menuCheckStrictly ?? true,
          deptCheckStrictly: data.deptCheckStrictly ?? true,
          remark: data.remark,
        },
      })
    }
    return prisma.sysRole.create({
      data: {
        roleName: data.roleName,
        roleKey: data.roleKey,
        roleSort: data.roleSort,
        status: data.status ?? '0',
        dataScope: data.dataScope ?? '1',
        menuCheckStrictly: data.menuCheckStrictly ?? true,
        deptCheckStrictly: data.deptCheckStrictly ?? true,
        remark: data.remark,
      },
    })
  }

  const adminRole = await ensureRole({
    roleKey: 'admin',
    roleName: '超级管理员',
    roleSort: 1,
    status: '0',
    dataScope: '1',
    remark: '拥有系统所有权限',
  })
  console.log(`Ensured admin role with id: ${adminRole.roleId}`)

  const systemAdminRole = await ensureRole({
    roleKey: 'system_admin',
    roleName: '系统管理员',
    roleSort: 2,
    status: '0',
    dataScope: '2',
    remark: '负责系统管理模块',
  })

  const monitorAdminRole = await ensureRole({
    roleKey: 'monitor_admin',
    roleName: '监控管理员',
    roleSort: 3,
    status: '0',
    dataScope: '1',
    remark: '负责系统监控模块',
  })

  const commonUserRole = await ensureRole({
    roleKey: 'common_user',
    roleName: '普通用户',
    roleSort: 4,
    status: '0',
    dataScope: '3',
    remark: '只读权限,无增删改权限',
  })
  console.log('Ensured all admin roles')

  // 3. 初始化用户（使用 bcrypt 加密密码，保持与服务层一致 - 幂等）
  const ensureUser = async (data: {
    userName: string
    nickName: string
    password: string
    deptId: bigint
    status?: '0' | '1'
    email?: string
    phonenumber?: string
    sex?: '0' | '1' | '2'
    remark?: string
  }) => {
    const existed = await prisma.sysUser.findFirst({
      where: { userName: data.userName, delFlag: '0' },
    })
    if (existed) {
      // 存在则更新(但不更新密码,避免覆盖用户修改的密码)
      return prisma.sysUser.update({
        where: { userId: existed.userId },
        data: {
          nickName: data.nickName,
          deptId: data.deptId,
          status: data.status ?? '0',
          email: data.email,
          phonenumber: data.phonenumber,
          sex: data.sex,
          remark: data.remark,
        },
      })
    }
    return prisma.sysUser.create({
      data: {
        userName: data.userName,
        nickName: data.nickName,
        password: data.password,
        status: data.status ?? '0',
        deptId: data.deptId,
        email: data.email,
        phonenumber: data.phonenumber,
        sex: data.sex,
        remark: data.remark,
      },
    })
  }

  const salt = await bcrypt.genSalt(10)
  // 默认密码与文档保持一致
  const hashedPassword = await bcrypt.hash('admin123', salt)

  const adminUser = await ensureUser({
    userName: 'admin',
    nickName: '超级管理员',
    password: hashedPassword,
    deptId: rootDept.deptId,
    email: 'admin@example.com',
    phonenumber: '13800000000',
    sex: '0',
    remark: '系统超级管理员账号',
  })
  console.log(`Ensured admin user with id: ${adminUser.userId}`)

  const systemAdminUser = await ensureUser({
    userName: 'system_admin',
    nickName: '系统管理员',
    password: hashedPassword,
    deptId: techDept.deptId,
    email: 'system@example.com',
    phonenumber: '13800000001',
    sex: '0',
    remark: '负责系统管理',
  })

  const monitorAdminUser = await ensureUser({
    userName: 'monitor_admin',
    nickName: '监控管理员',
    password: hashedPassword,
    deptId: devDept.deptId,
    email: 'monitor@example.com',
    phonenumber: '13800000002',
    sex: '1',
    remark: '负责系统监控',
  })

  const commonUser = await ensureUser({
    userName: 'user',
    nickName: '普通用户',
    password: hashedPassword,
    deptId: testDept.deptId,
    email: 'user@example.com',
    phonenumber: '13800000003',
    sex: '1',
    remark: '普通用户账号',
  })
  console.log('Ensured all users')

  // 4. Link User and Role (幂等)
  const ensureUserRole = async (userId: bigint, roleId: bigint) => {
    const existed = await prisma.sysUserRole.findFirst({
      where: { userId, roleId },
    })
    if (!existed) {
      await prisma.sysUserRole.create({
        data: { userId, roleId },
      })
    }
  }

  await ensureUserRole(adminUser.userId, adminRole.roleId)
  await ensureUserRole(systemAdminUser.userId, systemAdminRole.roleId)
  await ensureUserRole(monitorAdminUser.userId, monitorAdminRole.roleId)
  await ensureUserRole(commonUser.userId, commonUserRole.roleId)
  console.log('Linked all users and roles')

  // 5. 初始化基础菜单（存在则跳过，避免重复）
  const ensureMenu = async (data: {
    menuName: string
    path: string
    component: string
    orderNum: number
    menuType: 'M' | 'C' | 'F'
    visible?: '0' | '1'
    status?: '0' | '1'
    icon?: string
    isFrame?: number
    parentId?: bigint | null
    perms?: string | null
  }) => {
    const existed = await prisma.sysMenu.findFirst({
      where: { path: data.path },
    })
    if (existed) {
      return prisma.sysMenu.update({ where: { menuId: existed.menuId }, data })
    }
    return prisma.sysMenu.create({ data })
  }

  const ensureButton = async (data: {
    menuName: string
    parentId: bigint
    perms: string
    orderNum?: number
  }) => {
    const existed = await prisma.sysMenu.findFirst({
      where: { perms: data.perms },
    })
    if (existed) return existed
    return prisma.sysMenu.create({
      data: {
        menuName: data.menuName,
        parentId: data.parentId,
        orderNum: data.orderNum ?? 0,
        menuType: 'F',
        visible: '1',
        status: '0',
        perms: data.perms,
        isFrame: 1,
        path: '',
        icon: '#',
      },
    })
  }

  const getMenuByPath = async (parentId: bigint, path: string) => {
    return prisma.sysMenu.findFirst({
      where: { parentId, path },
    })
  }

  const systemDir = await ensureMenu({
    menuName: '系统管理',
    path: 'system',
    component: 'Layout',
    orderNum: 1,
    menuType: 'M',
    visible: '0',
    status: '0',
    icon: 'settings',
    isFrame: 1,
    parentId: null,
  })
  await ensureMenu({
    menuName: '用户管理',
    parentId: systemDir.menuId,
    path: 'user',
    component: 'system/user/index',
    orderNum: 1,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'system:user:list',
    icon: 'user',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '角色管理',
    parentId: systemDir.menuId,
    path: 'role',
    component: 'system/role/index',
    orderNum: 2,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'system:role:list',
    icon: 'users',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '菜单管理',
    parentId: systemDir.menuId,
    path: 'menu',
    component: 'system/menu/index',
    orderNum: 3,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'system:menu:list',
    icon: 'menu',
    isFrame: 1,
  })

  // system: 其余模块补充
  await ensureMenu({
    menuName: '部门管理',
    parentId: systemDir.menuId,
    path: 'dept',
    component: 'system/dept/index',
    orderNum: 4,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'system:dept:list',
    icon: 'building-2',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '岗位管理',
    parentId: systemDir.menuId,
    path: 'post',
    component: 'system/post/index',
    orderNum: 5,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'system:post:list',
    icon: 'badge-check',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '字典管理',
    parentId: systemDir.menuId,
    path: 'dict',
    component: 'system/dict/index',
    orderNum: 6,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'system:dict:list',
    icon: 'book-a',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '参数设置',
    parentId: systemDir.menuId,
    path: 'config',
    component: 'system/config/index',
    orderNum: 7,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'system:config:list',
    icon: 'settings-2',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '系统设置',
    parentId: systemDir.menuId,
    path: 'setting',
    component: 'system/setting/index',
    orderNum: 8,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'system:setting:view',
    icon: 'sliders-vertical',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '通知公告',
    parentId: systemDir.menuId,
    path: 'notice',
    component: 'system/notice/index',
    orderNum: 9,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'system:notice:list',
    icon: 'megaphone',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '更新日志',
    parentId: systemDir.menuId,
    path: 'changelog',
    component: 'system/changelog/index',
    orderNum: 10,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: null,
    icon: 'scroll-text',
    isFrame: 1,
  })

  const monitorDir = await ensureMenu({
    menuName: '系统监控',
    path: 'monitor',
    component: 'Layout',
    orderNum: 2,
    menuType: 'M',
    visible: '0',
    status: '0',
    icon: 'monitor',
    isFrame: 1,
    parentId: null,
  })
  await ensureMenu({
    menuName: '在线用户',
    parentId: monitorDir.menuId,
    path: 'online',
    component: 'monitor/online/index',
    orderNum: 1,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'monitor:online:list',
    icon: 'user-check',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '操作日志',
    parentId: monitorDir.menuId,
    path: 'operlog',
    component: 'monitor/operlog/index',
    orderNum: 2,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'monitor:operlog:list',
    icon: 'list',
    isFrame: 1,
  })

  // monitor: 其余模块补充
  await ensureMenu({
    menuName: '登录日志',
    parentId: monitorDir.menuId,
    path: 'logininfor',
    component: 'monitor/logininfor/index',
    orderNum: 3,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'monitor:logininfor:list',
    icon: 'log-in',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '定时任务',
    parentId: monitorDir.menuId,
    path: 'job',
    component: 'monitor/job/index',
    orderNum: 4,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'monitor:job:list',
    icon: 'alarm-clock',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '服务监控',
    parentId: monitorDir.menuId,
    path: 'server',
    component: 'monitor/server/index',
    orderNum: 5,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'monitor:server:list',
    icon: 'server',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '缓存监控',
    parentId: monitorDir.menuId,
    path: 'cache',
    component: 'monitor/cache/index',
    orderNum: 6,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'monitor:cache:view',
    icon: 'database-backup',
    isFrame: 1,
  })
  await ensureMenu({
    menuName: '数据监控',
    parentId: monitorDir.menuId,
    path: 'druid',
    component: 'monitor/druid/index',
    orderNum: 7,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'monitor:druid:view',
    icon: 'database',
    isFrame: 1,
  })

  const toolDir = await ensureMenu({
    menuName: '系统工具',
    path: 'tool',
    component: 'Layout',
    orderNum: 3,
    menuType: 'M',
    visible: '0',
    status: '0',
    icon: 'wrench',
    isFrame: 1,
    parentId: null,
  })
  await ensureMenu({
    menuName: '接口文档',
    parentId: toolDir.menuId,
    path: 'apidoc',
    component: 'tool/swagger/index',
    orderNum: 2,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'tool:apidoc:view',
    icon: 'file-text',
    isFrame: 1,
  })

  // tool: 其余模块补充
  await ensureMenu({
    menuName: '表单构建',
    parentId: toolDir.menuId,
    path: 'build',
    component: 'tool/build/index',
    orderNum: 3,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: 'tool:build:view',
    icon: 'factory',
    isFrame: 1,
  })

  // 按钮权限补充（F）
  const userMenu = await getMenuByPath(systemDir.menuId, 'user')
  if (userMenu) {
    await ensureButton({
      menuName: '用户查询',
      parentId: userMenu.menuId,
      perms: 'system:user:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '用户新增',
      parentId: userMenu.menuId,
      perms: 'system:user:add',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '用户修改',
      parentId: userMenu.menuId,
      perms: 'system:user:edit',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '用户删除',
      parentId: userMenu.menuId,
      perms: 'system:user:remove',
      orderNum: 4,
    })
    await ensureButton({
      menuName: '重置密码',
      parentId: userMenu.menuId,
      perms: 'system:user:resetPwd',
      orderNum: 5,
    })
    await ensureButton({
      menuName: '用户导出',
      parentId: userMenu.menuId,
      perms: 'system:user:export',
      orderNum: 6,
    })
    await ensureButton({
      menuName: '用户导入',
      parentId: userMenu.menuId,
      perms: 'system:user:import',
      orderNum: 7,
    })
  }
  const roleMenu = await getMenuByPath(systemDir.menuId, 'role')
  if (roleMenu) {
    await ensureButton({
      menuName: '角色查询',
      parentId: roleMenu.menuId,
      perms: 'system:role:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '角色新增',
      parentId: roleMenu.menuId,
      perms: 'system:role:add',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '角色修改',
      parentId: roleMenu.menuId,
      perms: 'system:role:edit',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '角色删除',
      parentId: roleMenu.menuId,
      perms: 'system:role:remove',
      orderNum: 4,
    })
  }
  const menuMenu = await getMenuByPath(systemDir.menuId, 'menu')
  if (menuMenu) {
    await ensureButton({
      menuName: '菜单查询',
      parentId: menuMenu.menuId,
      perms: 'system:menu:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '菜单新增',
      parentId: menuMenu.menuId,
      perms: 'system:menu:add',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '菜单修改',
      parentId: menuMenu.menuId,
      perms: 'system:menu:edit',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '菜单删除',
      parentId: menuMenu.menuId,
      perms: 'system:menu:remove',
      orderNum: 4,
    })
  }
  const deptMenu = await getMenuByPath(systemDir.menuId, 'dept')
  if (deptMenu) {
    await ensureButton({
      menuName: '部门查询',
      parentId: deptMenu.menuId,
      perms: 'system:dept:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '部门新增',
      parentId: deptMenu.menuId,
      perms: 'system:dept:add',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '部门修改',
      parentId: deptMenu.menuId,
      perms: 'system:dept:edit',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '部门删除',
      parentId: deptMenu.menuId,
      perms: 'system:dept:remove',
      orderNum: 4,
    })
  }
  const postMenu = await getMenuByPath(systemDir.menuId, 'post')
  if (postMenu) {
    await ensureButton({
      menuName: '岗位查询',
      parentId: postMenu.menuId,
      perms: 'system:post:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '岗位新增',
      parentId: postMenu.menuId,
      perms: 'system:post:add',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '岗位修改',
      parentId: postMenu.menuId,
      perms: 'system:post:edit',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '岗位删除',
      parentId: postMenu.menuId,
      perms: 'system:post:remove',
      orderNum: 4,
    })
  }
  const dictMenu = await getMenuByPath(systemDir.menuId, 'dict')
  if (dictMenu) {
    await ensureButton({
      menuName: '字典查询',
      parentId: dictMenu.menuId,
      perms: 'system:dict:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '字典新增',
      parentId: dictMenu.menuId,
      perms: 'system:dict:add',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '字典修改',
      parentId: dictMenu.menuId,
      perms: 'system:dict:edit',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '字典删除',
      parentId: dictMenu.menuId,
      perms: 'system:dict:remove',
      orderNum: 4,
    })
  }
  const configMenu = await getMenuByPath(systemDir.menuId, 'config')
  if (configMenu) {
    await ensureButton({
      menuName: '参数查询',
      parentId: configMenu.menuId,
      perms: 'system:config:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '参数新增',
      parentId: configMenu.menuId,
      perms: 'system:config:add',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '参数修改',
      parentId: configMenu.menuId,
      perms: 'system:config:edit',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '参数删除',
      parentId: configMenu.menuId,
      perms: 'system:config:remove',
      orderNum: 4,
    })
  }
  const noticeMenu = await getMenuByPath(systemDir.menuId, 'notice')
  if (noticeMenu) {
    await ensureButton({
      menuName: '公告查询',
      parentId: noticeMenu.menuId,
      perms: 'system:notice:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '公告新增',
      parentId: noticeMenu.menuId,
      perms: 'system:notice:add',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '公告修改',
      parentId: noticeMenu.menuId,
      perms: 'system:notice:edit',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '公告删除',
      parentId: noticeMenu.menuId,
      perms: 'system:notice:remove',
      orderNum: 4,
    })
  }

  // 系统设置按钮
  const settingMenu = await getMenuByPath(systemDir.menuId, 'setting')
  if (settingMenu) {
    await ensureButton({
      menuName: '设置修改',
      parentId: settingMenu.menuId,
      perms: 'system:setting:edit',
      orderNum: 1,
    })
  }

  const jobMenu = await getMenuByPath(monitorDir.menuId, 'job')
  if (jobMenu) {
    await ensureButton({
      menuName: '任务查询',
      parentId: jobMenu.menuId,
      perms: 'monitor:job:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '任务新增',
      parentId: jobMenu.menuId,
      perms: 'monitor:job:add',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '任务修改',
      parentId: jobMenu.menuId,
      perms: 'monitor:job:edit',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '任务删除',
      parentId: jobMenu.menuId,
      perms: 'monitor:job:remove',
      orderNum: 4,
    })
    await ensureButton({
      menuName: '状态变更',
      parentId: jobMenu.menuId,
      perms: 'monitor:job:changeStatus',
      orderNum: 5,
    })
    await ensureButton({
      menuName: '立即执行',
      parentId: jobMenu.menuId,
      perms: 'monitor:job:run',
      orderNum: 6,
    })
    await ensureButton({
      menuName: '查看日志',
      parentId: jobMenu.menuId,
      perms: 'monitor:job:log',
      orderNum: 7,
    })
  }
  const cacheMenu = await getMenuByPath(monitorDir.menuId, 'cache')
  if (cacheMenu) {
    await ensureButton({
      menuName: '清理指定',
      parentId: cacheMenu.menuId,
      perms: 'monitor:cache:clearName',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '清理全部',
      parentId: cacheMenu.menuId,
      perms: 'monitor:cache:clearAll',
      orderNum: 2,
    })
  }
  const onlineMenu = await getMenuByPath(monitorDir.menuId, 'online')
  if (onlineMenu) {
    await ensureButton({
      menuName: '用户查询',
      parentId: onlineMenu.menuId,
      perms: 'monitor:online:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '强退用户',
      parentId: onlineMenu.menuId,
      perms: 'monitor:online:forceLogout',
      orderNum: 2,
    })
  }
  const operlogMenu = await getMenuByPath(monitorDir.menuId, 'operlog')
  if (operlogMenu) {
    await ensureButton({
      menuName: '日志查询',
      parentId: operlogMenu.menuId,
      perms: 'monitor:operlog:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '日志删除',
      parentId: operlogMenu.menuId,
      perms: 'monitor:operlog:remove',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '日志导出',
      parentId: operlogMenu.menuId,
      perms: 'monitor:operlog:export',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '日志清空',
      parentId: operlogMenu.menuId,
      perms: 'monitor:operlog:clear',
      orderNum: 4,
    })
  }
  const logininforMenu = await getMenuByPath(monitorDir.menuId, 'logininfor')
  if (logininforMenu) {
    await ensureButton({
      menuName: '日志查询',
      parentId: logininforMenu.menuId,
      perms: 'monitor:logininfor:query',
      orderNum: 1,
    })
    await ensureButton({
      menuName: '日志删除',
      parentId: logininforMenu.menuId,
      perms: 'monitor:logininfor:remove',
      orderNum: 2,
    })
    await ensureButton({
      menuName: '日志导出',
      parentId: logininforMenu.menuId,
      perms: 'monitor:logininfor:export',
      orderNum: 3,
    })
    await ensureButton({
      menuName: '日志清空',
      parentId: logininforMenu.menuId,
      perms: 'monitor:logininfor:clear',
      orderNum: 4,
    })
    await ensureButton({
      menuName: '账户解锁',
      parentId: logininforMenu.menuId,
      perms: 'monitor:logininfor:unlock',
      orderNum: 5,
    })
  }

  // 6. 为不同角色分配菜单权限
  const allMenus = await prisma.sysMenu.findMany({
    select: { menuId: true, path: true, menuType: true, parentId: true },
  })

  if (allMenus.length > 0) {
    // 6.1 超级管理员 - 拥有所有权限
    await prisma.sysRoleMenu.createMany({
      data: allMenus.map((m) => ({
        roleId: adminRole.roleId,
        menuId: m.menuId,
      })),
      skipDuplicates: true,
    })
    console.log(`Linked role(admin) with ${allMenus.length} menus`)

    // 6.2 系统管理员 - 拥有系统管理模块的所有权限
    const systemMenu = allMenus.find((m) => m.path === 'system' && !m.parentId)
    if (systemMenu) {
      const systemMenuIds = allMenus
        .filter(
          (m) =>
            m.menuId === systemMenu.menuId ||
            m.parentId === systemMenu.menuId ||
            allMenus.some(
              (parent) => parent.menuId === m.parentId && parent.parentId === systemMenu.menuId,
            ),
        )
        .map((m) => m.menuId)

      await prisma.sysRoleMenu.createMany({
        data: systemMenuIds.map((menuId) => ({
          roleId: systemAdminRole.roleId,
          menuId,
        })),
        skipDuplicates: true,
      })
      console.log(`Linked role(system_admin) with ${systemMenuIds.length} menus`)
    }

    // 6.3 监控管理员 - 拥有系统监控模块的所有权限
    const monitorMenu = allMenus.find((m) => m.path === 'monitor' && !m.parentId)
    const toolMenu = allMenus.find((m) => m.path === 'tool' && !m.parentId)
    const apidocMenu = allMenus.find((m) => m.path === 'apidoc')

    if (monitorMenu) {
      const monitorMenuIds = allMenus
        .filter(
          (m) =>
            m.menuId === monitorMenu.menuId ||
            m.parentId === monitorMenu.menuId ||
            allMenus.some(
              (parent) => parent.menuId === m.parentId && parent.parentId === monitorMenu.menuId,
            ),
        )
        .map((m) => m.menuId)

      // 添加工具菜单和接口文档
      if (toolMenu) monitorMenuIds.push(toolMenu.menuId)
      if (apidocMenu) monitorMenuIds.push(apidocMenu.menuId)

      await prisma.sysRoleMenu.createMany({
        data: monitorMenuIds.map((menuId) => ({
          roleId: monitorAdminRole.roleId,
          menuId,
        })),
        skipDuplicates: true,
      })
      console.log(`Linked role(monitor_admin) with ${monitorMenuIds.length} menus`)
    }

    // 6.4 普通用户 - 只有查看权限,无增删改权限(只分配C类型菜单,不分配F类型按钮)
    const systemMenu2 = allMenus.find((m) => m.path === 'system' && !m.parentId)
    const monitorMenu2 = allMenus.find((m) => m.path === 'monitor' && !m.parentId)

    const commonUserMenuIds: bigint[] = []
    if (systemMenu2) {
      commonUserMenuIds.push(systemMenu2.menuId)
      // 只添加系统管理下的C类型菜单
      allMenus
        .filter((m) => m.parentId === systemMenu2.menuId && m.menuType === 'C')
        .forEach((m) => commonUserMenuIds.push(m.menuId))
    }
    if (monitorMenu2) {
      commonUserMenuIds.push(monitorMenu2.menuId)
      // 只添加系统监控下的C类型菜单
      allMenus
        .filter((m) => m.parentId === monitorMenu2.menuId && m.menuType === 'C')
        .forEach((m) => commonUserMenuIds.push(m.menuId))
    }

    await prisma.sysRoleMenu.createMany({
      data: commonUserMenuIds.map((menuId) => ({
        roleId: commonUserRole.roleId,
        menuId,
      })),
      skipDuplicates: true,
    })
    console.log(`Linked role(common_user) with ${commonUserMenuIds.length} menus (read-only)`)
  } else {
    console.log('No menus found to link with roles')
  }

  // 7. 初始化常用字典与配置（若不存在则创建）
  const dictTypesToSeed = [
    {
      dictName: '显示隐藏',
      dictType: 'sys_show_hide',
      remark: '控制菜单、按钮等元素的显示状态，0=显示 1=隐藏',
    },
    {
      dictName: '正常停用',
      dictType: 'sys_normal_disable',
      remark: '通用启用/停用状态，用于用户、角色、部门等，0=正常 1=停用',
    },
    {
      dictName: '是否',
      dictType: 'sys_yes_no',
      remark: '通用是否选项，Y=是 N=否',
    },
    {
      dictName: '用户性别',
      dictType: 'sys_user_sex',
      remark: '用户性别选项，0=男 1=女 2=未知',
    },
    {
      dictName: '任务状态',
      dictType: 'sys_job_status',
      remark: '定时任务运行状态，0=正常 1=暂停',
    },
    {
      dictName: '任务分组',
      dictType: 'sys_job_group',
      remark: '定时任务分组，用于任务分类管理',
    },
    {
      dictName: '通知类型',
      dictType: 'sys_notice_type',
      remark: '通知公告类型，1=通知 2=公告',
    },
    {
      dictName: '通知状态',
      dictType: 'sys_notice_status',
      remark: '通知公告状态，0=正常 1=关闭',
    },
    {
      dictName: '操作类型',
      dictType: 'sys_oper_type',
      remark: '操作日志业务类型，0=其它 1=新增 2=修改 3=删除 等',
    },
    {
      dictName: '通用状态',
      dictType: 'sys_common_status',
      remark: '通用操作结果状态，0=成功 1=失败',
    },
  ]
  for (const dt of dictTypesToSeed) {
    const exists = await prisma.sysDictType.findFirst({
      where: { dictType: dt.dictType },
    })
    if (!exists) {
      await prisma.sysDictType.create({
        data: {
          dictName: dt.dictName,
          dictType: dt.dictType,
          status: '0',
          remark: dt.remark || '',
        },
      })
      console.log(`Created dictType: ${dt.dictType}`)
    }
  }

  // 字典数据
  const dictDataToSeed = [
    // 显示隐藏
    {
      dictType: 'sys_show_hide',
      dictLabel: '显示',
      dictValue: '0',
      dictSort: 1,
      isDefault: 'N',
    },
    {
      dictType: 'sys_show_hide',
      dictLabel: '隐藏',
      dictValue: '1',
      dictSort: 2,
      isDefault: 'N',
    },
    // 正常停用
    {
      dictType: 'sys_normal_disable',
      dictLabel: '正常',
      dictValue: '0',
      dictSort: 1,
      isDefault: 'Y',
    },
    {
      dictType: 'sys_normal_disable',
      dictLabel: '停用',
      dictValue: '1',
      dictSort: 2,
      isDefault: 'N',
    },
    // 是否
    {
      dictType: 'sys_yes_no',
      dictLabel: '是',
      dictValue: 'Y',
      dictSort: 1,
      isDefault: 'Y',
    },
    {
      dictType: 'sys_yes_no',
      dictLabel: '否',
      dictValue: 'N',
      dictSort: 2,
      isDefault: 'N',
    },
    // 性别
    {
      dictType: 'sys_user_sex',
      dictLabel: '男',
      dictValue: '0',
      dictSort: 1,
      isDefault: 'N',
    },
    {
      dictType: 'sys_user_sex',
      dictLabel: '女',
      dictValue: '1',
      dictSort: 2,
      isDefault: 'N',
    },
    {
      dictType: 'sys_user_sex',
      dictLabel: '未知',
      dictValue: '2',
      dictSort: 3,
      isDefault: 'Y',
    },
    // 任务状态
    {
      dictType: 'sys_job_status',
      dictLabel: '正常',
      dictValue: '0',
      dictSort: 1,
      isDefault: 'Y',
    },
    {
      dictType: 'sys_job_status',
      dictLabel: '暂停',
      dictValue: '1',
      dictSort: 2,
      isDefault: 'N',
    },
    // 任务分组
    {
      dictType: 'sys_job_group',
      dictLabel: 'DEFAULT',
      dictValue: 'DEFAULT',
      dictSort: 1,
      isDefault: 'Y',
    },
    {
      dictType: 'sys_job_group',
      dictLabel: 'SYSTEM',
      dictValue: 'SYSTEM',
      dictSort: 2,
      isDefault: 'N',
    },
    // 通知类型
    {
      dictType: 'sys_notice_type',
      dictLabel: '通知',
      dictValue: '1',
      dictSort: 1,
      isDefault: 'N',
    },
    {
      dictType: 'sys_notice_type',
      dictLabel: '公告',
      dictValue: '2',
      dictSort: 2,
      isDefault: 'N',
    },
    // 通知状态
    {
      dictType: 'sys_notice_status',
      dictLabel: '正常',
      dictValue: '0',
      dictSort: 1,
      isDefault: 'Y',
    },
    {
      dictType: 'sys_notice_status',
      dictLabel: '关闭',
      dictValue: '1',
      dictSort: 2,
      isDefault: 'N',
    },
    // 操作类型
    {
      dictType: 'sys_oper_type',
      dictLabel: '其它',
      dictValue: '0',
      dictSort: 0,
      isDefault: 'N',
    },
    {
      dictType: 'sys_oper_type',
      dictLabel: '新增',
      dictValue: '1',
      dictSort: 1,
      isDefault: 'N',
    },
    {
      dictType: 'sys_oper_type',
      dictLabel: '修改',
      dictValue: '2',
      dictSort: 2,
      isDefault: 'N',
    },
    {
      dictType: 'sys_oper_type',
      dictLabel: '删除',
      dictValue: '3',
      dictSort: 3,
      isDefault: 'N',
    },
    {
      dictType: 'sys_oper_type',
      dictLabel: '授权',
      dictValue: '4',
      dictSort: 4,
      isDefault: 'N',
    },
    {
      dictType: 'sys_oper_type',
      dictLabel: '导出',
      dictValue: '5',
      dictSort: 5,
      isDefault: 'N',
    },
    {
      dictType: 'sys_oper_type',
      dictLabel: '导入',
      dictValue: '6',
      dictSort: 6,
      isDefault: 'N',
    },
    {
      dictType: 'sys_oper_type',
      dictLabel: '强退',
      dictValue: '7',
      dictSort: 7,
      isDefault: 'N',
    },
    {
      dictType: 'sys_oper_type',
      dictLabel: '生成代码',
      dictValue: '8',
      dictSort: 8,
      isDefault: 'N',
    },
    {
      dictType: 'sys_oper_type',
      dictLabel: '清空数据',
      dictValue: '9',
      dictSort: 9,
      isDefault: 'N',
    },
    // 通用状态
    {
      dictType: 'sys_common_status',
      dictLabel: '成功',
      dictValue: '0',
      dictSort: 1,
      isDefault: 'Y',
    },
    {
      dictType: 'sys_common_status',
      dictLabel: '失败',
      dictValue: '1',
      dictSort: 2,
      isDefault: 'N',
    },
  ]
  for (const dd of dictDataToSeed) {
    const exists = await prisma.sysDictData.findFirst({
      where: { dictType: dd.dictType, dictValue: dd.dictValue },
    })
    if (!exists) {
      await prisma.sysDictData.create({
        data: {
          dictType: dd.dictType,
          dictLabel: dd.dictLabel,
          dictValue: dd.dictValue,
          dictSort: dd.dictSort,
          isDefault: dd.isDefault,
          status: '0',
        },
      })
      console.log(`Created dictData: ${dd.dictType}/${dd.dictValue}`)
    }
  }

  // 系统配置
  const configsToSeed = [
    // 账户安全设置
    {
      configName: '初始密码',
      configKey: 'sys.account.initPassword',
      configValue: 'admin123',
      configType: 'Y',
      remark: '新建用户或重置密码时使用的默认密码',
    },
    {
      configName: '验证码开关',
      configKey: 'sys.account.captchaEnabled',
      configValue: 'false',
      configType: 'Y',
      remark: '是否开启登录图形验证码，true/false',
    },
    {
      configName: '两步验证开关',
      configKey: 'sys.account.twoFactorEnabled',
      configValue: 'false',
      configType: 'Y',
      remark: '是否强制开启两步验证（TOTP），true/false',
    },

    // 网站信息设置
    {
      configName: '网站名称',
      configKey: 'sys.app.name',
      configValue: 'RBAC Admin Pro',
      configType: 'Y',
      remark: '显示在浏览器标签页和登录页的网站名称',
    },
    {
      configName: '网站描述',
      configKey: 'sys.app.description',
      configValue: '企业级全栈权限管理系统',
      configType: 'Y',
      remark: '显示在登录页的网站描述文字',
    },
    {
      configName: '版权信息',
      configKey: 'sys.app.copyright',
      configValue: '© 2025 RBAC Admin Pro. All rights reserved.',
      configType: 'Y',
      remark: '显示在页面底部的版权声明',
    },
    {
      configName: 'ICP备案号',
      configKey: 'sys.app.icp',
      configValue: '',
      configType: 'Y',
      remark: '网站ICP备案号，显示在页面底部，留空则不显示',
    },
    {
      configName: '联系邮箱',
      configKey: 'sys.app.email',
      configValue: 'admin@example.com',
      configType: 'Y',
    },
    // 邮件设置
    {
      configName: '邮件服务开关',
      configKey: 'sys.mail.enabled',
      configValue: 'false',
      configType: 'Y',
      remark: '是否启用邮件发送功能，true/false',
    },
    {
      configName: 'SMTP服务器',
      configKey: 'sys.mail.host',
      configValue: '',
      configType: 'Y',
      remark: '邮件服务器地址，如 smtp.qq.com、smtp.163.com',
    },
    {
      configName: 'SMTP端口',
      configKey: 'sys.mail.port',
      configValue: '465',
      configType: 'Y',
      remark: 'SSL端口通常为465，非SSL端口通常为25或587',
    },
    {
      configName: '邮箱账号',
      configKey: 'sys.mail.username',
      configValue: '',
      configType: 'Y',
      remark: '发件邮箱账号',
    },
    {
      configName: '邮箱密码',
      configKey: 'sys.mail.password',
      configValue: '',
      configType: 'Y',
      remark: '邮箱密码或授权码（QQ邮箱等需使用授权码）',
    },
    {
      configName: '发件人地址',
      configKey: 'sys.mail.from',
      configValue: '',
      configType: 'Y',
      remark: '发件人显示地址，格式：名称 <邮箱> 或直接填邮箱',
    },
    // 存储设置
    {
      configName: '存储类型',
      configKey: 'sys.storage.type',
      configValue: 'local',
      configType: 'Y',
      remark: '文件存储方式：local（本地）或 oss（云存储）',
    },
    {
      configName: '本地存储路径',
      configKey: 'sys.storage.local.path',
      configValue: './uploads',
      configType: 'Y',
      remark: '本地存储时的文件保存目录，相对于项目根目录',
    },
    {
      configName: 'OSS端点',
      configKey: 'sys.storage.oss.endpoint',
      configValue: '',
      configType: 'Y',
      remark: 'S3兼容存储的端点地址，如 s3.amazonaws.com',
    },
    {
      configName: 'OSS存储桶',
      configKey: 'sys.storage.oss.bucket',
      configValue: '',
      configType: 'Y',
      remark: 'S3存储桶名称',
    },
    {
      configName: 'OSS AccessKey',
      configKey: 'sys.storage.oss.accessKey',
      configValue: '',
      configType: 'Y',
      remark: 'S3访问密钥ID',
    },
    {
      configName: 'OSS SecretKey',
      configKey: 'sys.storage.oss.secretKey',
      configValue: '',
      configType: 'Y',
      remark: 'S3访问密钥Secret',
    },
    // 导出设置
    {
      configName: '导出文件保留时间',
      configKey: 'sys.export.fileExpireHours',
      configValue: '2',
      configType: 'Y',
      remark: '导出文件在服务器保留的小时数，过期后自动清理',
    },
    // 网站Logo和图标
    {
      configName: '网站Logo',
      configKey: 'sys.app.logo',
      configValue: '',
      configType: 'Y',
      remark: '网站Logo图片URL，显示在登录页和侧边栏',
    },
    {
      configName: '网站图标',
      configKey: 'sys.app.favicon',
      configValue: '',
      configType: 'Y',
      remark: '浏览器标签页图标URL（favicon）',
    },

    // 安全入口
    {
      configName: '安全登录路径',
      configKey: 'sys.security.loginPath',
      configValue: '/login',
      configType: 'Y',
      remark: '自定义登录页路径，可用于隐藏默认登录入口提高安全性',
    },
    // 登录限制
    {
      configName: '登录失败次数',
      configKey: 'sys.login.maxRetry',
      configValue: '5',
      configType: 'Y',
      remark: '连续登录失败达到此次数后锁定账户',
    },
    {
      configName: '账户锁定时长',
      configKey: 'sys.login.lockTime',
      configValue: '10',
      configType: 'Y',
      remark: '账户锁定时长（分钟），锁定期间无法登录',
    },
    // 会话设置
    {
      configName: '会话超时时间',
      configKey: 'sys.session.timeout',
      configValue: '30',
      configType: 'Y',
      remark: '用户无操作超过此时间（分钟）后自动退出登录',
    },
    // 邮件SSL
    {
      configName: 'SSL/TLS开关',
      configKey: 'sys.mail.ssl',
      configValue: 'true',
      configType: 'Y',
      remark: '邮件发送是否使用SSL/TLS加密，true/false',
    },
    // Git 配置（更新日志）
    {
      configName: 'GitHub 仓库地址',
      configKey: 'sys.git.repo',
      configValue: 'https://github.com/lyfe2025/rbac-admin-pro',
      configType: 'Y',
      remark: '更新日志页面获取提交记录的仓库地址，支持完整 URL 或 owner/repo 格式',
    },
    {
      configName: 'GitHub Token',
      configKey: 'sys.git.token',
      configValue: '',
      configType: 'Y',
      remark:
        '可选，用于提高 GitHub API 请求限额（60次/小时 → 5000次/小时），在 github.com/settings/tokens 生成',
    },
  ]
  for (const cfg of configsToSeed) {
    const exists = await prisma.sysConfig.findFirst({
      where: { configKey: cfg.configKey },
    })
    if (!exists) {
      await prisma.sysConfig.create({
        data: {
          configName: cfg.configName,
          configKey: cfg.configKey,
          configValue: cfg.configValue,
          configType: cfg.configType,
          remark: (cfg as { remark?: string }).remark || '',
        },
      })
      console.log(`Created config: ${cfg.configKey}`)
    }
  }

  // 8. 岗位样例
  const posts = [
    { postCode: 'dev', postName: '开发', postSort: 1, status: '0' },
    { postCode: 'pm', postName: '产品经理', postSort: 2, status: '0' },
  ]
  for (const p of posts) {
    const exist = await prisma.sysPost.findFirst({
      where: { postCode: p.postCode },
    })
    if (!exist) {
      await prisma.sysPost.create({ data: p })
    }
  }

  // 9.1 绑定用户岗位（示例）：admin -> dev，user -> pm
  const devPost = await prisma.sysPost.findFirst({
    where: { postCode: 'dev' },
  })
  const pmPost = await prisma.sysPost.findFirst({
    where: { postCode: 'pm' },
  })
  if (devPost && pmPost) {
    await prisma.sysUserPost.createMany({
      data: [
        { userId: adminUser.userId, postId: devPost.postId },
        { userId: systemAdminUser.userId, postId: devPost.postId },
        { userId: monitorAdminUser.userId, postId: devPost.postId },
        { userId: commonUser.userId, postId: pmPost.postId },
      ],
      skipDuplicates: true,
    })
  }

  // 10. 公告样例
  const noticeExist = await prisma.sysNotice.findFirst({
    where: { noticeTitle: '系统维护' },
  })
  if (!noticeExist) {
    await prisma.sysNotice.create({
      data: {
        noticeTitle: '系统维护',
        noticeType: '2',
        noticeContent: '本周日凌晨进行系统维护。',
        status: '0',
      },
    })
  }

  // 11. 清理过期导出任务
  const cleanExportJobExist = await prisma.sysJob.findFirst({
    where: { jobName: '清理过期导出任务' },
  })
  if (!cleanExportJobExist) {
    await prisma.sysJob.create({
      data: {
        jobName: '清理过期导出任务',
        jobGroup: 'SYSTEM',
        invokeTarget: 'export:cleanExpiredTasks',
        cronExpression: '0 0 * * * *',
        misfirePolicy: '3',
        concurrent: '1',
        status: '0',
      },
    })
  }

  // 11.1 任务日志样例（已移除示例任务）

  // 12. 登录日志样例
  const loginLogExist = await prisma.sysLoginLog.count()
  if (loginLogExist === 0) {
    await prisma.sysLoginLog.createMany({
      data: [
        {
          userName: 'admin',
          ipaddr: '127.0.0.1',
          browser: 'Chrome',
          os: 'macOS',
          status: '0',
          msg: '登录成功',
        },
        {
          userName: 'user',
          ipaddr: '127.0.0.1',
          browser: 'Chrome',
          os: 'macOS',
          status: '1',
          msg: '密码错误',
        },
      ],
      skipDuplicates: true,
    })
  }

  // 13. 操作日志样例
  const operLogCount = await prisma.sysOperLog.count()
  if (operLogCount === 0) {
    await prisma.sysOperLog.createMany({
      data: [
        {
          title: '部门管理',
          businessType: 1,
          method: 'DeptController.create',
          requestMethod: 'POST',
          operName: 'admin',
          deptName: '总公司',
          operUrl: '/system/dept',
          operIp: '127.0.0.1',
          operLocation: '内网',
          operParam: '{"deptName":"技术部"}',
          jsonResult: '{"code":200}',
          status: 0,
        },
        {
          title: '岗位管理',
          businessType: 3,
          method: 'PostController.remove',
          requestMethod: 'DELETE',
          operName: 'admin',
          deptName: '总公司',
          operUrl: '/system/post',
          operIp: '127.0.0.1',
          operLocation: '内网',
          operParam: '{"ids":"1,2"}',
          jsonResult: '{"code":200}',
          status: 0,
        },
      ],
      skipDuplicates: true,
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

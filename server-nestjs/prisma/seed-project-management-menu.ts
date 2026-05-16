import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const movedMenus = [
  { path: 'projects', menuName: '项目配置', component: 'bug/projects/index', orderNum: 7 },
  { path: 'modules', menuName: '模块管理', component: 'bug/modules/index', orderNum: 8 },
  { path: 'versions', menuName: '版本管理', component: 'bug/versions/index', orderNum: 9 },
]

const pathRedirects: Record<string, string> = {
  '/bug/projects': '/project-management/projects',
  '/bug/modules': '/project-management/modules',
  '/bug/versions': '/project-management/versions',
}

async function main() {
  const pmDir = await prisma.sysMenu.findFirst({
    where: { path: '/project-management', menuType: 'M', parentId: null },
  })

  if (!pmDir) {
    throw new Error('未找到项目管理根菜单 /project-management，请先执行主 seed。')
  }

  for (const menu of movedMenus) {
    const existed = await prisma.sysMenu.findFirst({
      where: { path: menu.path, component: menu.component },
    })

    if (!existed) {
      console.warn(`未找到待迁移菜单: ${menu.menuName} (${menu.component})`)
      continue
    }

    await prisma.sysMenu.update({
      where: { menuId: existed.menuId },
      data: {
        menuName: menu.menuName,
        parentId: pmDir.menuId,
        orderNum: menu.orderNum,
        status: '0',
        visible: '0',
      },
    })

    console.log(`Moved menu to project management: ${menu.menuName}`)
  }

  await restoreBugStatisticsMenu()
  await migrateWorkspacePaths()
}

async function restoreBugStatisticsMenu() {
  const bugDir = await prisma.sysMenu.findFirst({
    where: { path: '/bug', menuType: 'M', parentId: null },
  })

  if (!bugDir) {
    throw new Error('未找到缺陷管理根菜单 /bug，请先执行主 seed。')
  }

  const bugStatistics = await prisma.sysMenu.findFirst({
    where: { component: 'bug/statistics/index' },
  })

  if (!bugStatistics) {
    console.warn('未找到缺陷看板菜单 (bug/statistics/index)')
    return
  }

  await prisma.sysMenu.update({
    where: { menuId: bugStatistics.menuId },
    data: {
      menuName: '缺陷看板',
      parentId: bugDir.menuId,
      path: 'statistics',
      orderNum: 4,
      status: '0',
      visible: '0',
      perms: 'bug:statistics:view',
      icon: 'bar-chart-3',
    },
  })

  console.log('Restored menu to 缺陷管理: 缺陷看板')
}

async function migrateWorkspacePaths() {
  const existed = await prisma.$queryRawUnsafe<Array<{ name: string | null }>>(
    `select to_regclass('public.sys_role_workspace_config')::text as name`,
  )
  if (!existed[0]?.name) return

  for (const [oldPath, newPath] of Object.entries(pathRedirects)) {
    await prisma.$executeRawUnsafe(
      `update sys_role_workspace_config
       set default_path = case when default_path = $1 then $2 else default_path end,
           dashboard_path = case when dashboard_path = $1 then $2 else dashboard_path end,
           default_open_menu = case when default_open_menu = $1 then $2 else default_open_menu end,
           update_time = now()
       where default_path = $1 or dashboard_path = $1 or default_open_menu = $1`,
      oldPath,
      newPath,
    )
  }

  await prisma.$executeRawUnsafe(
    `update sys_role_workspace_config
     set dashboard_path = '/bug/statistics',
         update_time = now()
     where dashboard_path = '/project-management/statistics'`,
  )

  await prisma.$executeRawUnsafe(
    `update sys_role_workspace_config
     set default_path = '/bug/statistics',
         default_open_menu = '/bug',
         update_time = now()
     where default_path = '/project-management/statistics'`,
  )

  await prisma.$executeRawUnsafe(
    `update sys_role_workspace_config
     set default_open_menu = '/project-management',
         update_time = now()
     where default_open_menu = '/bug'
       and default_path like '/project-management/%'`,
  )

  console.log('Migrated workspace default paths for project management menus')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

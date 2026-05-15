import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
const notificationPerms = [
  ['通知查询', 'system:notification:list', 1],
  ['通知已读', 'system:notification:read', 2],
  ['通知实时流', 'system:notification:stream', 3],
] as const

const notificationRoleKeys = [
  'admin',
  'developer',
  'tester',
  'bug_developer',
  'bug_tester',
  'bug_submitter',
  'bug_project_owner',
  'bug_product_owner',
  'bug_operator',
]

async function ensureNotificationMenu() {
  const systemDir = await prisma.sysMenu.findFirst({ where: { path: 'system', parentId: null } })
  if (!systemDir) return

  const existingMenu = await prisma.sysMenu.findFirst({ where: { parentId: systemDir.menuId, path: 'notification' } })
  const notificationMenu = existingMenu
    ? await prisma.sysMenu.update({ where: { menuId: existingMenu.menuId }, data: notificationMenuData(systemDir.menuId) })
    : await prisma.sysMenu.create({ data: notificationMenuData(systemDir.menuId) })

  for (const [menuName, perms, orderNum] of notificationPerms) {
    const existed = await prisma.sysMenu.findFirst({ where: { perms } })
    if (!existed) {
      await prisma.sysMenu.create({
        data: { menuName, parentId: notificationMenu.menuId, orderNum, menuType: 'F', visible: '1', status: '0', perms, isFrame: 1, path: '', icon: '#' },
      })
    }
  }

  await bindNotificationMenusToRoles(notificationMenu.menuId)
}

function notificationMenuData(parentId: bigint) {
  return { menuName: '站内通知', parentId, path: 'notification', component: 'system/notification/index', orderNum: 10, menuType: 'C', visible: '1', status: '0', perms: 'system:notification:list', icon: 'bell-ring', isFrame: 1 }
}

async function bindNotificationMenusToRoles(notificationMenuId: bigint) {
  const roles = await prisma.sysRole.findMany({
    where: { roleKey: { in: notificationRoleKeys }, delFlag: '0' },
    select: { roleId: true },
  })
  if (!roles.length) return

  const menus = await prisma.sysMenu.findMany({
    where: { OR: [{ menuId: notificationMenuId }, { parentId: notificationMenuId }] },
    select: { menuId: true },
  })
  await prisma.sysRoleMenu.createMany({
    data: roles.flatMap((role) => menus.map((menu) => ({ roleId: role.roleId, menuId: menu.menuId }))),
    skipDuplicates: true,
  })
}


ensureNotificationMenu()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function seedDefectMenuNames() {
  const bugDir = await prisma.sysMenu.findFirst({
    where: { path: '/bug', menuType: 'M', parentId: null },
    select: { menuId: true },
  })

  if (!bugDir) {
    console.warn('未找到缺陷管理根菜单 /bug，跳过菜单命名修正')
    return
  }

  await prisma.sysMenu.update({
    where: { menuId: bugDir.menuId },
    data: { menuName: '缺陷管理' },
  })

  await prisma.sysMenu.updateMany({
    where: { parentId: bugDir.menuId, path: 'my' },
    data: { menuName: '我的缺陷' },
  })

  await updateChildMenu(bugDir.menuId, 'tickets', '缺陷列表')
  await updateChildMenu(bugDir.menuId, 'create', '提交缺陷')
  await updateChildMenu(bugDir.menuId, 'statistics', '缺陷看板')

  await updateButtonName('bug:ticket:query', '缺陷详情')
  await updateButtonName('bug:ticket:edit', '缺陷编辑')
  await updateButtonName('bug:ticket:remove', '缺陷删除')
  await updateButtonName('bug:ticket:assign', '缺陷指派')
  await updateButtonName('bug:ticket:confirm', '缺陷确认')
  await updateButtonName('bug:ticket:reject', '缺陷驳回')
  await updateButtonName('bug:ticket:verify', '验证缺陷')
  await updateButtonName('bug:ticket:close', '关闭缺陷')
  await updateButtonName('bug:ticket:my', '我的缺陷查询')
  await updateButtonName('bug:ticket:add', '提交缺陷')
  await updateButtonName('bug:statistics:export', '缺陷统计导出')

  await prisma.bugProjectModule.updateMany({
    where: { moduleName: 'Bug 管理' },
    data: { moduleName: '缺陷管理' },
  })

  console.log('Updated Bug menu display names to 缺陷管理')
}

async function updateChildMenu(parentId: bigint, path: string, menuName: string) {
  await prisma.sysMenu.updateMany({
    where: { parentId, path, menuType: 'C' },
    data: { menuName },
  })
}

async function updateButtonName(perms: string, menuName: string) {
  await prisma.sysMenu.updateMany({
    where: { perms, menuType: 'F' },
    data: { menuName },
  })
}

seedDefectMenuNames()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

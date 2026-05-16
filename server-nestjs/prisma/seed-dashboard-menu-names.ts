import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function seedDashboardMenuNames() {
  await prisma.sysMenu.updateMany({
    where: { component: 'project-management/executive-dashboard/index', menuType: 'C' },
    data: { menuName: '仪表盘' },
  })

  await prisma.sysMenu.updateMany({
    where: { perms: 'pm:executive-dashboard:all', menuType: 'F' },
    data: { menuName: '查看全部项目仪表盘' },
  })

  await prisma.sysRole.updateMany({
    where: { roleKey: 'pm_executive', delFlag: '0' },
    data: { remark: '查看项目仪表盘和项目进度摘要' },
  })

  await prisma.sysRole.updateMany({
    where: { roleKey: 'pm_executive', roleName: '老板/管理层', delFlag: '0' },
    data: { roleName: '管理层' },
  })

  await prisma.$executeRaw`
    update sys_role_workspace_config
       set remark = '管理员保留系统首页',
           update_time = now()
     where role_key = 'admin'
       and remark = '管理员保留系统仪表盘'
  `

  console.log('Updated dashboard display names to 仪表盘')
}

seedDashboardMenuNames()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

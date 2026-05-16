import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const rolePermissions: Record<string, string[]> = {
  bug_project_owner: [
    'bug:ticket:list',
    'bug:ticket:my',
    'bug:ticket:query',
    'bug:ticket:edit',
    'bug:ticket:assign',
    'bug:ticket:changeStatus',
    'bug:ticket:confirm',
    'bug:ticket:reject',
    'bug:ticket:verify',
    'bug:ticket:close',
    'bug:ticket:reopen',
    'bug:comment:add',
    'bug:attachment:upload',
    'bug:project:list',
    'bug:project:member',
    'bug:statistics:view',
    'system:notification:list',
    'system:notification:read',
    'system:notification:stream',
  ],
  bug_product_owner: [
    'bug:ticket:list',
    'bug:ticket:my',
    'bug:ticket:query',
    'bug:ticket:edit',
    'bug:ticket:assign',
    'bug:ticket:changeStatus',
    'bug:ticket:confirm',
    'bug:ticket:reject',
    'bug:ticket:reopen',
    'bug:comment:add',
    'bug:attachment:upload',
    'bug:statistics:view',
    'system:notification:list',
    'system:notification:read',
    'system:notification:stream',
  ],
  bug_reviewer: [
    'bug:ticket:list',
    'bug:ticket:my',
    'bug:ticket:query',
    'bug:ticket:edit',
    'bug:ticket:assign',
    'bug:ticket:changeStatus',
    'bug:ticket:confirm',
    'bug:ticket:reject',
    'bug:ticket:reopen',
    'bug:comment:add',
    'bug:attachment:upload',
    'bug:statistics:view',
    'system:notification:list',
    'system:notification:read',
    'system:notification:stream',
  ],
  bug_developer: [
    'bug:ticket:list',
    'bug:ticket:my',
    'bug:ticket:query',
    'bug:ticket:startFix',
    'bug:ticket:submitVerify',
    'bug:comment:add',
    'bug:attachment:upload',
    'bug:statistics:view',
    'system:notification:list',
    'system:notification:read',
    'system:notification:stream',
  ],
  bug_tester: [
    'bug:ticket:list',
    'bug:ticket:my',
    'bug:ticket:query',
    'bug:ticket:add',
    'bug:ticket:verify',
    'bug:ticket:close',
    'bug:ticket:reopen',
    'bug:comment:add',
    'bug:attachment:upload',
    'system:notification:list',
    'system:notification:read',
    'system:notification:stream',
  ],
  bug_submitter: [
    'bug:ticket:my',
    'bug:ticket:query',
    'bug:ticket:add',
    'bug:ticket:reopen',
    'bug:comment:add',
    'bug:attachment:upload',
    'system:notification:list',
    'system:notification:read',
    'system:notification:stream',
  ],
}

async function ensureBugWorkflowPermissions() {
  await ensureReviewerRole()
  await ensureReviewerDict()
  await bindRolePermissions()
}

async function ensureReviewerRole() {
  await prisma.sysRole.upsert({
    where: { roleKey_delFlag: { roleKey: 'bug_reviewer', delFlag: '0' } },
    update: { roleName: 'Bug 审核人员', status: '0', remark: '审核 Bug、驳回或分派给开发' },
    create: {
      roleName: 'Bug 审核人员',
      roleKey: 'bug_reviewer',
      roleSort: 21,
      dataScope: '2',
      status: '0',
      remark: '审核 Bug、驳回或分派给开发',
    },
  })
}

async function ensureReviewerDict() {
  const existed = await prisma.sysDictData.findFirst({
    where: { dictType: 'bug_member_role', dictValue: 'reviewer' },
  })
  if (existed) return
  await prisma.sysDictData.create({
    data: {
      dictType: 'bug_member_role',
      dictLabel: '审核人员',
      dictValue: 'reviewer',
      dictSort: 3,
      status: '0',
      isDefault: 'N',
    },
  })
}

async function bindRolePermissions() {
  for (const [roleKey, perms] of Object.entries(rolePermissions)) {
    const role = await prisma.sysRole.findFirst({ where: { roleKey, delFlag: '0' }, select: { roleId: true } })
    if (!role) continue
    const menus = await prisma.sysMenu.findMany({
      where: { perms: { in: perms }, status: '0' },
      select: { menuId: true, parentId: true },
    })
    const menuIds = await collectMenuIdsWithParents(menus)
    await prisma.sysRoleMenu.createMany({
      data: menuIds.map((menuId) => ({ roleId: role.roleId, menuId })),
      skipDuplicates: true,
    })
  }
}

async function collectMenuIdsWithParents(menus: Array<{ menuId: bigint; parentId: bigint | null }>) {
  const menuIds = new Set(menus.map((menu) => menu.menuId))
  let parentIds = menus.map((menu) => menu.parentId).filter((id): id is bigint => Boolean(id))
  while (parentIds.length) {
    const parents = await prisma.sysMenu.findMany({
      where: { menuId: { in: parentIds } },
      select: { menuId: true, parentId: true },
    })
    const nextParentIds: bigint[] = []
    for (const parent of parents) {
      if (!menuIds.has(parent.menuId)) menuIds.add(parent.menuId)
      if (parent.parentId && !menuIds.has(parent.parentId)) nextParentIds.push(parent.parentId)
    }
    parentIds = nextParentIds
  }
  return [...menuIds]
}

ensureBugWorkflowPermissions()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

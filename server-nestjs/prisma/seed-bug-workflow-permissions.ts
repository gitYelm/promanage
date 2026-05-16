import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const notificationPermissions = [
  'system:notification:list',
  'system:notification:read',
  'system:notification:stream',
]

const readPermissions = [
  'bug:ticket:list',
  'bug:ticket:my',
  'bug:ticket:query',
  'bug:comment:list',
  'bug:attachment:list',
  'bug:attachment:preview',
]

const writeCollaborationPermissions = [
  'bug:comment:add',
  'bug:attachment:upload',
]

const projectReadPermissions = [
  'bug:project:list',
  'bug:module:list',
  'bug:version:list',
  'bug:statistics:view',
]

const rolePermissions: Record<string, string[]> = {
  bug_project_owner: [
    ...readPermissions,
    ...writeCollaborationPermissions,
    ...projectReadPermissions,
    'bug:ticket:edit',
    'bug:ticket:assign',
    'bug:ticket:changeStatus',
    'bug:ticket:confirm',
    'bug:ticket:reject',
    'bug:ticket:verify',
    'bug:ticket:close',
    'bug:ticket:reopen',
    'bug:attachment:download',
    'bug:project:query',
    'bug:project:member',
    'bug:module:query',
    'bug:version:query',
    ...notificationPermissions,
  ],
  bug_product_owner: [
    ...readPermissions,
    ...writeCollaborationPermissions,
    ...projectReadPermissions,
    'bug:ticket:edit',
    'bug:ticket:assign',
    'bug:ticket:changeStatus',
    'bug:ticket:confirm',
    'bug:ticket:reject',
    'bug:ticket:reopen',
    'bug:attachment:download',
    ...notificationPermissions,
  ],
  bug_reviewer: [
    ...readPermissions,
    ...writeCollaborationPermissions,
    ...projectReadPermissions,
    'bug:ticket:edit',
    'bug:ticket:assign',
    'bug:ticket:changeStatus',
    'bug:ticket:confirm',
    'bug:ticket:reject',
    'bug:ticket:reopen',
    'bug:attachment:download',
    ...notificationPermissions,
  ],
  bug_developer: [
    ...readPermissions,
    ...writeCollaborationPermissions,
    'bug:ticket:startFix',
    'bug:ticket:submitVerify',
    'bug:statistics:view',
    ...notificationPermissions,
  ],
  bug_tester: [
    ...readPermissions,
    ...writeCollaborationPermissions,
    'bug:ticket:add',
    'bug:ticket:verify',
    'bug:ticket:close',
    'bug:ticket:reopen',
    ...notificationPermissions,
  ],
  bug_submitter: [
    ...readPermissions.filter((permission) => permission !== 'bug:ticket:list'),
    ...writeCollaborationPermissions,
    'bug:ticket:add',
    'bug:ticket:reopen',
    ...notificationPermissions,
  ],
  bug_operator: [
    ...readPermissions,
    ...writeCollaborationPermissions,
    'bug:ticket:add',
    'bug:ticket:edit',
    ...notificationPermissions,
  ],
  bug_viewer: [
    ...readPermissions,
    ...projectReadPermissions,
    ...notificationPermissions,
  ],
}

async function ensureBugWorkflowPermissions() {
  await ensureSupplementRoles()
  await ensureMemberRoleDict()
  await bindRolePermissions()
}

async function ensureSupplementRoles() {
  const roles = [
    ['bug_reviewer', 'Bug 审核人员', 21, '审核 Bug、驳回或分派给开发'],
    ['bug_operator', 'Bug 运营客服', 25, '内部代提交和协助跟进 Bug'],
    ['bug_viewer', 'Bug 观察者', 27, '只读查看授权项目 Bug、统计和项目进度'],
  ] as const

  for (const [roleKey, roleName, roleSort, remark] of roles) {
    await prisma.sysRole.upsert({
      where: { roleKey_delFlag: { roleKey, delFlag: '0' } },
      update: { roleName, status: '0', remark },
      create: { roleName, roleKey, roleSort, dataScope: '2', status: '0', remark },
    })
  }
}

async function ensureMemberRoleDict() {
  const roleDicts = [
    ['项目负责人', 'owner', 1],
    ['产品负责人', 'product', 2],
    ['审核人员', 'reviewer', 3],
    ['开发人员', 'developer', 4],
    ['测试人员', 'tester', 5],
    ['观察者', 'viewer', 6],
  ] as const

  for (const [dictLabel, dictValue, dictSort] of roleDicts) {
    const existed = await prisma.sysDictData.findFirst({
      where: { dictType: 'bug_member_role', dictValue },
    })
    if (existed) {
      await prisma.sysDictData.update({
        where: { dictCode: existed.dictCode },
        data: { dictLabel, dictSort, status: '0' },
      })
    } else {
      await prisma.sysDictData.create({
        data: { dictType: 'bug_member_role', dictLabel, dictValue, dictSort, status: '0', isDefault: 'N' },
      })
    }
  }
}

async function bindRolePermissions() {
  const removableMenuIds = await collectDescendantMenuIds(['/bug', '/project-management'])
  for (const [roleKey, perms] of Object.entries(rolePermissions)) {
    const role = await prisma.sysRole.findFirst({ where: { roleKey, delFlag: '0' }, select: { roleId: true } })
    if (!role) continue
    if (removableMenuIds.length) {
      await prisma.sysRoleMenu.deleteMany({
        where: { roleId: role.roleId, menuId: { in: removableMenuIds } },
      })
    }
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

async function collectDescendantMenuIds(rootPaths: string[]) {
  const roots = await prisma.sysMenu.findMany({
    where: { parentId: null, path: { in: rootPaths } },
    select: { menuId: true },
  })
  const result = new Set(roots.map((root) => root.menuId))
  let parentIds = roots.map((root) => root.menuId)
  while (parentIds.length) {
    const children = await prisma.sysMenu.findMany({
      where: { parentId: { in: parentIds } },
      select: { menuId: true },
    })
    parentIds = []
    for (const child of children) {
      if (!result.has(child.menuId)) {
        result.add(child.menuId)
        parentIds.push(child.menuId)
      }
    }
  }
  return [...result]
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

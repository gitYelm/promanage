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

const writeCollaborationPermissions = ['bug:comment:add', 'bug:attachment:upload']

const projectReadPermissions = [
  'bug:project:list',
  'bug:module:list',
  'bug:version:list',
  'bug:statistics:view',
]

const pmProjectOwnerPermissions = [
  'pm:executive-dashboard:view',
  'pm:project:view',
  'pm:project:update',
  'pm:requirement:view',
  'pm:requirement:create',
  'pm:requirement:update',
  'pm:requirement:review',
  'pm:requirement:status',
  'pm:iteration:view',
  'pm:iteration:manage',
  'pm:milestone:view',
  'pm:milestone:manage',
  'pm:dashboard:view',
]

const pmProductOwnerPermissions = [
  'pm:executive-dashboard:view',
  'pm:project:view',
  'pm:requirement:view',
  'pm:requirement:create',
  'pm:requirement:update',
  'pm:requirement:review',
  'pm:requirement:status',
  'pm:iteration:view',
  'pm:milestone:view',
  'pm:dashboard:view',
]

const pmReviewerPermissions = ['pm:project:view', 'pm:requirement:view', 'pm:dashboard:view']

const pmExecutivePermissions = [
  'pm:executive-dashboard:view',
  'pm:executive-dashboard:all',
  'pm:project:view',
  'pm:dashboard:view',
]

const rolePermissions: Record<string, string[]> = {
  bug_project_owner: [
    ...readPermissions,
    ...writeCollaborationPermissions,
    ...projectReadPermissions,
    ...pmProjectOwnerPermissions,
    'bug:ticket:edit',
    'bug:ticket:assign',
    'bug:ticket:changeStatus',
    'bug:ticket:confirm',
    'bug:ticket:reject',
    'bug:ticket:verify',
    'bug:ticket:close',
    'bug:ticket:reopen',
    'bug:attachment:download',
    'bug:project:add',
    'bug:project:edit',
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
    ...pmProductOwnerPermissions,
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
    ...pmReviewerPermissions,
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
  pm_executive: pmExecutivePermissions,
}

const legacyRoleKeyMappings = [
  ['project_owner', 'bug_project_owner'],
  ['product_owner', 'bug_product_owner'],
  ['reviewer', 'bug_reviewer'],
  ['developer', 'bug_developer'],
  ['tester', 'bug_tester'],
  ['submitter', 'bug_submitter'],
] as const

async function ensureBugWorkflowPermissions() {
  await ensureSupplementRoles()
  await ensureMemberRoleDict()
  await migrateLegacyRoleBindings()
  await bindRolePermissions()
  await deactivateLegacyRoles()
}

async function ensureSupplementRoles() {
  const roles = [
    [
      'bug_project_owner',
      '项目负责人',
      20,
      600,
      '负责项目配置、成员维护、缺陷分派、项目进度和统计',
    ],
    ['bug_product_owner', '产品负责人', 21, 550, '负责需求确认、缺陷有效性判断、优先级和业务验收'],
    ['bug_reviewer', '审核人员', 22, 520, '审核缺陷、驳回或分派给开发'],
    ['bug_developer', '开发人员', 23, 400, '处理分派给自己的缺陷并提交验证'],
    ['bug_tester', '测试人员', 24, 350, '提交、验证、关闭或重新打开缺陷'],
    ['bug_submitter', '提交人', 25, 100, '提交并跟踪本人缺陷'],
    ['pm_executive', '管理层', 26, 700, '查看项目仪表盘和项目进度摘要'],
  ] as const

  for (const [roleKey, roleName, roleSort, securityLevel, remark] of roles) {
    await prisma.sysRole.upsert({
      where: { roleKey_delFlag: { roleKey, delFlag: '0' } },
      update: { roleName, status: '0', securityLevel, remark },
      create: { roleName, roleKey, roleSort, securityLevel, dataScope: '2', status: '0', remark },
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
        data: {
          dictType: 'bug_member_role',
          dictLabel,
          dictValue,
          dictSort,
          status: '0',
          isDefault: 'N',
        },
      })
    }
  }
}

async function bindRolePermissions() {
  const removableMenuIds = await collectDescendantMenuIds(['/bug', '/project-management'])
  for (const [roleKey, perms] of Object.entries(rolePermissions)) {
    const role = await prisma.sysRole.findFirst({
      where: { roleKey, delFlag: '0' },
      select: { roleId: true },
    })
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

async function migrateLegacyRoleBindings() {
  for (const [legacyRoleKey, standardRoleKey] of legacyRoleKeyMappings) {
    const legacyRole = await prisma.sysRole.findFirst({
      where: { roleKey: legacyRoleKey, delFlag: '0' },
      select: { roleId: true },
    })
    const standardRole = await prisma.sysRole.findFirst({
      where: { roleKey: standardRoleKey, delFlag: '0' },
      select: { roleId: true },
    })
    if (!legacyRole || !standardRole) continue
    const bindings = await prisma.sysUserRole.findMany({
      where: { roleId: legacyRole.roleId },
      select: { userId: true },
    })
    if (bindings.length) {
      await prisma.sysUserRole.createMany({
        data: bindings.map((binding) => ({ userId: binding.userId, roleId: standardRole.roleId })),
        skipDuplicates: true,
      })
    }
    await prisma.sysUserRole.deleteMany({ where: { roleId: legacyRole.roleId } })
  }
}

async function deactivateLegacyRoles() {
  await prisma.sysRole.updateMany({
    where: { roleKey: { in: legacyRoleKeyMappings.map(([roleKey]) => roleKey) }, delFlag: '0' },
    data: {
      status: '1',
      delFlag: '2',
      remark: '已由规范 bug_* 业务角色替代，禁止继续参与权限计算',
    },
  })
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

async function collectMenuIdsWithParents(
  menus: Array<{ menuId: bigint; parentId: bigint | null }>,
) {
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

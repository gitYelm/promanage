import 'dotenv/config'
import * as bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
const defaultPassword = 'admin123'

const roles = [
  {
    roleKey: 'bug_tester',
    roleName: 'Bug 测试人员',
    roleSort: 30,
    remark: '提交 Bug、补充评论、验证和关闭 Bug',
    permissions: [
      'bug:ticket:my',
      'bug:ticket:add',
      'bug:ticket:query',
      'bug:ticket:list',
      'bug:ticket:verify',
      'bug:ticket:close',
      'bug:ticket:reopen',
    ],
  },
  {
    roleKey: 'bug_developer',
    roleName: 'Bug 开发人员',
    roleSort: 31,
    remark: '查看 Bug、开始修复、提交验证并补充修复说明',
    permissions: [
      'bug:ticket:my',
      'bug:ticket:query',
      'bug:ticket:list',
      'bug:ticket:startFix',
      'bug:ticket:submitVerify',
    ],
  },
  {
    roleKey: 'bug_reviewer',
    roleName: 'Bug 审核人员',
    roleSort: 32,
    remark: '确认、驳回、标记重复并审核 Bug 流程',
    permissions: [
      'bug:ticket:my',
      'bug:ticket:query',
      'bug:ticket:list',
      'bug:ticket:confirm',
      'bug:ticket:reject',
      'bug:ticket:changeStatus',
      'bug:ticket:reopen',
    ],
  },
  {
    roleKey: 'bug_submitter',
    roleName: 'Bug 提交人',
    roleSort: 33,
    remark: '提交并跟踪本人 Bug',
    permissions: [
      'bug:ticket:my',
      'bug:ticket:add',
      'bug:ticket:query',
      'bug:ticket:reopen',
    ],
  },
  {
    roleKey: 'bug_operator',
    roleName: 'Bug 运营客服',
    roleSort: 34,
    remark: '内部代提交和协助跟进 Bug',
    permissions: [
      'bug:ticket:list',
      'bug:ticket:my',
      'bug:ticket:add',
      'bug:ticket:query',
      'bug:ticket:edit',
    ],
  },
  {
    roleKey: 'bug_project_owner',
    roleName: 'Bug 项目负责人',
    roleSort: 35,
    remark: '管理项目内 Bug、成员、分派和统计',
    permissions: [
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
      'bug:project:list',
      'bug:project:member',
      'bug:statistics:view',
    ],
  },
  {
    roleKey: 'bug_product_owner',
    roleName: 'Bug 产品负责人',
    roleSort: 36,
    remark: '确认 Bug 有效性并分派处理',
    permissions: [
      'bug:ticket:list',
      'bug:ticket:my',
      'bug:ticket:query',
      'bug:ticket:edit',
      'bug:ticket:assign',
      'bug:ticket:changeStatus',
      'bug:ticket:confirm',
      'bug:ticket:reject',
      'bug:ticket:reopen',
      'bug:statistics:view',
    ],
  },
  {
    roleKey: 'bug_viewer',
    roleName: 'Bug 观察者',
    roleSort: 37,
    remark: '只读查看授权项目 Bug、统计和项目进度',
    permissions: [
      'bug:ticket:list',
      'bug:ticket:my',
      'bug:ticket:query',
      'bug:project:list',
      'bug:statistics:view',
    ],
  },
]

const accounts = [
  {
    userName: 'bug_owner',
    nickName: 'Bug 项目负责人',
    roleKey: 'bug_project_owner',
    deptName: '技术部',
    email: 'bug_owner@example.com',
    phonenumber: '13800002001',
    projectMemberRole: 'owner',
  },
  {
    userName: 'bug_product',
    nickName: 'Bug 产品负责人',
    roleKey: 'bug_product_owner',
    deptName: '技术部',
    email: 'bug_product@example.com',
    phonenumber: '13800002002',
    projectMemberRole: 'product',
  },
  {
    userName: 'bug_reviewer',
    nickName: 'Bug 审核人员',
    roleKey: 'bug_reviewer',
    deptName: '技术部',
    email: 'bug_reviewer@example.com',
    phonenumber: '13800002003',
    projectMemberRole: 'reviewer',
  },
  {
    userName: 'bug_dev01',
    nickName: 'Bug 开发一号',
    roleKey: 'bug_developer',
    deptName: '研发一部',
    email: 'bug_dev01@example.com',
    phonenumber: '13800002004',
    projectMemberRole: 'developer',
  },
  {
    userName: 'bug_dev02',
    nickName: 'Bug 开发二号',
    roleKey: 'bug_developer',
    deptName: '研发一部',
    email: 'bug_dev02@example.com',
    phonenumber: '13800002005',
    projectMemberRole: 'developer',
  },
  {
    userName: 'bug_tester01',
    nickName: 'Bug 测试一号',
    roleKey: 'bug_tester',
    deptName: '测试一部',
    email: 'bug_tester01@example.com',
    phonenumber: '13800002006',
    projectMemberRole: 'tester',
  },
  {
    userName: 'bug_submitter01',
    nickName: 'Bug 提交人一号',
    roleKey: 'bug_submitter',
    deptName: '测试一部',
    email: 'bug_submitter01@example.com',
    phonenumber: '13800002007',
    projectMemberRole: undefined,
  },
  {
    userName: 'bug_viewer01',
    nickName: 'Bug 观察者一号',
    roleKey: 'bug_viewer',
    deptName: '技术部',
    email: 'bug_viewer01@example.com',
    phonenumber: '13800002008',
    projectMemberRole: 'viewer',
  },
]

async function ensureRole(role) {
  const existed = await prisma.sysRole.findFirst({
    where: { roleKey: role.roleKey, delFlag: '0' },
  })
  const data = {
    roleName: role.roleName,
    roleSort: role.roleSort,
    status: '0',
    dataScope: '2',
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    remark: role.remark,
  }
  if (existed) {
    return prisma.sysRole.update({ where: { roleId: existed.roleId }, data })
  }
  return prisma.sysRole.create({
    data: { ...data, roleKey: role.roleKey },
  })
}

async function menuIdsForPermissions(permissions) {
  const bugRoot = await prisma.sysMenu.findFirst({
    where: { parentId: null, path: '/bug' },
    select: { menuId: true },
  })
  const menus = await prisma.sysMenu.findMany({
    where: { status: '0', perms: { in: permissions } },
    select: { menuId: true, parentId: true },
  })
  const menuIds = new Set(menus.map((menu) => menu.menuId))
  if (bugRoot) menuIds.add(bugRoot.menuId)
  let parentIds = menus.map((menu) => menu.parentId).filter(Boolean)
  while (parentIds.length) {
    const parents = await prisma.sysMenu.findMany({
      where: { menuId: { in: parentIds } },
      select: { menuId: true, parentId: true },
    })
    parentIds = []
    for (const parent of parents) {
      if (!menuIds.has(parent.menuId)) menuIds.add(parent.menuId)
      if (parent.parentId && !menuIds.has(parent.parentId)) parentIds.push(parent.parentId)
    }
  }
  return [...menuIds]
}

async function deptIdByName(deptName) {
  const dept = await prisma.sysDept.findFirst({
    where: { deptName, delFlag: '0', status: '0' },
    select: { deptId: true },
  })
  if (dept) return dept.deptId
  const fallback = await prisma.sysDept.findFirst({
    where: { delFlag: '0', status: '0' },
    orderBy: { deptId: 'asc' },
    select: { deptId: true },
  })
  return fallback?.deptId
}

async function ensureAccount(account, passwordHash) {
  const role = await prisma.sysRole.findFirst({
    where: { roleKey: account.roleKey, delFlag: '0', status: '0' },
    select: { roleId: true },
  })
  if (!role) throw new Error(`Role not found: ${account.roleKey}`)

  const deptId = await deptIdByName(account.deptName)
  const existed = await prisma.sysUser.findFirst({
    where: { userName: account.userName, delFlag: '0' },
  })
  const data = {
    nickName: account.nickName,
    password: passwordHash,
    status: '0',
    deptId,
    email: account.email,
    phonenumber: account.phonenumber,
    sex: '2',
    remark: `${account.nickName}演示账号，初始密码可按需修改`,
  }
  const user = existed
    ? await prisma.sysUser.update({ where: { userId: existed.userId }, data })
    : await prisma.sysUser.create({ data: { ...data, userName: account.userName } })

  await prisma.sysUserRole.createMany({
    data: [{ userId: user.userId, roleId: role.roleId }],
    skipDuplicates: true,
  })
  return user
}

async function ensureProjectMembership(userId, memberRole) {
  const projects = await prisma.bugProject.findMany({
    where: { delFlag: '0', status: '0' },
    select: { projectId: true, projectName: true },
  })
  for (const project of projects) {
    await prisma.bugProjectMember.upsert({
      where: {
        projectId_userId_memberRole: {
          projectId: project.projectId,
          userId,
          memberRole,
        },
      },
      update: { status: '0' },
      create: {
        projectId: project.projectId,
        userId,
        memberRole,
        status: '0',
        isDefault: false,
      },
    })
  }
  return projects.length
}

async function pruneBugMenus(roleId) {
  const root = await prisma.sysMenu.findFirst({
    where: { parentId: null, path: '/bug' },
    select: { menuId: true },
  })
  if (!root) return
  const menuIds = await descendantMenuIds(root.menuId)
  if (!menuIds.length) return
  await prisma.sysRoleMenu.deleteMany({ where: { roleId, menuId: { in: menuIds } } })
}

async function descendantMenuIds(rootMenuId) {
  const result = new Set([rootMenuId])
  let parentIds = [rootMenuId]
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

async function ensureMemberRoleDict() {
  const roleDicts = [
    ['项目负责人', 'owner', 1],
    ['产品负责人', 'product', 2],
    ['审核人员', 'reviewer', 3],
    ['开发人员', 'developer', 4],
    ['测试人员', 'tester', 5],
    ['观察者', 'viewer', 6],
  ]

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

async function main() {
  await ensureMemberRoleDict()

  for (const roleConfig of roles) {
    const role = await ensureRole(roleConfig)
    const menuIds = await menuIdsForPermissions(roleConfig.permissions)
    await pruneBugMenus(role.roleId)
    await prisma.sysRoleMenu.createMany({
      data: menuIds.map((menuId) => ({ roleId: role.roleId, menuId })),
      skipDuplicates: true,
    })
    console.log(`Ensured role: ${roleConfig.roleName} (${roleConfig.roleKey})`)
  }

  const passwordHash = await bcrypt.hash(defaultPassword, 10)
  for (const account of accounts) {
    const user = await ensureAccount(account, passwordHash)
    const projectCount = account.projectMemberRole
      ? await ensureProjectMembership(user.userId, account.projectMemberRole)
      : 0
    console.log(
      `Ensured account: ${account.nickName} (${account.userName}), projects: ${projectCount}`,
    )
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

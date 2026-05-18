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
    securityLevel: 350,
    roleName: '测试人员',
    roleSort: 24,
    remark: '提交缺陷、补充评论、验证和关闭缺陷',
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
    securityLevel: 400,
    roleName: '开发人员',
    roleSort: 23,
    remark: '查看缺陷、开始修复、提交验证并补充修复说明',
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
    securityLevel: 520,
    roleName: '审核人员',
    roleSort: 22,
    remark: '确认、驳回、标记重复并审核缺陷流程',
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
    securityLevel: 100,
    roleName: '提交人',
    roleSort: 25,
    remark: '提交并跟踪本人缺陷',
    permissions: [
      'bug:ticket:my',
      'bug:ticket:add',
      'bug:ticket:query',
      'bug:ticket:reopen',
    ],
  },
  {
    roleKey: 'bug_project_owner',
    securityLevel: 600,
    roleName: '项目负责人',
    roleSort: 20,
    remark: '管理项目内缺陷、成员、分派和统计',
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
      'bug:project:add',
      'bug:project:edit',
      'bug:project:member',
      'bug:statistics:view',
    ],
  },
  {
    roleKey: 'bug_product_owner',
    securityLevel: 550,
    roleName: '产品负责人',
    roleSort: 21,
    remark: '确认缺陷有效性并参与分派处理',
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
]

const accounts = [
  {
    userName: 'project_owner',
    nickName: '项目负责人',
    roleKey: 'bug_project_owner',
    deptName: '技术部',
    email: 'project_owner@example.com',
    phonenumber: '13800002001',
    projectMemberRole: 'owner',
  },
  {
    userName: 'product_owner',
    nickName: '产品负责人',
    roleKey: 'bug_product_owner',
    deptName: '技术部',
    email: 'product_owner@example.com',
    phonenumber: '13800002002',
    projectMemberRole: 'product',
  },
  {
    userName: 'reviewer01',
    nickName: '审核人员',
    roleKey: 'bug_reviewer',
    deptName: '技术部',
    email: 'reviewer01@example.com',
    phonenumber: '13800002003',
    projectMemberRole: 'reviewer',
  },
  {
    userName: 'developer01',
    nickName: '开发一号',
    roleKey: 'bug_developer',
    deptName: '研发一部',
    email: 'developer01@example.com',
    phonenumber: '13800002004',
    projectMemberRole: 'developer',
  },
  {
    userName: 'developer02',
    nickName: '开发二号',
    roleKey: 'bug_developer',
    deptName: '研发一部',
    email: 'developer02@example.com',
    phonenumber: '13800002005',
    projectMemberRole: 'developer',
  },
  {
    userName: 'tester01',
    nickName: '测试一号',
    roleKey: 'bug_tester',
    deptName: '测试一部',
    email: 'tester01@example.com',
    phonenumber: '13800002006',
    projectMemberRole: 'tester',
  },
  {
    userName: 'submitter01',
    nickName: '提交人一号',
    roleKey: 'bug_submitter',
    deptName: '测试一部',
    email: 'submitter01@example.com',
    phonenumber: '13800002007',
    projectMemberRole: undefined,
  },
]

const deprecatedRoleKeys = ['developer', 'tester', 'reviewer', 'pm_manager', 'bug_operator', 'bug_viewer']
const deprecatedUserNames = ['developer', 'tester', 'reviewer', 'bug_owner', 'bug_product', 'bug_reviewer', 'bug_dev01', 'bug_dev02', 'bug_tester01', 'bug_submitter01', 'bug_viewer01', 'viewer01']

async function ensureRole(role) {
  const existed = await prisma.sysRole.findFirst({
    where: { roleKey: role.roleKey, delFlag: '0' },
  })
  const data = {
    roleName: role.roleName,
    roleSort: role.roleSort,
    securityLevel: role.securityLevel,
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
    status: '0',
    deptId,
    email: account.email,
    phonenumber: account.phonenumber,
    sex: '2',
    remark: `${account.nickName}演示账号，初始密码可按需修改`,
  }
  const user = existed
    ? await prisma.sysUser.update({ where: { userId: existed.userId }, data })
    : await prisma.sysUser.create({ data: { ...data, userName: account.userName, password: passwordHash } })

  await prisma.sysUserRole.createMany({
    data: [{ userId: user.userId, roleId: role.roleId }],
    skipDuplicates: true,
  })
  return user
}

async function demoMembershipProjects(ownerUserId) {
  return prisma.bugProject.findMany({
    where: { ownerId: ownerUserId, delFlag: '0', status: '0' },
    select: { projectId: true, projectName: true },
  })
}

async function pruneDemoMemberships(ensuredAccounts, projects) {
  const projectIds = projects.map((project) => project.projectId)
  for (const { account, user } of ensuredAccounts) {
    const where = account.projectMemberRole && projectIds.length
      ? {
          userId: user.userId,
          status: '0',
          OR: [
            { projectId: { notIn: projectIds } },
            { memberRole: { not: account.projectMemberRole } },
          ],
        }
      : { userId: user.userId, status: '0' }
    await prisma.bugProjectMember.updateMany({ where, data: { status: '1' } })
  }
}

async function ensureProjectMembership(userId, memberRole, projects) {
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

async function deactivateDeprecatedRolesAndUsers() {
  await prisma.$executeRawUnsafe(`
    update sys_role
       set role_key = concat(role_key, '_deprecated_', role_id),
           status = '1',
           del_flag = '2',
           remark = '已由规范业务角色替代，逻辑删除以避免角色列表重复',
           update_time = now()
     where role_key in (${deprecatedRoleKeys.map((key) => `'${key}'`).join(',')})
       and del_flag = '0'
  `)
  await prisma.$executeRawUnsafe(`
    update sys_user
       set user_name = concat(user_name, '_deprecated_', user_id),
           status = '1',
           del_flag = '2',
           remark = '重复演示账号，已逻辑删除；请使用规范业务账号',
           update_time = now()
     where user_name in (${deprecatedUserNames.map((name) => `'${name}'`).join(',')})
       and del_flag = '0'
  `)
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
  const ensuredAccounts = []
  for (const account of accounts) {
    const user = await ensureAccount(account, passwordHash)
    ensuredAccounts.push({ account, user })
  }

  const ownerEntry = ensuredAccounts.find((item) => item.account.projectMemberRole === 'owner')
  const projects = ownerEntry ? await demoMembershipProjects(ownerEntry.user.userId) : []
  await pruneDemoMemberships(ensuredAccounts, projects)
  for (const { account, user } of ensuredAccounts) {
    const projectCount = account.projectMemberRole
      ? await ensureProjectMembership(user.userId, account.projectMemberRole, projects)
      : 0
    console.log(
      `Ensured account: ${account.nickName} (${account.userName}), projects: ${projectCount}`,
    )
  }
  await deactivateDeprecatedRolesAndUsers()
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

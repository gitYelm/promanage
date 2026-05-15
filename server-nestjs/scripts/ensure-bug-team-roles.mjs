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
    roleKey: 'tester',
    roleName: '测试人员',
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
      'bug:comment:add',
      'bug:attachment:upload',
      'bug:attachment:preview',
    ],
  },
  {
    roleKey: 'developer',
    roleName: '开发人员',
    roleSort: 31,
    remark: '查看 Bug、开始修复、提交验证并补充修复说明',
    permissions: [
      'bug:ticket:my',
      'bug:ticket:query',
      'bug:ticket:list',
      'bug:ticket:startFix',
      'bug:ticket:submitVerify',
      'bug:comment:add',
      'bug:attachment:upload',
      'bug:attachment:preview',
    ],
  },
  {
    roleKey: 'reviewer',
    roleName: '审核人员',
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
      'bug:comment:add',
      'bug:attachment:preview',
    ],
  },
]

const accounts = [
  {
    userName: 'tester',
    nickName: '测试人员',
    roleKey: 'tester',
    deptName: '测试一部',
    email: 'tester@example.com',
    phonenumber: '13800001001',
    projectMemberRole: 'tester',
  },
  {
    userName: 'developer',
    nickName: '开发人员',
    roleKey: 'developer',
    deptName: '研发一部',
    email: 'developer@example.com',
    phonenumber: '13800001002',
    projectMemberRole: 'developer',
  },
  {
    userName: 'reviewer',
    nickName: '审核人员',
    roleKey: 'reviewer',
    deptName: '技术部',
    email: 'reviewer@example.com',
    phonenumber: '13800001003',
    projectMemberRole: 'product',
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
  const menus = await prisma.sysMenu.findMany({
    where: {
      status: '0',
      OR: [
        { path: '/bug' },
        { perms: { in: permissions } },
        { perms: { in: ['bug:ticket:list', 'bug:ticket:my', 'bug:ticket:add'] } },
      ],
    },
    select: { menuId: true },
  })
  return menus.map((item) => item.menuId)
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

async function main() {
  for (const roleConfig of roles) {
    const role = await ensureRole(roleConfig)
    const menuIds = await menuIdsForPermissions(roleConfig.permissions)
    await prisma.sysRoleMenu.createMany({
      data: menuIds.map((menuId) => ({ roleId: role.roleId, menuId })),
      skipDuplicates: true,
    })
    console.log(`Ensured role: ${roleConfig.roleName} (${roleConfig.roleKey})`)
  }

  const passwordHash = await bcrypt.hash(defaultPassword, 10)
  for (const account of accounts) {
    const user = await ensureAccount(account, passwordHash)
    const projectCount = await ensureProjectMembership(user.userId, account.projectMemberRole)
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

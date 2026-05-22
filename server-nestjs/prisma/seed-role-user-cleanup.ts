import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const roleNames = [
  ['bug_project_owner', '项目负责人', 20, 600, '负责项目配置、成员维护、缺陷分派、项目进度和统计'],
  ['bug_product_owner', '产品负责人', 21, 550, '负责需求确认、缺陷有效性判断、优先级和业务验收'],
  ['bug_reviewer', '审核人员', 22, 520, '负责缺陷审核、驳回、标记重复和分派开发'],
  ['bug_developer', '开发人员', 23, 400, '处理分派给自己的缺陷并提交验证'],
  ['bug_tester', '测试人员', 24, 350, '提交、验证、关闭或重新打开缺陷'],
  ['bug_submitter', '提交人', 25, 100, '提交并跟踪本人缺陷'],
  ['pm_executive', '管理层', 26, 700, '查看项目仪表盘和项目进度摘要'],
] as const

const workspaceConfigs = [
  [
    'bug_project_owner',
    '/project-management/overview',
    '/project-management/executive-dashboard',
    '/project-management',
    '项目负责人默认查看项目概览',
  ],
  [
    'bug_product_owner',
    '/project-management/requirements',
    '/project-management/executive-dashboard',
    '/project-management',
    '产品负责人默认查看需求管理',
  ],
  ['bug_reviewer', '/bug/tickets', '/bug/statistics', '/bug', '审核人员默认查看缺陷列表'],
  ['bug_developer', '/bug/my', '/bug/statistics', '/bug', '开发人员默认进入我的缺陷'],
  ['bug_tester', '/bug/my', '/bug/statistics', '/bug', '测试人员默认进入我的缺陷'],
  ['bug_submitter', '/bug/create', '/bug/my', '/bug', '提交人默认进入提交缺陷'],
  [
    'pm_executive',
    '/project-management/executive-dashboard',
    '/project-management/executive-dashboard',
    '/project-management',
    '管理层默认查看项目仪表盘',
  ],
] as const

const accountNameMappings = [
  [
    'bug_owner',
    'project_owner',
    '项目负责人',
    'project_owner@example.com',
    '项目负责人演示账号，初始密码可按需修改',
  ],
  [
    'bug_product',
    'product_owner',
    '产品负责人',
    'product_owner@example.com',
    '产品负责人演示账号，初始密码可按需修改',
  ],
  [
    'bug_reviewer',
    'reviewer01',
    '审核人员',
    'reviewer01@example.com',
    '审核人员演示账号，初始密码可按需修改',
  ],
  [
    'bug_dev01',
    'developer01',
    '开发一号',
    'developer01@example.com',
    '开发一号演示账号，初始密码可按需修改',
  ],
  [
    'bug_dev02',
    'developer02',
    '开发二号',
    'developer02@example.com',
    '开发二号演示账号，初始密码可按需修改',
  ],
  [
    'bug_tester01',
    'tester01',
    '测试一号',
    'tester01@example.com',
    '测试一号演示账号，初始密码可按需修改',
  ],
  [
    'bug_submitter01',
    'submitter01',
    '提交人一号',
    'submitter01@example.com',
    '提交人一号演示账号，初始密码可按需修改',
  ],
] as const

const legacyRoleKeyMappings = [
  ['project_owner', 'bug_project_owner'],
  ['product_owner', 'bug_product_owner'],
  ['reviewer', 'bug_reviewer'],
  ['developer', 'bug_developer'],
  ['tester', 'bug_tester'],
  ['submitter', 'bug_submitter'],
] as const

async function main() {
  await renameKeptRoles()
  await normalizeActiveAccountNames()
  await updateKeptUserProfiles()
  await migrateDuplicateUserReferences()
  await migrateLegacyRoleBindings()
  await deactivateDuplicateRolesAndUsers()
  await removeAdminBusinessRoleBindings()
  await pruneDemoAccountProjectMemberships()
  await ensureWorkspaceConfigs()
  console.log('Cleaned duplicate business roles and normalized user names')
}

async function renameKeptRoles() {
  for (const [roleKey, roleName, roleSort, securityLevel, remark] of roleNames) {
    await prisma.sysRole.upsert({
      where: { roleKey_delFlag: { roleKey, delFlag: '0' } },
      update: { roleName, roleSort, securityLevel, remark, status: '0' },
      create: { roleKey, roleName, roleSort, securityLevel, remark, status: '0', dataScope: '2' },
    })
  }
}

async function normalizeActiveAccountNames() {
  for (const [fromUserName, toUserName, nickName, email, remark] of accountNameMappings) {
    const from = await findActiveUser(fromUserName)
    if (!from) continue
    const to = await findActiveUser(toUserName)
    if (to) {
      // 避免用户名唯一约束冲突：目标账号已存在时合并历史引用，再停用旧账号。
      await moveUserReferences(from.userId, to.userId)
      await deactivateUser(from.userId, `历史账号 ${fromUserName} 已合并到规范账号 ${toUserName}`)
      continue
    }
    await prisma.sysUser.update({
      where: { userId: from.userId },
      data: { userName: toUserName, nickName, email, remark, status: '0' },
    })
  }
}

async function updateKeptUserProfiles() {
  for (const [, userName, nickName, email, remark] of accountNameMappings) {
    await prisma.sysUser.updateMany({
      where: { userName, delFlag: '0' },
      data: { nickName, email, remark, status: '0' },
    })
  }
}

async function migrateDuplicateUserReferences() {
  const pairs = [
    ['developer', 'developer01'],
    ['tester', 'tester01'],
    ['reviewer', 'reviewer01'],
  ] as const
  for (const [fromUserName, toUserName] of pairs) {
    const from = await findActiveUser(fromUserName)
    const to = await findActiveUser(toUserName)
    if (!from || !to) continue
    await moveUserReferences(from.userId, to.userId)
  }
}

async function findActiveUser(userName: string) {
  return prisma.sysUser.findFirst({ where: { userName, delFlag: '0' }, select: { userId: true } })
}

async function moveUserReferences(fromUserId: bigint, toUserId: bigint) {
  await mergeProjectMembers(fromUserId, toUserId)
  const roles = await prisma.sysUserRole.findMany({
    where: { userId: fromUserId },
    select: { roleId: true },
  })
  if (roles.length) {
    await prisma.sysUserRole.createMany({
      data: roles.map((role) => ({ userId: toUserId, roleId: role.roleId })),
      skipDuplicates: true,
    })
  }
  const posts = await prisma.sysUserPost.findMany({
    where: { userId: fromUserId },
    select: { postId: true },
  })
  if (posts.length) {
    await prisma.sysUserPost.createMany({
      data: posts.map((post) => ({ userId: toUserId, postId: post.postId })),
      skipDuplicates: true,
    })
  }
  await prisma.bugTicket.updateMany({
    where: { assigneeId: fromUserId },
    data: { assigneeId: toUserId },
  })
  await prisma.bugTicket.updateMany({
    where: { verifierId: fromUserId },
    data: { verifierId: toUserId },
  })
  await prisma.projectRequirement.updateMany({
    where: { ownerId: fromUserId },
    data: { ownerId: toUserId },
  })
  await prisma.projectRequirement.updateMany({
    where: { developerId: fromUserId },
    data: { developerId: toUserId },
  })
  await prisma.projectRequirement.updateMany({
    where: { testerId: fromUserId },
    data: { testerId: toUserId },
  })
  await prisma.projectIteration.updateMany({
    where: { ownerId: fromUserId },
    data: { ownerId: toUserId },
  })
  await prisma.projectMilestone.updateMany({
    where: { ownerId: fromUserId },
    data: { ownerId: toUserId },
  })
  await prisma.bugTicket.updateMany({
    where: { submitterId: fromUserId },
    data: { submitterId: toUserId },
  })
  await prisma.bugComment.updateMany({ where: { userId: fromUserId }, data: { userId: toUserId } })
  await prisma.bugAttachment.updateMany({
    where: { uploaderId: fromUserId },
    data: { uploaderId: toUserId },
  })
  await prisma.bugHistory.updateMany({
    where: { operatorId: fromUserId },
    data: { operatorId: toUserId },
  })
  await prisma.projectActivity.updateMany({
    where: { operatorId: fromUserId },
    data: { operatorId: toUserId },
  })
  await prisma.bugProject.updateMany({
    where: { ownerId: fromUserId },
    data: { ownerId: toUserId },
  })
  await prisma.bugProjectModule.updateMany({
    where: { defaultAssigneeId: fromUserId },
    data: { defaultAssigneeId: toUserId },
  })
  await prisma.sysUserNotification.updateMany({
    where: { recipientId: fromUserId },
    data: { recipientId: toUserId },
  })
  await prisma.sysUserNotification.updateMany({
    where: { actorId: fromUserId },
    data: { actorId: toUserId },
  })
}

async function deactivateUser(userId: bigint, remark: string) {
  await prisma.sysUser.update({
    where: { userId },
    data: {
      userName: `deprecated_${userId.toString()}`,
      status: '1',
      delFlag: '2',
      remark,
    },
  })
}

async function mergeProjectMembers(fromUserId: bigint, toUserId: bigint) {
  const members = await prisma.bugProjectMember.findMany({ where: { userId: fromUserId } })
  for (const member of members) {
    const target = await prisma.bugProjectMember.findFirst({
      where: { projectId: member.projectId, userId: toUserId, memberRole: member.memberRole },
      select: { memberId: true },
    })
    if (target) await prisma.bugProjectMember.delete({ where: { memberId: member.memberId } })
    else
      await prisma.bugProjectMember.update({
        where: { memberId: member.memberId },
        data: { userId: toUserId, status: '0' },
      })
  }
}

async function deactivateDuplicateRolesAndUsers() {
  await migrateLegacyRoleBindings()
  await prisma.$executeRaw`
    update sys_role
       set role_key = concat(role_key, '_deprecated_', role_id),
           status = '1',
           del_flag = '2',
           remark = '已由规范业务角色替代，逻辑删除以避免角色列表重复',
           update_time = now()
     where role_key in ('project_owner', 'product_owner', 'reviewer', 'developer', 'tester', 'submitter', 'pm_manager', 'bug_operator', 'bug_viewer')
       and del_flag = '0'
  `
  await prisma.$executeRaw`
    update sys_user
       set user_name = concat(user_name, '_deprecated_', user_id),
           status = '1',
           del_flag = '2',
           remark = '重复演示账号，已逻辑删除；请使用规范业务账号',
           update_time = now()
     where user_name in ('developer', 'tester', 'reviewer', 'bug_viewer01', 'viewer01')
       and del_flag = '0'
  `
  await prisma.$executeRaw`
    update sys_role
       set role_name = case
             when role_key like 'bug_operator_deprecated_%' then '运营客服（已停用）'
             when role_key like 'bug_viewer_deprecated_%' then '观察者（已停用）'
             when role_key like 'developer_deprecated_%' then '开发人员（已停用）'
             when role_key like 'tester_deprecated_%' then '测试人员（已停用）'
             when role_key like 'reviewer_deprecated_%' then '审核人员（已停用）'
             when role_key like 'pm_manager_deprecated_%' then '项目管理负责人（已停用）'
             else role_name
           end,
           update_time = now()
     where del_flag = '2'
  `
  await prisma.$executeRaw`
    update sys_user
       set nick_name = case
             when user_name like 'bug_viewer01_deprecated_%' then '观察者一号（已停用）'
             when user_name like 'viewer01_deprecated_%' then '观察者一号（已停用）'
             when user_name like 'developer_deprecated_%' then '开发人员（已停用）'
             when user_name like 'tester_deprecated_%' then '测试人员（已停用）'
             when user_name like 'reviewer_deprecated_%' then '审核人员（已停用）'
             else nick_name
           end,
           update_time = now()
     where del_flag = '2'
  `
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

async function removeAdminBusinessRoleBindings() {
  const admin = await prisma.sysUser.findFirst({
    where: { userName: 'admin', delFlag: '0' },
    select: { userId: true },
  })
  if (!admin) return
  const roles = await prisma.sysRole.findMany({
    where: { roleKey: { in: roleNames.map(([roleKey]) => roleKey) }, delFlag: '0' },
    select: { roleId: true },
  })
  await prisma.sysUserRole.deleteMany({
    where: { userId: admin.userId, roleId: { in: roles.map((role) => role.roleId) } },
  })
}

async function pruneDemoAccountProjectMemberships() {
  const accounts = await prisma.sysUser.findMany({
    where: { userName: { in: accountNameMappings.map(([, userName]) => userName) }, delFlag: '0' },
    select: { userId: true, userName: true },
  })
  const owner = accounts.find((user) => user.userName === 'project_owner')
  const allowedProjects = owner
    ? await prisma.bugProject.findMany({
        where: { ownerId: owner.userId, delFlag: '0', status: '0' },
        select: { projectId: true },
      })
    : []
  const allowedProjectIds = allowedProjects.map((project) => project.projectId)
  for (const account of accounts) {
    const memberRole = demoMemberRole(account.userName)
    const where =
      memberRole && allowedProjectIds.length
        ? {
            userId: account.userId,
            status: '0',
            OR: [{ projectId: { notIn: allowedProjectIds } }, { memberRole: { not: memberRole } }],
          }
        : { userId: account.userId, status: '0' }
    await prisma.bugProjectMember.updateMany({ where, data: { status: '1' } })
  }
}

function demoMemberRole(userName: string) {
  const roleByUserName: Record<string, string | undefined> = {
    project_owner: 'owner',
    product_owner: 'product',
    reviewer01: 'reviewer',
    developer01: 'developer',
    developer02: 'developer',
    tester01: 'tester',
    submitter01: undefined,
  }
  return roleByUserName[userName]
}

async function ensureWorkspaceConfigs() {
  const table = await prisma.$queryRaw<Array<{ name: string | null }>>`
    select to_regclass('public.sys_role_workspace_config')::text as name
  `
  if (!table[0]?.name) return
  await prisma.$executeRaw`
    delete from sys_role_workspace_config
     where role_key in ('project_owner', 'product_owner', 'reviewer', 'developer', 'tester', 'submitter', 'pm_manager', 'bug_operator', 'bug_viewer')
  `
  for (const [roleKey, defaultPath, dashboardPath, defaultOpenMenu, remark] of workspaceConfigs) {
    await prisma.$executeRaw`
      update sys_role_workspace_config
         set default_path = ${defaultPath},
             dashboard_path = ${dashboardPath},
             default_open_menu = ${defaultOpenMenu},
             menu_scope = 'business',
             status = '0',
             remark = ${remark},
             update_time = now()
       where role_key = ${roleKey}
    `
    await prisma.$executeRaw`
      insert into sys_role_workspace_config
        (role_key, default_path, dashboard_path, default_open_menu, menu_scope, status, remark, create_time, update_time)
      select ${roleKey}, ${defaultPath}, ${dashboardPath}, ${defaultOpenMenu}, 'business', '0', ${remark}, now(), now()
      where not exists (select 1 from sys_role_workspace_config where role_key = ${roleKey})
    `
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

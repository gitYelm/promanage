import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const projectKey = 'FLYCARD'
const operatorName = 'flycard-dev2-import'

const moduleNames = [
  '项目基线',
  '信件服务',
  '商城交易',
  '地址/监区',
  '审核与消息',
  '小程序端',
  '后台运营',
  'UI 与组件',
]

type RequirementSeed = {
  no: string
  title: string
  module: string
  type: string
  priority: string
  status: string
  plannedStart: string
  plannedEnd: string
  actualEnd?: string
  description: string
  acceptance: string
  remark: string
}

type BugSeed = {
  no: string
  title: string
  module: string
  severity: string
  priority: string
  status: string
  description: string
  actual: string
  expected: string
  steps: string
  due?: string
}

const iterations = [
  ['dev2-接手与基线整理', 'completed', '2026-04-18', '2026-04-20', '初始化、代码接入、文档与规则补齐'],
  ['dev2-信件服务与客服能力', 'completed', '2026-04-24', '2026-04-30', '信件商品化、信件配置、律师服务、回信/客服、上传登录态修复'],
  ['dev2-交易闭环与审核能力', 'completed', '2026-05-01', '2026-05-12', 'UI 优化、文件类型扩展、普通/信件下单、监区地址、消息订阅、审核模块'],
  ['dev2-小程序问题收敛', 'testing', '2026-05-13', '2026-05-14', '首页展示、注册、回信配送、小程序端问题集中修复，需回归验证'],
] as const

const milestones = [
  ['项目可接手基线完成', 'requirement', 'achieved', '2026-04-20', '文档、规则、初始化数据库和原始代码已纳入管理'],
  ['信件服务商品化完成', 'development', 'achieved', '2026-04-29', '信件配置、信件服务、律师服务、回信/客服主要能力可联调'],
  ['下单与地址主链路完成', 'self_test', 'achieved', '2026-05-09', '普通商品下单、信件商品下单、监区地址链路完成'],
  ['审核与消息能力完成', 'internal_test', 'achieved', '2026-05-12', '审核人员、订单审核、审核配置、消息订阅能力完成'],
  ['小程序端问题修复回归', 'internal_test', 'in_progress', '2026-05-14', '小程序端订单、信件、购物车、商品详情、后台详情完成回归'],
] as const

const requirements: RequirementSeed[] = [
  req('FLY-REQ-001', '项目接手基线与规范文档整理', '项目基线', 'technical', 'medium', 'closed', '2026-04-18', '2026-04-20', '2026-04-20', '建立项目结构、接手文档、规则与待处理清单。', '初始化目录、接手文档、项目规则与待处理清单可被后续开发引用。', '证据：cb044d6、ef305a4、143b37b'),
  req('FLY-REQ-002', '初始化数据库与 FastAdmin 插件能力补齐', '项目基线', 'technical', 'high', 'closed', '2026-04-18', '2026-04-25', '2026-04-25', '补充初始化数据库、FA 插件并升级后台版本。', '本地初始化数据库资料可用，后台依赖能力满足继续开发。', '证据：d5431d0、c4951d2、48f7426'),
  req('FLY-REQ-003', '信件服务商品化与计价模型', '信件服务', 'feature', 'urgent', 'released', '2026-04-24', '2026-05-09', '2026-05-14', '将信件服务抽象为商品，承接信件商品下单和订单模型。', '信件商品可参与下单，信件订单和金额口径可在前后台追踪。', '证据：9dff62d、b5d270b、5041585'),
  req('FLY-REQ-004', '信件后台配置能力', '信件服务', 'feature', 'high', 'accepted', '2026-04-25', '2026-05-13', '2026-05-13', '信件入口、背景、价格、文案、页面展示配置。', '运营可维护信件配置，小程序端按配置展示入口与文案。', '证据：c1e36a5、057998a'),
  req('FLY-REQ-005', '信件服务与律师服务完善', '信件服务', 'feature', 'high', 'accepted', '2026-04-27', '2026-05-12', '2026-05-12', '完善信件/律师服务页面、后台模型与配置。', '律师服务入口与后台维护能力可用，移动端展示正常。', '证据：23fbe42、3aa604d'),
  req('FLY-REQ-006', '回信功能与客服功能', '信件服务', 'feature', 'high', 'accepted', '2026-04-29', '2026-05-13', '2026-05-13', '回信配置、回信记录、配送、客服入口和后台处理页。', '后台可处理回信相关记录，前台客服入口与回信流程可联调。', '证据：bcc4626、057998a'),
  req('FLY-REQ-007', '普通商品下单全流程', '商城交易', 'feature', 'urgent', 'accepted', '2026-05-09', '2026-05-14', '2026-05-14', '购物车、结算、普通订单、支付、订单详情链路。', '普通商品可完成从详情/购物车到下单、支付、订单详情的完整流程。', '证据：b5d270b、5041585'),
  req('FLY-REQ-008', '监区地址与区域管理', '地址/监区', 'feature', 'high', 'accepted', '2026-05-09', '2026-05-09', '2026-05-09', '新增监区地址、监区区域和后台维护能力。', '后台可维护监区地址/区域，移动端地址选择与订单地址可用。', '证据：b5d270b、404c6da'),
  req('FLY-REQ-009', '微信订阅消息与开发者模式', '审核与消息', 'feature', 'high', 'testing', '2026-05-09', '2026-05-12', undefined, '微信服务、订阅消息、开发者模式配置。', '小程序支付、订单、审核等关键事件可触发订阅消息授权和发送。', '证据：404c6da'),
  req('FLY-REQ-010', '订单审核模式与审核人员管理', '审核与消息', 'feature', 'urgent', 'testing', '2026-05-09', '2026-05-12', undefined, '审核人员、订单审核、审核详情、审核配置和后台菜单。', '后台可配置审核模式和审核人员，订单审核流程可闭环。', '证据：404c6da、8a7f3f4、3aa604d'),
  req('FLY-REQ-011', 'Uniapp 自定义组件与图标库', 'UI 与组件', 'ux', 'medium', 'accepted', '2026-05-01', '2026-05-01', '2026-05-01', '自定义组件、图标、页面基础体验升级。', 'Uniapp 公共组件和图标资源可复用。', '证据：8ea2eaf'),
  req('FLY-REQ-012', '全站 UI 视觉与交互优化', 'UI 与组件', 'ux', 'medium', 'accepted', '2026-05-08', '2026-05-13', '2026-05-13', '首页、分类、购物车、订单、地址、律师页等界面优化。', '核心页面视觉和交互体验完成统一优化。', '证据：af48edd、057998a'),
  req('FLY-REQ-013', '上传文件类型扩展', '商城交易', 'improvement', 'medium', 'accepted', '2026-05-06', '2026-05-06', '2026-05-06', '扩展后台上传文件类型，适配业务附件需求。', '上传配置支持业务所需新增文件类型。', '证据：a151346'),
  req('FLY-REQ-014', '小程序端问题集中修复与回归', '小程序端', 'improvement', 'high', 'testing', '2026-05-13', '2026-05-14', undefined, '信件、订单、购物车、商品详情、首页、律师页等小程序问题收敛。', '小程序端核心链路完成回归验证后可进入发布准备。', '证据：5041585'),
]

const bugs: BugSeed[] = [
  bug('FLY-BUG-001', '登录态导致图片上传失败', '小程序端', 'critical', 'high', 'closed', '图片上传受登录态或请求拦截影响失败。', '用户登录后上传图片可能失败或被拦截。', '登录状态下图片上传稳定成功。', '登录小程序后进入图片上传场景并选择图片。'),
  bug('FLY-BUG-002', '审核模式开发阶段订单/登录/售后/评论页面问题', '审核与消息', 'major', 'high', 'closed', '审核模式引入后，订单、登录、售后、评论等接口和页面存在联动问题。', '相关接口或页面在审核模式下表现异常。', '审核模式下订单、售后、评论、登录相关页面可正常使用。', '启用审核模式后依次访问订单、售后、评论、登录相关页面。'),
  bug('FLY-BUG-003', '首页展示异常与局部页面问题', '小程序端', 'major', 'medium', 'closed', '首页展示、律师页、注册页、回信配送和信件配置存在细节问题。', '首页或局部页面展示不符合预期。', '首页和相关页面按最新配置展示。', '打开首页、律师页、注册页和回信配送页面。'),
  bug('FLY-BUG-004', '小程序端信件/订单/购物车/商品详情问题集中修复', '小程序端', 'critical', 'high', 'pending_verify', '小程序端信件、订单、购物车、商品详情等核心链路问题集中修复后待验证。', '核心链路存在多处小程序端问题。', '信件、订单、购物车、商品详情链路回归通过。', '按小程序端完整业务路径进行回归。', '2026-05-20'),
  bug('FLY-BUG-005', '订单/信件后台详情展示细节问题', '后台运营', 'major', 'medium', 'pending_verify', '订单、订单审核、信件订单详情等后台模板展示需回归。', '后台详情展示字段、信件内容或状态可能不完整。', '后台详情页能完整展示订单、信件内容、审核状态和操作记录。', '后台打开订单详情、订单审核详情、信件订单详情。', '2026-05-20'),
]

function req(no: string, title: string, module: string, type: string, priority: string, status: string, plannedStart: string, plannedEnd: string, actualEnd: string | undefined, description: string, acceptance: string, remark: string): RequirementSeed {
  return { no, title, module, type, priority, status, plannedStart, plannedEnd, actualEnd, description, acceptance, remark }
}

function bug(no: string, title: string, module: string, severity: string, priority: string, status: string, description: string, actual: string, expected: string, steps: string, due?: string): BugSeed {
  return { no, title, module, severity, priority, status, description, actual, expected, steps, due }
}

const toDate = (value?: string) => (value ? new Date(`${value}T00:00:00.000Z`) : undefined)

async function main() {
  const operator = await prisma.sysUser.findFirst({ where: { delFlag: '0', status: '0' }, orderBy: { userId: 'asc' } })
  if (!operator) throw new Error('未找到可用用户，无法导入 Flycard dev2 项目数据。')

  const project = await prisma.bugProject.upsert({
    where: { projectKey_delFlag: { projectKey, delFlag: '0' } },
    update: {
      projectName: 'Flycard 监所通信商城系统',
      ownerId: operator.userId,
      description: '基于 flycard-dev2 Git 提交日志整理导入：微邮筒信件服务 + 通用电商交易 + 后台运营/审核/客服处理。',
      projectStage: 'internal_test',
      plannedStartTime: toDate('2026-04-18'),
      plannedEndTime: toDate('2026-05-20'),
      actualStartTime: toDate('2026-04-18'),
      progress: 88,
      riskLevel: 'medium',
      riskNote: '小程序端问题已集中修复，但仍需回归验证订单、信件、审核、支付和后台详情链路。',
      status: '0',
    },
    create: {
      projectName: 'Flycard 监所通信商城系统',
      projectKey,
      ownerId: operator.userId,
      description: '基于 flycard-dev2 Git 提交日志整理导入：微邮筒信件服务 + 通用电商交易 + 后台运营/审核/客服处理。',
      projectStage: 'internal_test',
      plannedStartTime: toDate('2026-04-18'),
      plannedEndTime: toDate('2026-05-20'),
      actualStartTime: toDate('2026-04-18'),
      progress: 88,
      riskLevel: 'medium',
      riskNote: '小程序端问题已集中修复，但仍需回归验证订单、信件、审核、支付和后台详情链路。',
      createBy: operatorName,
    },
  })

  const modules = await ensureModules(project.projectId, operator.userId)
  const iterationIds = await ensureIterations(project.projectId, operator.userId)
  const milestoneIds = await ensureMilestones(project.projectId, operator.userId)
  const version = await prisma.bugProjectVersion.upsert({
    where: { projectId_versionNo_delFlag: { projectId: project.projectId, versionNo: 'dev2', delFlag: '0' } },
    update: { versionName: 'dev2 内测版本', status: 'testing', iterationId: iterationIds.at(-1), milestoneId: milestoneIds.at(-1), releaseNote: '根据 flycard-dev2 提交日志整理的内测版本。' },
    create: { projectId: project.projectId, versionNo: 'dev2', versionName: 'dev2 内测版本', status: 'testing', iterationId: iterationIds.at(-1), milestoneId: milestoneIds.at(-1), releaseNote: '根据 flycard-dev2 提交日志整理的内测版本。' },
  })

  await ensureMember(project.projectId, operator.userId)
  await ensureRequirements(project.projectId, modules, version.versionId)
  await ensureBugs(project.projectId, modules, operator.userId, version.versionId)
  console.log(`Imported Flycard dev2 project data into ${project.projectName} (${projectKey}).`)
}

async function ensureModules(projectId: bigint, defaultAssigneeId: bigint) {
  const result = new Map<string, bigint>()
  for (const [index, moduleName] of moduleNames.entries()) {
    const existed = await prisma.bugProjectModule.findFirst({ where: { projectId, moduleName, delFlag: '0' } })
    const module = existed
      ? await prisma.bugProjectModule.update({ where: { moduleId: existed.moduleId }, data: { status: '0', orderNum: index + 1, defaultAssigneeId } })
      : await prisma.bugProjectModule.create({ data: { projectId, moduleName, orderNum: index + 1, defaultAssigneeId } })
    result.set(moduleName, module.moduleId)
  }
  return result
}

async function ensureIterations(projectId: bigint, ownerId: bigint) {
  const result: bigint[] = []
  for (const item of iterations) {
    const [iterationName, status, startDate, endDate, summary] = item
    const existed = await prisma.projectIteration.findFirst({ where: { projectId, iterationName, delFlag: '0' } })
    const iteration = existed
      ? await prisma.projectIteration.update({ where: { iterationId: existed.iterationId }, data: { status, ownerId, startDate: toDate(startDate), endDate: toDate(endDate), summary } })
      : await prisma.projectIteration.create({ data: { projectId, iterationName, status, ownerId, startDate: toDate(startDate), endDate: toDate(endDate), summary } })
    result.push(iteration.iterationId)
  }
  return result
}

async function ensureMilestones(projectId: bigint, ownerId: bigint) {
  const result: bigint[] = []
  for (const item of milestones) {
    const [milestoneName, stage, status, targetDate, completionCriteria] = item
    const existed = await prisma.projectMilestone.findFirst({ where: { projectId, milestoneName, delFlag: '0' } })
    const data = { stage, status, ownerId, targetDate: toDate(targetDate), completedTime: status === 'achieved' ? toDate(targetDate) : undefined, completionCriteria }
    const milestone = existed
      ? await prisma.projectMilestone.update({ where: { milestoneId: existed.milestoneId }, data })
      : await prisma.projectMilestone.create({ data: { projectId, milestoneName, ...data } })
    result.push(milestone.milestoneId)
  }
  return result
}

async function ensureMember(projectId: bigint, userId: bigint) {
  await prisma.bugProjectMember.upsert({
    where: { projectId_userId_memberRole: { projectId, userId, memberRole: 'owner' } },
    update: { status: '0', isDefault: true },
    create: { projectId, userId, memberRole: 'owner', isDefault: true },
  })
}

async function ensureRequirements(projectId: bigint, modules: Map<string, bigint>, versionId: bigint) {
  for (const item of requirements) {
    const moduleId = modules.get(item.module)
    await prisma.projectRequirement.upsert({
      where: { requirementNo: item.no },
      update: {
        title: item.title, projectId, moduleId, type: item.type, source: 'git-dev2', priority: item.priority, status: item.status,
        versionId, plannedStartTime: toDate(item.plannedStart), plannedEndTime: toDate(item.plannedEnd), actualEndTime: toDate(item.actualEnd),
        description: item.description, acceptanceCriteria: item.acceptance, remark: item.remark, updateBy: operatorName,
      },
      create: {
        requirementNo: item.no, title: item.title, projectId, moduleId, type: item.type, source: 'git-dev2', priority: item.priority, status: item.status,
        versionId, plannedStartTime: toDate(item.plannedStart), plannedEndTime: toDate(item.plannedEnd), actualEndTime: toDate(item.actualEnd),
        description: item.description, acceptanceCriteria: item.acceptance, remark: item.remark, createBy: operatorName,
      },
    })
  }
}

async function ensureBugs(projectId: bigint, modules: Map<string, bigint>, submitterId: bigint, versionId: bigint) {
  for (const item of bugs) {
    const moduleId = modules.get(item.module)
    await prisma.bugTicket.upsert({
      where: { ticketNo: item.no },
      update: {
        title: item.title, projectId, moduleId, versionId, type: 'function', severity: item.severity, priority: item.priority, status: item.status,
        description: item.description, reproduceSteps: item.steps, expectedResult: item.expected, actualResult: item.actual, submitterId, assigneeId: submitterId,
        dueTime: toDate(item.due), updateBy: operatorName,
      },
      create: {
        ticketNo: item.no, title: item.title, projectId, moduleId, versionId, type: 'function', severity: item.severity, priority: item.priority, status: item.status,
        description: item.description, reproduceSteps: item.steps, expectedResult: item.expected, actualResult: item.actual, submitterId, assigneeId: submitterId,
        dueTime: toDate(item.due), createBy: operatorName,
      },
    })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

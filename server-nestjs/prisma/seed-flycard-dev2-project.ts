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

// 受保护字段说明：当 FLYCARD 项目已存在时，脚本只更新需求、缺陷、迭代、里程碑、版本和模块归并数据；
// 不得覆盖项目名称、项目负责人、项目标识、业务描述、阶段、计划时间、进度和风险等项目基础信息。

type ModuleName = '小程序端' | '后台管理端'

type RequirementSeed = {
  no: string
  title: string
  module: ModuleName
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
  module: ModuleName
  severity: string
  priority: string
  status: string
  description: string
  actual: string
  expected: string
  steps: string
  due?: string
}

const moduleDefinitions: Array<{ name: ModuleName; orderNum: number; aliases: string[] }> = [
  { name: '小程序端', orderNum: 1, aliases: ['信件服务', '商城交易', '地址/监区', 'UI 与组件'] },
  { name: '后台管理端', orderNum: 2, aliases: ['管理端', '后台运营', '项目基线', '审核与消息'] },
]

const iterations = [
  [
    'dev2-接手与基线整理',
    'completed',
    '2026-04-18',
    '2026-04-20',
    '初始化、代码接入、文档与规则补齐',
  ],
  [
    'dev2-信件服务与客服能力',
    'completed',
    '2026-04-24',
    '2026-04-30',
    '信件商品化、信件配置、律师服务、回信/客服、上传登录态修复',
  ],
  [
    'dev2-交易闭环与审核能力',
    'completed',
    '2026-05-01',
    '2026-05-12',
    'UI 优化、文件类型扩展、普通/信件下单、监区地址、消息订阅、审核模块',
  ],
  [
    'dev2-小程序问题收敛',
    'testing',
    '2026-05-13',
    '2026-05-14',
    '首页展示、注册、回信配送、小程序端问题集中修复，需回归验证',
  ],
  [
    'dev2-订单律师支付补齐',
    'testing',
    '2026-05-15',
    '2026-05-18',
    '订单状态、售后展示、律师管理、律师分类、评价、退款单号、支付插件和第三方登录补齐',
  ],
] as const

const milestones = [
  [
    '项目可接手基线完成',
    'requirement',
    'achieved',
    '2026-04-20',
    '文档、规则、初始化数据库和原始代码已纳入管理',
  ],
  [
    '信件服务商品化完成',
    'development',
    'achieved',
    '2026-04-29',
    '信件配置、信件服务、律师服务、回信/客服主要能力可联调',
  ],
  [
    '下单与地址主链路完成',
    'self_test',
    'achieved',
    '2026-05-09',
    '普通商品下单、信件商品下单、监区地址链路完成',
  ],
  [
    '审核与消息能力完成',
    'internal_test',
    'achieved',
    '2026-05-12',
    '审核人员、订单审核、审核配置、消息订阅能力完成',
  ],
  [
    '小程序端问题修复回归',
    'internal_test',
    'in_progress',
    '2026-05-14',
    '小程序端订单、信件、购物车、商品详情、后台详情完成回归',
  ],
  [
    '订单律师支付补齐回归',
    'internal_test',
    'in_progress',
    '2026-05-20',
    '订单状态、售后、律师服务、退款单号、支付插件和第三方登录配置完成验证',
  ],
] as const

const requirements: RequirementSeed[] = [
  req(
    'FLY-REQ-001',
    '项目接手基线与规范文档整理',
    '后台管理端',
    'technical',
    'medium',
    'closed',
    '2026-04-18',
    '2026-04-20',
    '2026-04-20',
    '建立项目结构、接手文档、规则与待处理清单。',
    '初始化目录、接手文档、项目规则与待处理清单可被后续开发引用。',
    '证据：cb044d6、ef305a4、143b37b',
  ),
  req(
    'FLY-REQ-002',
    '初始化数据库与 FastAdmin 插件能力补齐',
    '后台管理端',
    'technical',
    'high',
    'closed',
    '2026-04-18',
    '2026-04-25',
    '2026-04-25',
    '补充初始化数据库、FA 插件并升级后台版本。',
    '本地初始化数据库资料可用，后台依赖能力满足继续开发。',
    '证据：d5431d0、c4951d2、48f7426',
  ),
  req(
    'FLY-REQ-003',
    '信件服务商品化与计价模型',
    '小程序端',
    'feature',
    'urgent',
    'released',
    '2026-04-24',
    '2026-05-09',
    '2026-05-14',
    '将信件服务抽象为商品，承接信件商品下单和订单模型。',
    '信件商品可参与下单，信件订单和金额口径可在前后台追踪。',
    '证据：9dff62d、b5d270b、5041585',
  ),
  req(
    'FLY-REQ-004',
    '信件后台配置能力',
    '后台管理端',
    'feature',
    'high',
    'accepted',
    '2026-04-25',
    '2026-05-13',
    '2026-05-13',
    '信件入口、背景、价格、文案、页面展示配置。',
    '运营可维护信件配置，小程序端按配置展示入口与文案。',
    '证据：c1e36a5、057998a',
  ),
  req(
    'FLY-REQ-005',
    '信件服务与律师服务完善',
    '小程序端',
    'feature',
    'high',
    'accepted',
    '2026-04-27',
    '2026-05-12',
    '2026-05-12',
    '完善信件/律师服务页面、后台模型与配置。',
    '律师服务入口与后台维护能力可用，移动端展示正常。',
    '证据：23fbe42、3aa604d',
  ),
  req(
    'FLY-REQ-006',
    '回信功能与客服功能',
    '小程序端',
    'feature',
    'high',
    'accepted',
    '2026-04-29',
    '2026-05-13',
    '2026-05-13',
    '回信配置、回信记录、配送、客服入口和后台处理页。',
    '后台可处理回信相关记录，前台客服入口与回信流程可联调。',
    '证据：bcc4626、057998a',
  ),
  req(
    'FLY-REQ-007',
    '普通商品下单全流程',
    '小程序端',
    'feature',
    'urgent',
    'accepted',
    '2026-05-09',
    '2026-05-14',
    '2026-05-14',
    '购物车、结算、普通订单、支付、订单详情链路。',
    '普通商品可完成从详情/购物车到下单、支付、订单详情的完整流程。',
    '证据：b5d270b、5041585',
  ),
  req(
    'FLY-REQ-008',
    '监区地址与区域管理',
    '小程序端',
    'feature',
    'high',
    'accepted',
    '2026-05-09',
    '2026-05-09',
    '2026-05-09',
    '新增监区地址、监区区域和后台维护能力。',
    '后台可维护监区地址/区域，移动端地址选择与订单地址可用。',
    '证据：b5d270b、404c6da',
  ),
  req(
    'FLY-REQ-009',
    '微信订阅消息与开发者模式',
    '小程序端',
    'feature',
    'high',
    'testing',
    '2026-05-09',
    '2026-05-12',
    undefined,
    '微信服务、订阅消息、开发者模式配置。',
    '小程序支付、订单、审核等关键事件可触发订阅消息授权和发送。',
    '证据：404c6da',
  ),
  req(
    'FLY-REQ-010',
    '订单审核模式与审核人员管理',
    '后台管理端',
    'feature',
    'urgent',
    'testing',
    '2026-05-09',
    '2026-05-12',
    undefined,
    '审核人员、订单审核、审核详情、审核配置和后台菜单。',
    '后台可配置审核模式和审核人员，订单审核流程可闭环。',
    '证据：404c6da、8a7f3f4、3aa604d',
  ),
  req(
    'FLY-REQ-011',
    'Uniapp 自定义组件与图标库',
    '小程序端',
    'ux',
    'medium',
    'accepted',
    '2026-05-01',
    '2026-05-01',
    '2026-05-01',
    '自定义组件、图标、页面基础体验升级。',
    'Uniapp 公共组件和图标资源可复用。',
    '证据：8ea2eaf',
  ),
  req(
    'FLY-REQ-012',
    '全站 UI 视觉与交互优化',
    '小程序端',
    'ux',
    'medium',
    'accepted',
    '2026-05-08',
    '2026-05-13',
    '2026-05-13',
    '首页、分类、购物车、订单、地址、律师页等界面优化。',
    '核心页面视觉和交互体验完成统一优化。',
    '证据：af48edd、057998a',
  ),
  req(
    'FLY-REQ-013',
    '上传文件类型扩展',
    '后台管理端',
    'improvement',
    'medium',
    'accepted',
    '2026-05-06',
    '2026-05-06',
    '2026-05-06',
    '扩展后台上传文件类型，适配业务附件需求。',
    '上传配置支持业务所需新增文件类型。',
    '证据：a151346',
  ),
  req(
    'FLY-REQ-014',
    '小程序端问题集中修复与回归',
    '小程序端',
    'improvement',
    'high',
    'testing',
    '2026-05-13',
    '2026-05-14',
    undefined,
    '信件、订单、购物车、商品详情、首页、律师页等小程序问题收敛。',
    '小程序端核心链路完成回归验证后可进入发布准备。',
    '证据：5041585',
  ),
  req(
    'FLY-REQ-015',
    '单页、订单状态与售后展示优化',
    '小程序端',
    'improvement',
    'high',
    'testing',
    '2026-05-15',
    '2026-05-15',
    undefined,
    '补齐订单列表、详情、售后入口、代收信订单和单页相关展示逻辑。',
    '订单状态、售后标签、退款/退货入口、代收信订单操作显示符合业务口径。',
    '证据：040eba5',
  ),
  req(
    'FLY-REQ-016',
    '律师管理、律师分类与服务评论后台能力',
    '后台管理端',
    'feature',
    'high',
    'testing',
    '2026-05-18',
    '2026-05-18',
    undefined,
    '后台新增律师管理、律师分类、律师服务评论与律师服务分配/进度能力。',
    '后台可维护律师资料、分类、服务分配、进度和评论记录。',
    '证据：61eecf8',
  ),
  req(
    'FLY-REQ-017',
    '律师服务小程序展示、分配与评价闭环',
    '小程序端',
    'feature',
    'high',
    'testing',
    '2026-05-18',
    '2026-05-18',
    undefined,
    '小程序律师页展示已分配律师、服务状态、跟进说明，并支持完成后评价。',
    '用户可查看律师资料、服务状态和跟进说明，服务完成后可提交评价。',
    '证据：61eecf8',
  ),
  req(
    'FLY-REQ-018',
    '支付插件、第三方登录与支付退款能力纳入',
    '后台管理端',
    'security',
    'urgent',
    'testing',
    '2026-05-18',
    '2026-05-20',
    undefined,
    '纳入 epay 支付插件、third 第三方登录插件及支付/退款相关配置。',
    '支付、退款、第三方登录可配置联调；生产证书和密钥不得误入仓库，需确认配置隔离。',
    '证据：7e4f9b5',
  ),
]

const bugs: BugSeed[] = [
  bug(
    'FLY-BUG-001',
    '登录态导致图片上传失败',
    '小程序端',
    'critical',
    'high',
    'closed',
    '图片上传受登录态或请求拦截影响失败。',
    '用户登录后上传图片可能失败或被拦截。',
    '登录状态下图片上传稳定成功。',
    '登录小程序后进入图片上传场景并选择图片。',
  ),
  bug(
    'FLY-BUG-002',
    '审核模式开发阶段订单/登录/售后/评论页面问题',
    '后台管理端',
    'major',
    'high',
    'closed',
    '审核模式引入后，订单、登录、售后、评论等接口和页面存在联动问题。',
    '相关接口或页面在审核模式下表现异常。',
    '审核模式下订单、售后、评论、登录相关页面可正常使用。',
    '启用审核模式后依次访问订单、售后、评论、登录相关页面。',
  ),
  bug(
    'FLY-BUG-003',
    '首页展示异常与局部页面问题',
    '小程序端',
    'major',
    'medium',
    'closed',
    '首页展示、律师页、注册页、回信配送和信件配置存在细节问题。',
    '首页或局部页面展示不符合预期。',
    '首页和相关页面按最新配置展示。',
    '打开首页、律师页、注册页和回信配送页面。',
  ),
  bug(
    'FLY-BUG-004',
    '小程序端信件/订单/购物车/商品详情问题集中修复',
    '小程序端',
    'critical',
    'high',
    'pending_verify',
    '小程序端信件、订单、购物车、商品详情等核心链路问题集中修复后待验证。',
    '核心链路存在多处小程序端问题。',
    '信件、订单、购物车、商品详情链路回归通过。',
    '按小程序端完整业务路径进行回归。',
    '2026-05-20',
  ),
  bug(
    'FLY-BUG-005',
    '订单/信件后台详情展示细节问题',
    '后台管理端',
    'major',
    'medium',
    'pending_verify',
    '订单、订单审核、信件订单详情等后台模板展示需回归。',
    '后台详情展示字段、信件内容或状态可能不完整。',
    '后台详情页能完整展示订单、信件内容、审核状态和操作记录。',
    '后台打开订单详情、订单审核详情、信件订单详情。',
    '2026-05-20',
  ),
  bug(
    'FLY-BUG-006',
    '订单状态、售后标签和代收信订单操作显示异常',
    '小程序端',
    'major',
    'high',
    'pending_verify',
    '订单状态、售后中分页、退款/退货标签、代收信订单按钮和地址显示需要按业务口径收敛。',
    '部分订单状态或售后入口展示不准确，代收信订单可能出现不应展示的操作。',
    '不同订单类型下状态、售后入口、代收信操作和收件信息展示准确。',
    '进入订单列表和订单详情，分别检查普通订单、信件订单、代收信订单和售后订单。',
    '2026-05-20',
  ),
  bug(
    'FLY-BUG-007',
    '律师服务卡片、已分配律师信息和评价入口缺失',
    '小程序端',
    'major',
    'high',
    'pending_verify',
    '律师服务申请完成分配后，小程序端需要展示律师信息、服务状态、跟进说明和评价入口。',
    '用户无法完整看到已分配律师资料和服务评价入口。',
    '已分配/服务中/已完成状态均能正确展示律师资料和评价入口。',
    '提交律师服务申请后由后台分配律师，再回到小程序律师服务页检查。',
    '2026-05-20',
  ),
  bug(
    'FLY-BUG-008',
    '订单退款单号缺少展示和复制入口',
    '后台管理端',
    'minor',
    'medium',
    'pending_verify',
    '退款完成或审核拒绝退款场景需要在小程序订单详情、后台订单详情和审核详情展示退款单号。',
    '运营或用户无法快速核对退款单号。',
    '退款单号在前后台详情页可见，并支持复制或核对。',
    '触发退款/审核拒绝后查看小程序订单详情、后台订单详情和订单审核详情。',
    '2026-05-20',
  ),
  bug(
    'FLY-BUG-009',
    '支付插件和证书文件纳入后需核查敏感配置隔离',
    '后台管理端',
    'critical',
    'urgent',
    'confirmed',
    '新增 epay/third 插件后，需要核对支付证书、密钥和回调配置是否被安全隔离。',
    '支付相关敏感文件可能随插件目录进入仓库，存在配置隔离风险。',
    '确认仓库内不包含生产私钥；支付证书、商户密钥和回调地址通过安全配置维护。',
    '检查 epay 配置、证书文件、运行环境变量和第三方登录配置。',
    '2026-05-20',
  ),
]

function req(
  no: string,
  title: string,
  module: ModuleName,
  type: string,
  priority: string,
  status: string,
  plannedStart: string,
  plannedEnd: string,
  actualEnd: string | undefined,
  description: string,
  acceptance: string,
  remark: string,
): RequirementSeed {
  return {
    no,
    title,
    module,
    type,
    priority,
    status,
    plannedStart,
    plannedEnd,
    actualEnd,
    description,
    acceptance,
    remark,
  }
}

function bug(
  no: string,
  title: string,
  module: ModuleName,
  severity: string,
  priority: string,
  status: string,
  description: string,
  actual: string,
  expected: string,
  steps: string,
  due?: string,
): BugSeed {
  return {
    no,
    title,
    module,
    severity,
    priority,
    status,
    description,
    actual,
    expected,
    steps,
    due,
  }
}

const toDate = (value?: string) => (value ? new Date(`${value}T00:00:00.000Z`) : undefined)

async function main() {
  const operator = await prisma.sysUser.findFirst({
    where: { delFlag: '0', status: '0' },
    orderBy: { userId: 'asc' },
  })
  if (!operator) throw new Error('未找到可用用户，无法导入 Flycard dev2 项目数据。')

  const project = await ensureFlycardProject(operator.userId)
  const modules = await ensureModules(project.projectId)
  const iterationIds = await ensureIterations(project.projectId)
  const milestoneIds = await ensureMilestones(project.projectId)
  const version = await prisma.bugProjectVersion.upsert({
    where: {
      projectId_versionNo_delFlag: {
        projectId: project.projectId,
        versionNo: 'dev2',
        delFlag: '0',
      },
    },
    update: {
      versionName: 'dev2 内测版本',
      status: 'testing',
      iterationId: iterationIds.at(-1),
      milestoneId: milestoneIds.at(-1),
      releaseNote:
        '根据 flycard-dev2 提交日志整理的内测版本，已补齐 2026-05-15 与 2026-05-18 更新。',
    },
    create: {
      projectId: project.projectId,
      versionNo: 'dev2',
      versionName: 'dev2 内测版本',
      status: 'testing',
      iterationId: iterationIds.at(-1),
      milestoneId: milestoneIds.at(-1),
      releaseNote:
        '根据 flycard-dev2 提交日志整理的内测版本，已补齐 2026-05-15 与 2026-05-18 更新。',
    },
  })

  await ensureRequirements(project.projectId, modules, version.versionId)
  await ensureBugs(project.projectId, modules, operator.userId, version.versionId)
  await ensureLegacyRequirementModules(project.projectId, modules)
  console.log(`Imported Flycard dev2 update data into ${project.projectName} (${projectKey}).`)
}

async function ensureFlycardProject(defaultOwnerId: bigint) {
  const existed = await prisma.bugProject.findFirst({ where: { projectKey, delFlag: '0' } })
  if (existed) return existed

  return prisma.bugProject.create({
    data: {
      projectName: '飞鸟探亲',
      projectKey,
      ownerId: defaultOwnerId,
      description: 'Flycard/飞鸟探亲业务项目，默认由小程序端和后台管理端两端组成。',
      projectStage: 'internal_test',
      plannedStartTime: toDate('2026-04-18'),
      plannedEndTime: toDate('2026-05-20'),
      actualStartTime: toDate('2026-04-18'),
      progress: 92,
      riskLevel: 'medium',
      riskNote: '创建时基于 flycard-dev2 提交日志初始化，后续更新不得覆盖项目基础信息。',
      createBy: operatorName,
    },
  })
}

async function ensureModules(projectId: bigint) {
  const result = new Map<ModuleName, bigint>()
  for (const item of moduleDefinitions) {
    const module = await ensureTargetModule(projectId, item.name, item.aliases, item.orderNum)
    result.set(item.name, module.moduleId)
  }
  await mergeLegacyModules(projectId, result)
  return result
}

async function ensureTargetModule(
  projectId: bigint,
  moduleName: ModuleName,
  aliases: string[],
  orderNum: number,
) {
  const existed = await prisma.bugProjectModule.findFirst({
    where: { projectId, moduleName, delFlag: '0' },
  })
  if (existed) {
    return prisma.bugProjectModule.update({
      where: { moduleId: existed.moduleId },
      data: { status: '0', orderNum },
    })
  }

  const alias = await prisma.bugProjectModule.findFirst({
    where: { projectId, moduleName: { in: aliases }, delFlag: '0' },
    orderBy: { moduleId: 'asc' },
  })
  if (alias) {
    return prisma.bugProjectModule.update({
      where: { moduleId: alias.moduleId },
      data: { moduleName, status: '0', orderNum },
    })
  }

  return prisma.bugProjectModule.create({ data: { projectId, moduleName, orderNum } })
}

async function mergeLegacyModules(projectId: bigint, modules: Map<ModuleName, bigint>) {
  for (const item of moduleDefinitions) {
    const targetId = modules.get(item.name)
    if (!targetId) throw new Error(`未找到目标模块：${item.name}`)
    const legacyRows = await prisma.bugProjectModule.findMany({
      where: { projectId, moduleName: { in: item.aliases }, delFlag: '0' },
    })
    for (const legacy of legacyRows) {
      if (legacy.moduleId === targetId) continue
      await prisma.$transaction([
        prisma.projectRequirement.updateMany({
          where: { moduleId: legacy.moduleId },
          data: { moduleId: targetId },
        }),
        prisma.bugTicket.updateMany({
          where: { moduleId: legacy.moduleId },
          data: { moduleId: targetId },
        }),
        prisma.bugProjectModule.update({
          where: { moduleId: legacy.moduleId },
          data: {
            moduleName: `${legacy.moduleName}-已归并-${legacy.moduleId}`,
            status: '1',
            delFlag: '2',
            orderNum: 999,
          },
        }),
      ])
    }
  }
}

async function ensureIterations(projectId: bigint) {
  const result: bigint[] = []
  for (const item of iterations) {
    const [iterationName, status, startDate, endDate, summary] = item
    const existed = await prisma.projectIteration.findFirst({
      where: { projectId, iterationName, delFlag: '0' },
    })
    const iteration = existed
      ? await prisma.projectIteration.update({
          where: { iterationId: existed.iterationId },
          data: { status, startDate: toDate(startDate), endDate: toDate(endDate), summary },
        })
      : await prisma.projectIteration.create({
          data: {
            projectId,
            iterationName,
            status,
            startDate: toDate(startDate),
            endDate: toDate(endDate),
            summary,
          },
        })
    result.push(iteration.iterationId)
  }
  return result
}

async function ensureMilestones(projectId: bigint) {
  const result: bigint[] = []
  for (const item of milestones) {
    const [milestoneName, stage, status, targetDate, completionCriteria] = item
    const existed = await prisma.projectMilestone.findFirst({
      where: { projectId, milestoneName, delFlag: '0' },
    })
    const data = {
      stage,
      status,
      targetDate: toDate(targetDate),
      completedTime: status === 'achieved' ? toDate(targetDate) : undefined,
      completionCriteria,
    }
    const milestone = existed
      ? await prisma.projectMilestone.update({ where: { milestoneId: existed.milestoneId }, data })
      : await prisma.projectMilestone.create({ data: { projectId, milestoneName, ...data } })
    result.push(milestone.milestoneId)
  }
  return result
}

async function ensureRequirements(
  projectId: bigint,
  modules: Map<ModuleName, bigint>,
  versionId: bigint,
) {
  for (const item of requirements) {
    const moduleId = getModuleId(modules, item.module)
    await prisma.projectRequirement.upsert({
      where: { requirementNo: item.no },
      update: {
        title: item.title,
        projectId,
        moduleId,
        type: item.type,
        source: 'git-dev2',
        priority: item.priority,
        status: item.status,
        versionId,
        plannedStartTime: toDate(item.plannedStart),
        plannedEndTime: toDate(item.plannedEnd),
        actualEndTime: toDate(item.actualEnd),
        description: item.description,
        acceptanceCriteria: item.acceptance,
        remark: item.remark,
        updateBy: operatorName,
      },
      create: {
        requirementNo: item.no,
        title: item.title,
        projectId,
        moduleId,
        type: item.type,
        source: 'git-dev2',
        priority: item.priority,
        status: item.status,
        versionId,
        plannedStartTime: toDate(item.plannedStart),
        plannedEndTime: toDate(item.plannedEnd),
        actualEndTime: toDate(item.actualEnd),
        description: item.description,
        acceptanceCriteria: item.acceptance,
        remark: item.remark,
        createBy: operatorName,
      },
    })
  }
}

async function ensureBugs(
  projectId: bigint,
  modules: Map<ModuleName, bigint>,
  submitterId: bigint,
  versionId: bigint,
) {
  for (const item of bugs) {
    const moduleId = getModuleId(modules, item.module)
    await prisma.bugTicket.upsert({
      where: { ticketNo: item.no },
      update: {
        title: item.title,
        projectId,
        moduleId,
        versionId,
        type: 'function',
        severity: item.severity,
        priority: item.priority,
        status: item.status,
        description: item.description,
        reproduceSteps: item.steps,
        expectedResult: item.expected,
        actualResult: item.actual,
        dueTime: toDate(item.due),
        updateBy: operatorName,
      },
      create: {
        ticketNo: item.no,
        title: item.title,
        projectId,
        moduleId,
        versionId,
        type: 'function',
        severity: item.severity,
        priority: item.priority,
        status: item.status,
        description: item.description,
        reproduceSteps: item.steps,
        expectedResult: item.expected,
        actualResult: item.actual,
        submitterId,
        assigneeId: submitterId,
        dueTime: toDate(item.due),
        createBy: operatorName,
      },
    })
  }
}

async function ensureLegacyRequirementModules(projectId: bigint, modules: Map<ModuleName, bigint>) {
  const legacyMappings: Array<{ requirementNo: string; module: ModuleName }> = [
    { requirementNo: 'FLYCARD-REQ-0016', module: '后台管理端' },
  ]
  for (const item of legacyMappings) {
    await prisma.projectRequirement.updateMany({
      where: { projectId, requirementNo: item.requirementNo, moduleId: null, delFlag: '0' },
      data: { moduleId: getModuleId(modules, item.module), updateBy: operatorName },
    })
  }
}

function getModuleId(modules: Map<ModuleName, bigint>, moduleName: ModuleName) {
  const moduleId = modules.get(moduleName)
  if (!moduleId) throw new Error(`未找到 Flycard 模块：${moduleName}`)
  return moduleId
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

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import PmBugSummaryCard from '../components/PmBugSummaryCard.vue'
import PmRequirementSummaryCard from '../components/PmRequirementSummaryCard.vue'
import PmScrollableSectionCard from '../components/PmScrollableSectionCard.vue'
import BugTicketDetailDialog from '@/views/bug/tickets/components/BugTicketDetailDialog.vue'
import RequirementDetailDialog from '../requirements/components/RequirementDetailDialog.vue'
import RiskBadge from '@/components/common/RiskBadge.vue'
import { SimpleTableFilters } from '@/components/common/table-filter'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  executiveActions,
  executiveCompletedHistory,
  executiveCurrentWork,
  executivePendingWork,
  executiveProjects,
  executiveSummary,
  getRequirement,
} from '@/api/project-management'
import { getBugTicket } from '@/api/bug'
import type {
  DashboardSummary,
  ProjectHealth,
  Requirement,
  WorkItems,
} from '@/api/project-management/types'
import type { BugTicket } from '@/api/bug/types'
import { formatDate } from '../shared/options'
import { sortRowsByState, toggleTableSort } from '@/utils/table-sort'
import { getRiskLabel, getStatusLabel, type SemanticTone } from '@/utils/semantic-styles'
import ProjectHealthTable from './ProjectHealthTable.vue'

const loading = ref(false)
const router = useRouter()
const { toast } = useToast()
const summary = ref<DashboardSummary>()
const projects = ref<ProjectHealth[]>([])
const currentWork = ref<WorkItems>({ requirements: [], bugs: [] })
const completed = ref<WorkItems>({ requirements: [], bugs: [] })
const pending = ref<WorkItems>({ requirements: [], bugs: [] })
const actions = ref<Array<{ level: string; message: string }>>([])
const requirementDetailOpen = ref(false)
const requirementDetail = ref<Requirement | null>(null)
const bugDetailOpen = ref(false)
const bugDetail = ref<BugTicket | null>(null)


const ALL_VALUE = '__all__'
const projectFilterQuery = reactive({
  projectName: '',
  stage: ALL_VALUE,
  risk: ALL_VALUE,
  progressMin: undefined as number | undefined,
  progressMax: undefined as number | undefined,
  bugCloseRateMin: undefined as number | undefined,
  bugCloseRateMax: undefined as number | undefined,
  sortBy: '',
  sortOrder: '' as 'asc' | 'desc' | '',
})
const projectFilterFields = computed(() => [
  { label: '项目', key: 'projectName', placeholder: '请输入项目名称' },
  { label: '阶段', key: 'stage', type: 'select' as const, options: toOptions(projects.value.map((item) => item.project.projectStage), (value) => getStatusLabel('projectStage', value)) },
  { label: '风险', key: 'risk', type: 'select' as const, options: toOptions(projects.value.map((item) => item.health), (value) => getRiskLabel(value)) },
])
const projectExpandedFields = [
  { label: '进度', type: 'number-range' as const, startKey: 'progressMin', endKey: 'progressMax', min: 0, max: 100 },
  { label: '缺陷关闭率', type: 'number-range' as const, startKey: 'bugCloseRateMin', endKey: 'bugCloseRateMax', min: 0, max: 100 },
]
const filteredProjects = computed(() =>
  sortRowsByState(
    projects.value.filter((item) => {
      const nameMatched = item.project.projectName.includes(projectFilterQuery.projectName.trim())
      const stageMatched = projectFilterQuery.stage === ALL_VALUE || item.project.projectStage === projectFilterQuery.stage
      const riskMatched = projectFilterQuery.risk === ALL_VALUE || item.health === projectFilterQuery.risk
      const progressMatched = inNumberRange(item.progress, projectFilterQuery.progressMin, projectFilterQuery.progressMax)
      const bugRateMatched = inNumberRange(item.bugCloseRate, projectFilterQuery.bugCloseRateMin, projectFilterQuery.bugCloseRateMax)
      return nameMatched && stageMatched && riskMatched && progressMatched && bugRateMatched
    }),
    projectFilterQuery,
    {
      projectName: (item) => item.project.projectName,
      projectStage: (item) => item.project.projectStage || '',
      progress: (item) => item.progress,
      requirementDoneRate: (item) => item.requirementDoneRate,
      bugCloseRate: (item) => item.bugCloseRate,
      health: (item) => item.health,
    },
  ),
)

function toOptions(values: Array<string | undefined>, getLabel = (value: string) => value) {
  return [
    { label: '全部', value: ALL_VALUE },
    ...Array.from(new Set(values.filter(Boolean) as string[])).map((value) => ({ label: getLabel(value), value })),
  ]
}
function inNumberRange(value: number, min?: number, max?: number) {
  return (min === undefined || value >= min) && (max === undefined || value <= max)
}
function handleProjectSort(key: string) {
  toggleTableSort(projectFilterQuery, key)
}

function resetProjectFilters() {
  projectFilterQuery.projectName = ''
  projectFilterQuery.stage = ALL_VALUE
  projectFilterQuery.risk = ALL_VALUE
  projectFilterQuery.progressMin = undefined
  projectFilterQuery.progressMax = undefined
  projectFilterQuery.bugCloseRateMin = undefined
  projectFilterQuery.bugCloseRateMax = undefined
  projectFilterQuery.sortBy = ''
  projectFilterQuery.sortOrder = ''
}

const cards: Array<{
  label: string
  key: keyof DashboardSummary
  tone: SemanticTone
  description: string
  path: string
}> = [
  {
    label: '进行中项目',
    key: 'totalProjects',
    tone: 'info',
    description: '当前纳入统计的项目数量',
    path: '/project-management/projects',
  },
  {
    label: '正常推进',
    key: 'normalProjects',
    tone: 'success',
    description: '按计划推进，无需额外干预',
    path: '/project-management/projects',
  },
  {
    label: '风险项目',
    key: 'riskProjects',
    tone: 'warning',
    description: '存在阻塞、延期或质量风险',
    path: '/project-management/projects',
  },
  {
    label: '已延期',
    key: 'delayedProjects',
    tone: 'overdue',
    description: '已超过计划完成时间',
    path: '/project-management/projects',
  },
  {
    label: '7天关键节点',
    key: 'upcomingMilestones',
    tone: 'info',
    description: '未来 7 天需要关注的里程碑',
    path: '/project-management/milestones',
  },
  {
    label: '处理中需求',
    key: 'currentRequirements',
    tone: 'info',
    description: '当前正在推进的需求',
    path: '/project-management/requirements',
  },
  {
    label: '修复中缺陷',
    key: 'currentBugs',
    tone: 'warning',
    description: '当前修复中的问题',
    path: '/bug/tickets',
  },
  {
    label: '历史完成需求',
    key: 'completedRequirements',
    tone: 'success',
    description: '所选周期内已完成需求',
    path: '/project-management/requirements',
  },
  {
    label: '历史修复缺陷',
    key: 'completedBugs',
    tone: 'success',
    description: '所选周期内已修复问题',
    path: '/bug/tickets',
  },
  {
    label: '未处理事项',
    key: 'pendingRequirements',
    tone: 'danger',
    description: '仍待确认、分派或处理',
    path: '/project-management/requirements',
  },
]

function bugTitle(item: Record<string, unknown>) {
  return String(item.title || item.ticketNo || '-')
}
function itemStatus(item: Record<string, unknown>) {
  return typeof item.status === 'string' ? item.status : undefined
}
function requirementOwner(row: Requirement) {
  return row.developer?.nickName || row.owner?.nickName || row.owner?.userName || '-'
}
function requirementMeta(row: Requirement) {
  return requirementOwner(row)
}
function jumpFromMetric(path: string) {
  router.push(path)
}
function bugTicketId(row: Record<string, unknown>) {
  return typeof row.ticketId === 'string' ? row.ticketId : ''
}
function bugMeta(row: Record<string, unknown>) {
  return (row.assignee as { nickName?: string; userName?: string } | undefined)?.nickName
    || (row.assignee as { nickName?: string; userName?: string } | undefined)?.userName
    || '-'
}
async function openRequirementDetail(row: Requirement) {
  try {
    requirementDetail.value = await getRequirement(row.requirementId)
    requirementDetailOpen.value = true
  } catch {
    toast({ title: '需求详情加载失败', description: '请刷新仪表盘后重试', variant: 'destructive' })
  }
}
async function openBugDetail(row: Record<string, unknown>) {
  const ticketId = bugTicketId(row)
  if (!ticketId) return
  try {
    bugDetail.value = await getBugTicket(ticketId)
    bugDetailOpen.value = true
  } catch {
    toast({ title: '缺陷详情加载失败', description: '请刷新仪表盘后重试', variant: 'destructive' })
  }
}

async function load() {
  loading.value = true
  try {
    const [summaryRes, projectsRes, currentRes, completedRes, pendingRes, actionsRes] =
      await Promise.all([
        executiveSummary(),
        executiveProjects(),
        executiveCurrentWork({ pageSize: 8 }),
        executiveCompletedHistory({ pageSize: 8 }),
        executivePendingWork({ pageSize: 8 }),
        executiveActions(),
      ])
    summary.value = summaryRes
    projects.value = projectsRes
    currentWork.value = currentRes
    completed.value = completedRes
    pending.value = pendingRes
    actions.value = actionsRes
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">仪表盘</h2>
        <p class="text-sm text-muted-foreground">
          实时查看项目进度、当前处理、历史完成和未处理事项
        </p>
      </div>
      <TableRefreshIconButton :loading="loading" @refresh="load" />
    </div>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        v-for="card in cards"
        :key="card.key"
        :title="card.label"
        :value="summary?.[card.key] ?? 0"
        :tone="card.tone"
        :description="card.description"
        interactive
        @activate="jumpFromMetric(card.path)"
      />
    </div>
    <div class="grid gap-4 xl:grid-cols-3">
      <Card class="xl:col-span-2">
        <CardHeader><CardTitle>项目健康度</CardTitle></CardHeader>
        <CardContent class="space-y-4">
          <SimpleTableFilters
            :query="projectFilterQuery"
            :fields="projectFilterFields"
            :expanded-fields="projectExpandedFields"
            description="默认展示项目、阶段和风险，展开后可按进度与缺陷关闭率范围筛选。"
            @search="() => undefined"
            @reset="resetProjectFilters"
          />
          <ProjectHealthTable
            :rows="filteredProjects"
            :sort-by="projectFilterQuery.sortBy"
            :sort-order="projectFilterQuery.sortOrder"
            @sort="handleProjectSort"
          />
        </CardContent>
      </Card>
      <Card
        ><CardHeader><CardTitle>管理层行动建议</CardTitle></CardHeader
        ><CardContent class="space-y-2"
          ><div v-for="item in actions" :key="item.message" class="rounded-md border p-3 text-sm">
            <RiskBadge class="mb-2" :value="item.level" />
            <div>{{ item.message }}</div>
          </div></CardContent
        ></Card
      >
    </div>
    <div class="grid gap-4 xl:grid-cols-3">
      <PmScrollableSectionCard
        title="当前处理"
        :count="currentWork.requirements.length + currentWork.bugs.length"
        content-class="space-y-3"
      >
        <div class="text-sm font-medium">需求</div>
        <PmRequirementSummaryCard
          v-for="row in currentWork.requirements"
          :key="row.requirementId"
          :row="row"
          interactive
          :show-priority="false"
          :meta-text="requirementMeta(row)"
          @detail="openRequirementDetail"
        />
        <div class="text-sm font-medium">缺陷</div>
        <PmBugSummaryCard
          v-for="row in currentWork.bugs"
          :key="String(row.ticketId)"
          :row="row"
          interactive
          :show-ticket-no="false"
          :meta-text="bugMeta(row)"
          @detail="(row) => openBugDetail(row as Record<string, unknown>)"
        />
      </PmScrollableSectionCard>
      <PmScrollableSectionCard
        title="历史完成"
        :count="completed.requirements.length + completed.bugs.length"
        content-class="space-y-3"
      >
        <PmRequirementSummaryCard
          v-for="row in completed.requirements"
          :key="row.requirementId"
          :row="row"
          interactive
          :show-priority="false"
          :secondary-text="formatDate(row.actualEndTime || row.updateTime)"
          @detail="openRequirementDetail"
        />
        <PmBugSummaryCard
          v-for="row in completed.bugs"
          :key="String(row.ticketId)"
          :row="row"
          interactive
          :show-ticket-no="false"
          :secondary-text="formatDate(String(row.updateTime || ''))"
          @detail="(row) => openBugDetail(row as Record<string, unknown>)"
        />
      </PmScrollableSectionCard>
      <PmScrollableSectionCard
        title="未处理"
        :count="pending.requirements.length + pending.bugs.length"
        content-class="space-y-3"
      >
        <PmRequirementSummaryCard
          v-for="row in pending.requirements"
          :key="row.requirementId"
          :row="row"
          interactive
          :meta-text="requirementOwner(row)"
          @detail="openRequirementDetail"
        />
        <PmBugSummaryCard
          v-for="row in pending.bugs"
          :key="String(row.ticketId)"
          :row="row"
          interactive
          :show-ticket-no="false"
          :meta-text="bugMeta(row)"
          @detail="(row) => openBugDetail(row as Record<string, unknown>)"
        />
      </PmScrollableSectionCard>
    </div>
    <BugTicketDetailDialog v-model:open="bugDetailOpen" :detail="bugDetail" />
    <RequirementDetailDialog v-model:open="requirementDetailOpen" :detail="requirementDetail" />
  </div>
</template>

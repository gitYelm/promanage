<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import BugTicketDetailDialog from '@/views/bug/tickets/components/BugTicketDetailDialog.vue'
import RequirementDetailDialog from '../requirements/components/RequirementDetailDialog.vue'
import RiskBadge from '@/components/common/RiskBadge.vue'
import SemanticProgress from '@/components/common/SemanticProgress.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
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
import { getRiskStyle, type SemanticTone } from '@/utils/semantic-styles'

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
function itemProjectName(item: Record<string, unknown>) {
  const project = item.project as { projectName?: string } | undefined
  return project?.projectName || '-'
}
function itemStatus(item: Record<string, unknown>) {
  return typeof item.status === 'string' ? item.status : undefined
}
function itemPriority(item: Record<string, unknown>) {
  return typeof item.priority === 'string' ? item.priority : undefined
}
function requirementOwner(row: Requirement) {
  return row.developer?.nickName || row.owner?.nickName || row.owner?.userName || '-'
}
function jumpFromMetric(path: string) {
  router.push(path)
}
function bugTicketId(row: Record<string, unknown>) {
  return typeof row.ticketId === 'string' ? row.ticketId : ''
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
      <DataRefreshButton :loading="loading" @refresh="load" />
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
        <CardContent>
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目</TableHead>
                  <TableHead class="text-center">阶段</TableHead>
                  <TableHead class="min-w-36 text-right">进度</TableHead>
                  <TableHead class="text-right">缺陷关闭率</TableHead>
                  <TableHead class="text-center">风险</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in projects" :key="item.project.projectId">
                  <TableCell>{{ item.project.projectName }}</TableCell>
                  <TableCell class="text-center"
                    ><StatusBadge domain="projectStage" :value="item.project.projectStage"
                  /></TableCell>
                  <TableCell class="min-w-36">
                    <div class="ml-auto flex max-w-44 items-center justify-end gap-2">
                      <SemanticProgress
                        :model-value="item.progress"
                        :tone="getRiskStyle(item.health).tone"
                        class="h-2"
                      />
                      <span class="w-10 text-right text-xs tabular-nums">{{ item.progress }}%</span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right tabular-nums">{{ item.bugCloseRate }}%</TableCell>
                  <TableCell class="text-center"><RiskBadge :value="item.health" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <EmptyState v-if="!projects.length" />
          </div>
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
      <Card
        ><CardHeader><CardTitle>当前处理</CardTitle></CardHeader
        ><CardContent class="max-h-[30rem] space-y-3 overflow-y-auto overscroll-contain pr-3"
          ><div class="text-sm font-medium">需求</div>
          <div
            v-for="row in currentWork.requirements"
            :key="row.requirementId"
            class="rounded-md border p-2 text-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="font-medium">{{ row.title }}</div>
              <Button
                permission="pm:requirement:view"
                size="xs"
                variant="outline"
                @click="openRequirementDetail(row)"
                >详情</Button
              >
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge domain="requirement" :value="row.status" /><span
                class="text-xs text-muted-foreground"
                >{{ row.project?.projectName }} · {{ requirementOwner(row) }}</span
              >
            </div>
          </div>
          <div class="text-sm font-medium">缺陷</div>
          <div
            v-for="row in currentWork.bugs"
            :key="String(row.ticketId)"
            class="rounded-md border p-2 text-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="font-medium">{{ bugTitle(row) }}</div>
              <Button
                permission="bug:ticket:query"
                size="xs"
                variant="outline"
                @click="openBugDetail(row)"
                >详情</Button
              >
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              <StatusBadge domain="bug" :value="itemStatus(row)" /><PriorityBadge
                :value="itemPriority(row)"
              />
            </div></div></CardContent
      ></Card>
      <Card
        ><CardHeader><CardTitle>历史完成</CardTitle></CardHeader
        ><CardContent class="max-h-[30rem] space-y-3 overflow-y-auto overscroll-contain pr-3"
          ><div
            v-for="row in completed.requirements"
            :key="row.requirementId"
            class="rounded-md border p-2 text-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="font-medium">{{ row.title }}</div>
              <Button
                permission="pm:requirement:view"
                size="xs"
                variant="outline"
                @click="openRequirementDetail(row)"
                >详情</Button
              >
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge domain="requirement" :value="row.status" /><span
                class="text-xs text-muted-foreground"
                >{{ formatDate(row.actualEndTime || row.updateTime) }}</span
              >
            </div>
          </div>
          <div
            v-for="row in completed.bugs"
            :key="String(row.ticketId)"
            class="rounded-md border p-2 text-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="font-medium">{{ bugTitle(row) }}</div>
              <Button
                permission="bug:ticket:query"
                size="xs"
                variant="outline"
                @click="openBugDetail(row)"
                >详情</Button
              >
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge domain="bug" :value="itemStatus(row)" /><span
                class="text-xs text-muted-foreground"
                >{{ String(row.updateTime || '-') }}</span
              >
            </div>
          </div></CardContent
        ></Card
      >
      <Card
        ><CardHeader><CardTitle>未处理</CardTitle></CardHeader
        ><CardContent class="max-h-[30rem] space-y-3 overflow-y-auto overscroll-contain pr-3"
          ><div
            v-for="row in pending.requirements"
            :key="row.requirementId"
            class="rounded-md border p-2 text-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="font-medium">{{ row.title }}</div>
              <Button
                permission="pm:requirement:view"
                size="xs"
                variant="outline"
                @click="openRequirementDetail(row)"
                >详情</Button
              >
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge domain="requirement" :value="row.status" /><PriorityBadge
                :value="row.priority"
              /><span class="text-xs text-muted-foreground">{{ row.project?.projectName }}</span>
            </div>
          </div>
          <div
            v-for="row in pending.bugs"
            :key="String(row.ticketId)"
            class="rounded-md border p-2 text-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="font-medium">{{ bugTitle(row) }}</div>
              <Button
                permission="bug:ticket:query"
                size="xs"
                variant="outline"
                @click="openBugDetail(row)"
                >详情</Button
              >
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge domain="bug" :value="itemStatus(row)" /><PriorityBadge
                :value="itemPriority(row)"
              /><span class="text-xs text-muted-foreground">{{ itemProjectName(row) }}</span>
            </div>
          </div></CardContent
        ></Card
      >
    </div>
    <BugTicketDetailDialog v-model:open="bugDetailOpen" :detail="bugDetail" />
    <RequirementDetailDialog v-model:open="requirementDetailOpen" :detail="requirementDetail" />
  </div>
</template>

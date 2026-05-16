<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import RiskBadge from '@/components/common/RiskBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { executiveActions, executiveCompletedHistory, executiveCurrentWork, executivePendingWork, executiveProjects, executiveSummary } from '@/api/project-management'
import type { DashboardSummary, ProjectHealth, Requirement, WorkItems } from '@/api/project-management/types'
import { PM_PRIORITY_OPTIONS, PM_PROJECT_STAGE_OPTIONS, formatDate, pmLabel } from '../shared/options'
import type { SemanticTone } from '@/utils/semantic-styles'

const loading = ref(false)
const summary = ref<DashboardSummary>()
const projects = ref<ProjectHealth[]>([])
const currentWork = ref<WorkItems>({ requirements: [], bugs: [] })
const completed = ref<WorkItems>({ requirements: [], bugs: [] })
const pending = ref<WorkItems>({ requirements: [], bugs: [] })
const actions = ref<Array<{ level: string; message: string }>>([])

const cards: Array<{ label: string; key: keyof DashboardSummary; tone: SemanticTone; description: string }> = [
  { label: '进行中项目', key: 'totalProjects', tone: 'info', description: '当前纳入统计的项目数量' },
  { label: '正常推进', key: 'normalProjects', tone: 'success', description: '按计划推进，无需额外干预' },
  { label: '风险项目', key: 'riskProjects', tone: 'warning', description: '存在阻塞、延期或质量风险' },
  { label: '已延期', key: 'delayedProjects', tone: 'overdue', description: '已超过计划完成时间' },
  { label: '7天关键节点', key: 'upcomingMilestones', tone: 'info', description: '未来 7 天需要关注的里程碑' },
  { label: '处理中需求', key: 'currentRequirements', tone: 'info', description: '当前正在推进的需求' },
  { label: '修复中 Bug', key: 'currentBugs', tone: 'warning', description: '当前修复中的问题' },
  { label: '历史完成需求', key: 'completedRequirements', tone: 'success', description: '所选周期内已完成需求' },
  { label: '历史修复 Bug', key: 'completedBugs', tone: 'success', description: '所选周期内已修复问题' },
  { label: '未处理事项', key: 'pendingRequirements', tone: 'danger', description: '仍待确认、分派或处理' },
]

function bugTitle(item: Record<string, unknown>) { return String(item.title || item.ticketNo || '-') }
function requirementOwner(row: Requirement) { return row.developer?.nickName || row.owner?.nickName || row.owner?.userName || '-' }

async function load() {
  loading.value = true
  try {
    const [summaryRes, projectsRes, currentRes, completedRes, pendingRes, actionsRes] = await Promise.all([
      executiveSummary(), executiveProjects(), executiveCurrentWork({ pageSize: 8 }), executiveCompletedHistory({ pageSize: 8 }), executivePendingWork({ pageSize: 8 }), executiveActions(),
    ])
    summary.value = summaryRes; projects.value = projectsRes; currentWork.value = currentRes; completed.value = completedRes; pending.value = pendingRes; actions.value = actionsRes
  } finally { loading.value = false }
}

onMounted(load)
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <div><h2 class="text-2xl font-bold">老板驾驶舱</h2><p class="text-sm text-muted-foreground">实时查看项目进度、当前处理、历史完成和未处理事项</p></div>
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
                  <TableHead>阶段</TableHead>
                  <TableHead class="min-w-36 text-right">进度</TableHead>
                  <TableHead class="text-right">Bug关闭率</TableHead>
                  <TableHead class="text-center">风险</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in projects" :key="item.project.projectId">
                  <TableCell>{{ item.project.projectName }}</TableCell>
                  <TableCell>{{ pmLabel(PM_PROJECT_STAGE_OPTIONS, item.project.projectStage) }}</TableCell>
                  <TableCell class="min-w-36">
                    <div class="ml-auto flex max-w-44 items-center justify-end gap-2">
                      <Progress :model-value="item.progress" class="h-2" />
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
      <Card><CardHeader><CardTitle>管理层行动建议</CardTitle></CardHeader><CardContent class="space-y-2"><div v-for="item in actions" :key="item.message" class="rounded-md border p-3 text-sm"><RiskBadge class="mb-2" :value="item.level" /><div>{{ item.message }}</div></div></CardContent></Card>
    </div>
    <div class="grid gap-4 xl:grid-cols-3">
      <Card><CardHeader><CardTitle>当前处理</CardTitle></CardHeader><CardContent class="space-y-3"><div class="text-sm font-medium">需求</div><div v-for="row in currentWork.requirements" :key="row.requirementId" class="rounded-md border p-2 text-sm"><div class="font-medium">{{ row.title }}</div><div class="text-muted-foreground">{{ row.project?.projectName }} · {{ requirementOwner(row) }}</div></div><div class="text-sm font-medium">Bug</div><div v-for="row in currentWork.bugs" :key="String(row.ticketId)" class="rounded-md border p-2 text-sm">{{ bugTitle(row) }}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>历史完成</CardTitle></CardHeader><CardContent class="space-y-3"><div v-for="row in completed.requirements" :key="row.requirementId" class="rounded-md border p-2 text-sm"><div class="font-medium">{{ row.title }}</div><div class="text-muted-foreground">{{ formatDate(row.actualEndTime || row.updateTime) }}</div></div><div v-for="row in completed.bugs" :key="String(row.ticketId)" class="rounded-md border p-2 text-sm">{{ bugTitle(row) }}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>未处理</CardTitle></CardHeader><CardContent class="space-y-3"><div v-for="row in pending.requirements" :key="row.requirementId" class="rounded-md border p-2 text-sm"><div class="font-medium">{{ row.title }}</div><div class="text-muted-foreground">{{ row.project?.projectName }} · {{ pmLabel(PM_PRIORITY_OPTIONS, row.priority) }}</div></div><div v-for="row in pending.bugs" :key="String(row.ticketId)" class="rounded-md border p-2 text-sm">{{ bugTitle(row) }}</div></CardContent></Card>
    </div>
  </div>
</template>

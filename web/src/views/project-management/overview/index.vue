<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import RiskBadge from '@/components/common/RiskBadge.vue'
import SemanticProgress from '@/components/common/SemanticProgress.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { projectOverview, updateProjectProgress } from '@/api/project-management'
import { bugProjectOptions } from '@/api/bug'
import type { ProjectOverview, ProjectProgressForm, Requirement } from '@/api/project-management/types'
import type { BugProject } from '@/api/bug/types'
import { PM_PROJECT_STAGE_OPTIONS, PM_RISK_LEVEL_OPTIONS, formatDate, toDateInput } from '../shared/options'
import { getRiskStyle, type SemanticTone } from '@/utils/semantic-styles'

const { toast } = useToast()
const loading = ref(false)
const progressOpen = ref(false)
const projects = ref<BugProject[]>([])
const selectedProjectId = ref('')
const overview = ref<ProjectOverview>()
const progressForm = reactive<ProjectProgressForm>({ projectStage: 'requirement', progress: 0, riskLevel: 'low', riskNote: '', remark: '' })
const cards = computed<Array<{ label: string; value: string | number; tone: SemanticTone; description: string }>>(() => [
  { label: '项目进度', value: `${overview.value?.progress ?? 0}%`, tone: 'info', description: '当前项目综合推进进度' },
  { label: '需求完成', value: `${overview.value?.requirementDone ?? 0}/${overview.value?.requirementTotal ?? 0}`, tone: 'success', description: '已完成需求 / 全部需求' },
  { label: '缺陷关闭率', value: `${overview.value?.bugCloseRate ?? 0}%`, tone: 'success', description: '已关闭缺陷占比' },
  { label: '当前需求', value: overview.value?.counts.currentRequirements ?? 0, tone: 'info', description: '当前正在处理的需求' },
  { label: '修复中缺陷', value: overview.value?.counts.currentBugs ?? 0, tone: 'warning', description: '当前修复中的问题' },
  { label: '未处理事项', value: (overview.value?.counts.pendingRequirements ?? 0) + (overview.value?.counts.pendingBugs ?? 0), tone: 'danger', description: '待确认、分派或处理事项' },
])

function bugTitle(item: Record<string, unknown>) { return String(item.ticketNo || item.title || '-') }
function itemStatus(item: Record<string, unknown>) { return typeof item.status === 'string' ? item.status : undefined }
function itemPriority(item: Record<string, unknown>) { return typeof item.priority === 'string' ? item.priority : undefined }
function ownerName(row: Requirement) { return row.developer?.nickName || row.owner?.nickName || row.owner?.userName || '-' }
function activityText(item: { targetType: string; action: string; fromValue?: string; toValue?: string }) { return `${item.targetType} ${item.action}${item.toValue ? `：${item.fromValue || '-'} → ${item.toValue}` : ''}` }
function openProgress() {
  if (!overview.value) return
  const p = overview.value.project
  Object.assign(progressForm, { projectStage: p.projectStage || 'requirement', progress: p.progress ?? overview.value.progress, riskLevel: p.riskLevel || 'low', riskNote: p.riskNote || '', plannedStartTime: toDateInput(p.plannedStartTime), plannedEndTime: toDateInput(p.plannedEndTime), actualStartTime: toDateInput(p.actualStartTime), actualEndTime: toDateInput(p.actualEndTime), remark: '' })
  progressOpen.value = true
}
async function saveProgress() {
  if (!selectedProjectId.value) return
  overview.value = await updateProjectProgress(selectedProjectId.value, progressForm)
  toast({ title: '项目进度已更新' })
  progressOpen.value = false
}

async function load() {
  if (!selectedProjectId.value) return
  loading.value = true
  try {
    overview.value = await projectOverview(selectedProjectId.value)
  } finally { loading.value = false }
}

onMounted(async () => {
  projects.value = await bugProjectOptions()
  selectedProjectId.value = projects.value[0]?.projectId || ''
  await load()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div><h2 class="text-2xl font-bold">项目概览</h2><p class="text-sm text-muted-foreground">项目负责人查看单项目阶段、进度、风险、当前处理和未处理事项。</p></div>
      <div class="flex flex-wrap gap-2"><Select v-model="selectedProjectId" @update:model-value="load"><SelectTrigger class="w-64"><SelectValue placeholder="选择项目" /></SelectTrigger><SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select><Button v-if="overview" v-hasPermi="['pm:project:update']" variant="outline" @click="openProgress">更新进度</Button><DataRefreshButton :loading="loading" @refresh="load" /></div>
    </div>
    <div v-if="overview" class="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card><CardHeader><CardTitle>{{ overview.project.projectName }}</CardTitle></CardHeader><CardContent class="space-y-4"><div class="flex flex-wrap gap-2"><StatusBadge domain="projectStage" :value="overview.project.projectStage" /><RiskBadge :value="overview.project.riskLevel" /><Badge variant="outline">负责人：{{ overview.project.owner?.nickName || '-' }}</Badge><Badge variant="outline">计划：{{ formatDate(overview.project.plannedStartTime) }} - {{ formatDate(overview.project.plannedEndTime) }}</Badge></div><div class="flex items-center gap-3"><SemanticProgress :model-value="overview.progress" :tone="getRiskStyle(overview.project.riskLevel).tone" class="h-3" /><span class="w-12 text-sm font-medium">{{ overview.progress }}%</span></div><p class="text-sm text-muted-foreground">风险说明：{{ overview.project.riskNote || '暂无' }}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>下一关键节点</CardTitle></CardHeader><CardContent><div v-if="overview.nextMilestone" class="space-y-2 text-sm"><div class="font-medium">{{ overview.nextMilestone.milestoneName }}</div><div class="flex items-center gap-2"><span>阶段：</span><StatusBadge domain="projectStage" :value="overview.nextMilestone.stage" /></div><div>目标日期：{{ formatDate(overview.nextMilestone.targetDate) }}</div><div>负责人：{{ overview.nextMilestone.owner?.nickName || '-' }}</div></div><EmptyState v-else title="暂无下一节点" /></CardContent></Card>
    </div>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-6"><MetricCard v-for="item in cards" :key="item.label" :title="item.label" :value="item.value" :tone="item.tone" :description="item.description" /></div>
    <div v-if="overview" class="grid gap-4 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>当前处理需求</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>需求</TableHead><TableHead>负责人</TableHead><TableHead class="text-center">状态</TableHead><TableHead>计划完成</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in overview.currentRequirements" :key="row.requirementId"><TableCell>{{ row.title }}</TableCell><TableCell>{{ ownerName(row) }}</TableCell><TableCell class="text-center"><StatusBadge domain="requirement" :value="row.status" /></TableCell><TableCell>{{ formatDate(row.plannedEndTime) }}</TableCell></TableRow></TableBody></Table><EmptyState v-if="!overview.currentRequirements.length" /></CardContent></Card>
      <Card><CardHeader><CardTitle>当前修复缺陷</CardTitle></CardHeader><CardContent><div class="space-y-2"><div v-for="row in overview.currentBugs" :key="String(row.ticketId)" class="rounded-md border p-3 text-sm"><div class="font-medium">{{ bugTitle(row) }}</div><div class="mt-2 flex flex-wrap gap-1"><StatusBadge domain="bug" :value="itemStatus(row)" /><PriorityBadge :value="itemPriority(row)" /></div></div><EmptyState v-if="!overview.currentBugs.length" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>未处理需求</CardTitle></CardHeader><CardContent><div class="space-y-2"><div v-for="row in overview.pendingRequirements" :key="row.requirementId" class="rounded-md border p-3 text-sm"><div class="font-medium">{{ row.title }}</div><div class="mt-2 flex flex-wrap items-center gap-2"><StatusBadge domain="requirement" :value="row.status" /><span class="text-xs text-muted-foreground">{{ ownerName(row) }}</span></div></div><EmptyState v-if="!overview.pendingRequirements.length" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>未处理缺陷</CardTitle></CardHeader><CardContent><div class="space-y-2"><div v-for="row in overview.pendingBugs" :key="String(row.ticketId)" class="rounded-md border p-3 text-sm"><div class="font-medium">{{ bugTitle(row) }}</div><div class="mt-2 flex flex-wrap gap-1"><StatusBadge domain="bug" :value="itemStatus(row)" /><PriorityBadge :value="itemPriority(row)" /></div></div><EmptyState v-if="!overview.pendingBugs.length" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>历史完成需求</CardTitle></CardHeader><CardContent><div class="space-y-2"><div v-for="row in overview.completedRequirements" :key="row.requirementId" class="rounded-md border p-3 text-sm"><div class="font-medium">{{ row.title }}</div><div class="mt-2 flex flex-wrap items-center gap-2"><StatusBadge domain="requirement" :value="row.status" /><span class="text-xs text-muted-foreground">{{ formatDate(row.actualEndTime || row.updateTime) }}</span></div></div><EmptyState v-if="!overview.completedRequirements.length" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>历史修复缺陷</CardTitle></CardHeader><CardContent><div class="space-y-2"><div v-for="row in overview.completedBugs" :key="String(row.ticketId)" class="rounded-md border p-3 text-sm"><div class="font-medium">{{ bugTitle(row) }}</div><div class="mt-2 flex flex-wrap items-center gap-2"><StatusBadge domain="bug" :value="itemStatus(row)" /><span class="text-xs text-muted-foreground">{{ String(row.updateTime || '-') }}</span></div></div><EmptyState v-if="!overview.completedBugs.length" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>项目动态</CardTitle></CardHeader><CardContent><div class="space-y-2"><div v-for="item in overview.activities" :key="item.activityId" class="rounded-md border p-3 text-sm"><div>{{ activityText(item) }}</div><div class="text-muted-foreground">{{ item.operator?.nickName || '-' }} · {{ formatDate(item.createTime) }}</div></div><EmptyState v-if="!overview.activities.length" /></div></CardContent></Card>
    </div>
    <div v-if="!overview && !loading" class="rounded-md border p-8 text-center"><EmptyState title="暂无项目概览" /><Button class="mt-3" @click="load">重新加载</Button></div>
    <Dialog v-model:open="progressOpen"><DialogContent class="max-w-2xl"><DialogHeader><DialogTitle>更新项目进度</DialogTitle></DialogHeader><div class="grid gap-3 md:grid-cols-2"><div class="space-y-2"><Label>项目阶段</Label><Select v-model="progressForm.projectStage"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="s in PM_PROJECT_STAGE_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</SelectItem></SelectContent></Select></div><div class="space-y-2"><Label>风险等级</Label><Select v-model="progressForm.riskLevel"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="r in PM_RISK_LEVEL_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</SelectItem></SelectContent></Select></div><div class="space-y-2"><Label>计划开始</Label><Input v-model="progressForm.plannedStartTime" type="date" /></div><div class="space-y-2"><Label>计划完成</Label><Input v-model="progressForm.plannedEndTime" type="date" /></div><div class="space-y-2"><Label>实际开始</Label><Input v-model="progressForm.actualStartTime" type="date" /></div><div class="space-y-2"><Label>实际完成</Label><Input v-model="progressForm.actualEndTime" type="date" /></div><div class="space-y-2 md:col-span-2"><Label>项目进度：{{ progressForm.progress ?? 0 }}%</Label><Input v-model="progressForm.progress" type="number" min="0" max="100" /></div><div class="space-y-2 md:col-span-2"><Label>风险说明</Label><Textarea v-model="progressForm.riskNote" /></div><div class="space-y-2 md:col-span-2"><Label>操作说明</Label><Textarea v-model="progressForm.remark" placeholder="说明本次阶段/进度/风险调整原因" /></div></div><DialogFooter><Button @click="saveProgress">保存</Button></DialogFooter></DialogContent></Dialog>
  </div>
</template>

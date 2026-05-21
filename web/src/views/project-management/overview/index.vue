<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import FormFieldBlock from '@/components/common/FormFieldBlock.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import ProjectBadge from '@/components/common/ProjectBadge.vue'
import ProjectSelectOption from '@/components/common/ProjectSelectOption.vue'
import ProjectSelectValue from '@/components/common/ProjectSelectValue.vue'
import RiskBadge from '@/components/common/RiskBadge.vue'
import SemanticProgress from '@/components/common/SemanticProgress.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { getRequirement, projectOverview, updateProjectProgress } from '@/api/project-management'
import { bugProjectOptions } from '@/api/bug'
import type {
  ProjectOverview,
  ProjectProgressForm,
  Requirement,
} from '@/api/project-management/types'
import type { BugProject } from '@/api/bug/types'
import {
  PM_PROJECT_STAGE_OPTIONS,
  PM_RISK_LEVEL_OPTIONS,
  formatDate,
  toDateInput,
} from '../shared/options'
import { getRiskStyle, type SemanticTone } from '@/utils/semantic-styles'
import ProjectOverviewWorkGrid from './components/ProjectOverviewWorkGrid.vue'
import RequirementDetailDialog from '../requirements/components/RequirementDetailDialog.vue'

const { toast } = useToast()
const router = useRouter()
const loading = ref(false)
const progressOpen = ref(false)
const requirementDetailOpen = ref(false)
const projects = ref<BugProject[]>([])
const selectedProjectId = ref('')
const overview = ref<ProjectOverview>()
const requirementDetail = ref<Requirement | null>(null)
const progressForm = reactive<ProjectProgressForm>({
  projectStage: 'requirement',
  progress: 0,
  riskLevel: 'low',
  riskNote: '',
  remark: '',
})
const cards = computed<
  Array<{
    label: string
    value: string | number
    tone: SemanticTone
    description: string
    path: string
  }>
>(() => [
  {
    label: '项目进度',
    value: `${overview.value?.progress ?? 0}%`,
    tone: 'info',
    description: '当前项目综合推进进度',
    path: '/project-management/projects',
  },
  {
    label: '需求完成',
    value: `${overview.value?.requirementDone ?? 0}/${overview.value?.requirementTotal ?? 0}`,
    tone: 'success',
    description: '已完成需求 / 全部需求',
    path: '/project-management/requirements',
  },
  {
    label: '缺陷关闭率',
    value: `${overview.value?.bugCloseRate ?? 0}%`,
    tone: 'success',
    description: '已关闭缺陷占比',
    path: '/bug/tickets',
  },
  {
    label: '当前需求',
    value: overview.value?.counts.currentRequirements ?? 0,
    tone: 'info',
    description: '当前正在处理的需求',
    path: '/project-management/requirements',
  },
  {
    label: '修复中缺陷',
    value: overview.value?.counts.currentBugs ?? 0,
    tone: 'warning',
    description: '当前修复中的问题',
    path: '/bug/tickets',
  },
  {
    label: '未处理事项',
    value:
      (overview.value?.counts.pendingRequirements ?? 0) + (overview.value?.counts.pendingBugs ?? 0),
    tone: 'danger',
    description: '待确认、分派或处理事项',
    path: '/project-management/requirements',
  },
])

function goProjectList() {
  router.push('/project-management/projects')
}
function goMilestoneList() {
  router.push('/project-management/milestones')
}
function jumpFromMetric(path: string) {
  router.push(path)
}
function activateOnDoubleClick(event: MouseEvent, action: () => void) {
  if (event.detail >= 2) action()
}
function openProgress() {
  if (!overview.value) return
  const p = overview.value.project
  Object.assign(progressForm, {
    projectStage: p.projectStage || 'requirement',
    progress: p.progress ?? overview.value.progress,
    riskLevel: p.riskLevel || 'low',
    riskNote: p.riskNote || '',
    plannedStartTime: toDateInput(p.plannedStartTime),
    plannedEndTime: toDateInput(p.plannedEndTime),
    actualStartTime: toDateInput(p.actualStartTime),
    actualEndTime: toDateInput(p.actualEndTime),
    remark: '',
  })
  progressOpen.value = true
}
async function saveProgress() {
  if (!selectedProjectId.value) return
  overview.value = await updateProjectProgress(selectedProjectId.value, progressForm)
  toast({ title: '项目进度已更新' })
  progressOpen.value = false
}
async function openRequirementDetail(row: Requirement) {
  try {
    requirementDetail.value = await getRequirement(row.requirementId)
    requirementDetailOpen.value = true
  } catch {
    toast({ title: '需求详情加载失败', description: '请刷新项目概览后重试', variant: 'destructive' })
  }
}

async function load() {
  if (!selectedProjectId.value) return
  loading.value = true
  try {
    overview.value = await projectOverview(selectedProjectId.value)
  } finally {
    loading.value = false
  }
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
      <div>
        <h2 class="text-2xl font-bold">项目概览</h2>
        <p class="text-sm text-muted-foreground">
          项目负责人查看单项目阶段、进度、风险、当前处理和未处理事项。
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Select v-model="selectedProjectId" @update:model-value="load"
          ><SelectTrigger class="w-64"><ProjectSelectValue :model-value="selectedProjectId" :projects="projects" placeholder="选择项目" /></SelectTrigger
          ><SelectContent
            ><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId"><ProjectSelectOption :name="p.projectName" :code="p.projectKey" :stage="p.projectStage" :owner-name="p.owner?.nickName || p.owner?.userName" /></SelectItem></SelectContent
          ></Select
        ><Button
          v-if="overview"
          v-hasPermi="['pm:project:update']"
          variant="outline"
          @click="openProgress"
          >更新进度</Button
        ><TableRefreshIconButton :loading="loading" @refresh="load" />
      </div>
    </div>
    <div v-if="overview" class="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card
        class="cursor-pointer select-none transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        role="button"
        tabindex="0"
        title="双击查看项目列表"
        @click="activateOnDoubleClick($event, goProjectList)"
        @dblclick="goProjectList"
        @keyup.enter="goProjectList"
        ><CardHeader
          ><CardTitle><ProjectBadge :name="overview.project.projectName" :code="overview.project.projectKey" class="max-w-full" /></CardTitle></CardHeader
        ><CardContent class="space-y-4"
          ><div class="flex flex-wrap gap-2">
            <StatusBadge domain="projectStage" :value="overview.project.projectStage" /><RiskBadge
              :value="overview.project.riskLevel"
            /><Badge variant="outline">负责人：{{ overview.project.owner?.nickName || '-' }}</Badge
            ><Badge variant="outline"
              >计划：{{ formatDate(overview.project.plannedStartTime) }} -
              {{ formatDate(overview.project.plannedEndTime) }}</Badge
            >
          </div>
          <div class="flex items-center gap-3">
            <SemanticProgress
              :model-value="overview.progress"
              :tone="getRiskStyle(overview.project.riskLevel).tone"
              class="h-3"
            /><span class="w-12 text-sm font-medium">{{ overview.progress }}%</span>
          </div>
          <p class="text-sm text-muted-foreground">
            风险说明：{{ overview.project.riskNote || '暂无' }}
          </p></CardContent
        ></Card
      >
      <Card
        class="cursor-pointer select-none transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        role="button"
        tabindex="0"
        title="双击查看里程碑列表"
        @click="activateOnDoubleClick($event, goMilestoneList)"
        @dblclick="goMilestoneList"
        @keyup.enter="goMilestoneList"
        ><CardHeader><CardTitle>下一关键节点</CardTitle></CardHeader
        ><CardContent
          ><div v-if="overview.nextMilestone" class="space-y-2 text-sm">
            <div class="font-medium">{{ overview.nextMilestone.milestoneName }}</div>
            <div class="flex items-center gap-2">
              <span>阶段：</span
              ><StatusBadge domain="projectStage" :value="overview.nextMilestone.stage" />
            </div>
            <div>目标日期：{{ formatDate(overview.nextMilestone.targetDate) }}</div>
            <div>负责人：{{ overview.nextMilestone.owner?.nickName || '-' }}</div>
          </div>
          <EmptyState v-else title="暂无下一节点" /></CardContent
      ></Card>
    </div>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <MetricCard
        v-for="item in cards"
        :key="item.label"
        :title="item.label"
        :value="item.value"
        :tone="item.tone"
        :description="item.description"
        interactive
        @activate="jumpFromMetric(item.path)"
      />
    </div>
    <ProjectOverviewWorkGrid
      v-if="overview"
      :overview="overview"
      @requirement-detail="openRequirementDetail"
    />
    <RequirementDetailDialog v-model:open="requirementDetailOpen" :detail="requirementDetail" />
    <div v-if="!overview && !loading" class="rounded-md border p-8 text-center">
      <EmptyState title="暂无项目概览" /><Button class="mt-3" @click="load">重新加载</Button>
    </div>
    <Dialog v-model:open="progressOpen"
      ><DialogContent class="max-w-2xl"
        ><DialogHeader
          ><DialogTitle>更新项目进度</DialogTitle
          ><DialogDescription
            >更新阶段、进度、计划时间和风险信息；日期会用于看板统计和延期判断。</DialogDescription
          ></DialogHeader
        >
        <div class="grid gap-4 md:grid-cols-2">
          <FormFieldBlock
            label="项目阶段"
            field-id="pm-progress-stage"
            description="用于项目看板、老板驾驶舱和阶段统计。"
            ><Select v-model="progressForm.projectStage"
              ><SelectTrigger id="pm-progress-stage"><SelectValue /></SelectTrigger
              ><SelectContent
                ><SelectItem
                  v-for="s in PM_PROJECT_STAGE_OPTIONS"
                  :key="s.value"
                  :value="s.value"
                  >{{ s.label }}</SelectItem
                ></SelectContent
              ></Select
            ></FormFieldBlock
          ><FormFieldBlock
            label="风险等级"
            field-id="pm-progress-risk"
            description="风险等级会以安全色展示，影响管理层关注优先级。"
            ><Select v-model="progressForm.riskLevel"
              ><SelectTrigger id="pm-progress-risk"><SelectValue /></SelectTrigger
              ><SelectContent
                ><SelectItem v-for="r in PM_RISK_LEVEL_OPTIONS" :key="r.value" :value="r.value">{{
                  r.label
                }}</SelectItem></SelectContent
              ></Select
            ></FormFieldBlock
          ><FormFieldBlock
            label="计划开始"
            field-id="pm-progress-plan-start"
            optional
            description="用于排期统计；不确定时可先留空。"
            ><Input
              id="pm-progress-plan-start"
              v-model="progressForm.plannedStartTime"
              type="date" /></FormFieldBlock
          ><FormFieldBlock
            label="计划完成"
            field-id="pm-progress-plan-end"
            optional
            description="用于延期判断和交付计划统计；不确定时可先留空。"
            ><Input
              id="pm-progress-plan-end"
              v-model="progressForm.plannedEndTime"
              type="date" /></FormFieldBlock
          ><FormFieldBlock
            label="实际开始"
            field-id="pm-progress-actual-start"
            optional
            description="用于记录真实启动时间，便于复盘计划偏差。"
            ><Input
              id="pm-progress-actual-start"
              v-model="progressForm.actualStartTime"
              type="date" /></FormFieldBlock
          ><FormFieldBlock
            label="实际完成"
            field-id="pm-progress-actual-end"
            optional
            description="用于计算实际交付周期和完成统计。"
            ><Input
              id="pm-progress-actual-end"
              v-model="progressForm.actualEndTime"
              type="date" /></FormFieldBlock
          ><FormFieldBlock
            :label="`项目进度：${progressForm.progress ?? 0}%`"
            field-id="pm-progress-percent"
            class="md:col-span-2"
            description="填写 0 到 100 的百分比，代表当前项目综合推进程度。"
            ><Input
              id="pm-progress-percent"
              v-model="progressForm.progress"
              type="number"
              min="0"
              max="100" /></FormFieldBlock
          ><FormFieldBlock
            label="风险说明"
            field-id="pm-progress-risk-note"
            optional
            class="md:col-span-2"
            description="记录延期、质量、资源或依赖风险，便于管理层判断风险原因。"
            ><Textarea id="pm-progress-risk-note" v-model="progressForm.riskNote" /></FormFieldBlock
          ><FormFieldBlock
            label="操作说明"
            field-id="pm-progress-remark"
            optional
            class="md:col-span-2"
            description="说明本次阶段、进度或风险调整原因，便于历史追溯。"
            ><Textarea
              id="pm-progress-remark"
              v-model="progressForm.remark"
              placeholder="说明本次阶段/进度/风险调整原因"
          /></FormFieldBlock>
        </div>
        <DialogFooter><Button @click="saveProgress">保存</Button></DialogFooter></DialogContent
      ></Dialog
    >
  </div>
</template>

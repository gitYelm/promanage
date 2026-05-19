<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import RequirementDetailDialog from '../requirements/components/RequirementDetailDialog.vue'
import BugTicketDetailDialog from '@/views/bug/tickets/components/BugTicketDetailDialog.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { getRequirement, listRequirements } from '@/api/project-management'
import { bugProjectOptions, getBugTicket, listBugTickets } from '@/api/bug'
import type { Requirement } from '@/api/project-management/types'
import type { BugProject, BugTicket } from '@/api/bug/types'
import {
  PM_ALL_OPTION_VALUE,
  PM_BUG_BOARD_COLUMNS,
  PM_REQUIREMENT_BOARD_COLUMNS,
  formatDate,
  pmNormalizeAll,
} from '../shared/options'
import { getBoardColumnStyle } from '@/utils/semantic-styles'
import { formatDate as formatDateTime } from '@/utils/format'

type BoardRequirementColumn = (typeof PM_REQUIREMENT_BOARD_COLUMNS)[number] & {
  rows: Requirement[]
}
type BoardBugColumn = (typeof PM_BUG_BOARD_COLUMNS)[number] & {
  rows: BugTicket[]
}

const { toast } = useToast()
const loading = ref(false)
const projects = ref<BugProject[]>([])
const requirements = ref<Requirement[]>([])
const bugs = ref<BugTicket[]>([])
const requirementDetailOpen = ref(false)
const requirementDetail = ref<Requirement | null>(null)
const bugDetailOpen = ref(false)
const bugDetail = ref<BugTicket | null>(null)

const query = reactive({
  projectId: PM_ALL_OPTION_VALUE,
})

const requirementColumns = computed<BoardRequirementColumn[]>(() =>
  PM_REQUIREMENT_BOARD_COLUMNS.map((column) => ({
    ...column,
    rows: requirements.value.filter((row) => column.statuses.includes(row.status)),
  })),
)

const bugColumns = computed<BoardBugColumn[]>(() =>
  PM_BUG_BOARD_COLUMNS.map((column) => ({
    ...column,
    rows: bugs.value.filter((row) => column.statuses.includes(row.status)),
  })),
)

async function load() {
  loading.value = true
  try {
    const params = {
      pageNum: 1,
      pageSize: 100,
      projectId: pmNormalizeAll(query.projectId),
    }
    const [reqRes, bugRes] = await Promise.all([listRequirements(params), listBugTickets(params)])
    requirements.value = reqRes.rows
    bugs.value = bugRes.rows
  } finally {
    loading.value = false
  }
}

function requirementOwner(row: Requirement) {
  return row.developer?.nickName || row.owner?.nickName || row.owner?.userName || '-'
}

function bugOwner(row: BugTicket) {
  return row.assignee?.nickName || row.submitter?.nickName || '-'
}

function requirementMeta(row: Requirement) {
  return `${row.project?.projectName || '-'} · ${requirementOwner(row)}`
}

function bugMeta(row: BugTicket) {
  return `${row.project?.projectName || '-'} · ${bugOwner(row)}`
}

function bugTime(row: BugTicket) {
  return formatDateTime(row.dueTime || row.updateTime, 'YYYY-MM-DD')
}

async function openRequirementDetail(row: Requirement) {
  try {
    requirementDetail.value = await getRequirement(row.requirementId)
    requirementDetailOpen.value = true
  } catch {
    toast({ title: '需求详情加载失败', description: '请刷新项目看板后重试', variant: 'destructive' })
  }
}

async function openBugDetail(row: BugTicket) {
  try {
    bugDetail.value = await getBugTicket(row.ticketId)
    bugDetailOpen.value = true
  } catch {
    toast({ title: '缺陷详情加载失败', description: '请刷新项目看板后重试', variant: 'destructive' })
  }
}

onMounted(async () => {
  projects.value = await bugProjectOptions()
  await load()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold">项目看板</h2>
        <p class="text-sm text-muted-foreground">
          按状态列查看需求和缺陷当前分布，支持长列表滚动与详情快速查看。
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Select v-model="query.projectId" @update:model-value="load">
          <SelectTrigger class="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="PM_ALL_OPTION_VALUE">全部项目</SelectItem>
            <SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">
              {{ p.projectName }}
            </SelectItem>
          </SelectContent>
        </Select>
        <DataRefreshButton :loading="loading" @refresh="load" />
      </div>
    </div>

    <Tabs default-value="requirements" class="space-y-4">
      <TabsList>
        <TabsTrigger value="requirements">需求看板</TabsTrigger>
        <TabsTrigger value="bugs">缺陷看板</TabsTrigger>
      </TabsList>

      <TabsContent value="requirements">
        <div class="overflow-x-auto pb-2">
          <div class="flex min-w-max gap-4">
            <Card
              v-for="column in requirementColumns"
              :key="column.title"
              class="min-h-[26rem] w-[22rem] flex-none border-dashed"
            >
              <CardHeader class="pb-3">
                <CardTitle class="flex items-center justify-between gap-3 text-sm">
                  <span>{{ column.title }}</span>
                  <Badge
                    variant="outline"
                    :class="getBoardColumnStyle(column.title).badgeClass"
                  >
                    {{ column.rows.length }}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent class="max-h-[30rem] space-y-3 overflow-y-auto overscroll-contain pr-3">
                <div
                  v-for="row in column.rows"
                  :key="row.requirementId"
                  class="rounded-md border bg-background p-3 text-sm shadow-sm transition hover:shadow-md"
                  title="双击查看需求详情"
                  @dblclick="openRequirementDetail(row)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="line-clamp-2 font-medium">
                      {{ row.title }}
                    </div>
                    <Button
                      permission="pm:requirement:view"
                      size="xs"
                      variant="outline"
                      @click.stop="openRequirementDetail(row)"
                    >
                      详情
                    </Button>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-1">
                    <StatusBadge domain="requirement" :value="row.status" />
                    <PriorityBadge :value="row.priority" />
                  </div>
                  <div class="mt-2 text-xs text-muted-foreground">
                    {{ requirementMeta(row) }}
                  </div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    计划完成：{{ formatDate(row.plannedEndTime) }}
                  </div>
                </div>
                <EmptyState v-if="!column.rows.length" title="暂无事项" />
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="bugs">
        <div class="overflow-x-auto pb-2">
          <div class="flex min-w-max gap-4">
            <Card
              v-for="column in bugColumns"
              :key="column.title"
              class="min-h-[26rem] w-[22rem] flex-none border-dashed"
            >
              <CardHeader class="pb-3">
                <CardTitle class="flex items-center justify-between gap-3 text-sm">
                  <span>{{ column.title }}</span>
                  <Badge
                    variant="outline"
                    :class="getBoardColumnStyle(column.title).badgeClass"
                  >
                    {{ column.rows.length }}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent class="max-h-[30rem] space-y-3 overflow-y-auto overscroll-contain pr-3">
                <div
                  v-for="row in column.rows"
                  :key="row.ticketId"
                  class="rounded-md border bg-background p-3 text-sm shadow-sm transition hover:shadow-md"
                  title="双击查看缺陷详情"
                  @dblclick="openBugDetail(row)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-xs text-muted-foreground">{{ row.ticketNo }}</div>
                      <div class="line-clamp-2 font-medium">{{ row.title }}</div>
                    </div>
                    <Button
                      permission="bug:ticket:query"
                      size="xs"
                      variant="outline"
                      @click.stop="openBugDetail(row)"
                    >
                      详情
                    </Button>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-1">
                    <StatusBadge domain="bug" :value="row.status" />
                    <PriorityBadge :value="row.priority" />
                  </div>
                  <div class="mt-2 text-xs text-muted-foreground">
                    {{ bugMeta(row) }}
                  </div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    期望完成：{{ bugTime(row) }}
                  </div>
                </div>
                <EmptyState v-if="!column.rows.length" title="暂无事项" />
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <div v-if="!requirements.length && !bugs.length && !loading" class="rounded-md border p-6 text-center">
      <EmptyState title="当前筛选暂无看板数据" />
      <Button class="mt-3" @click="load">重新加载</Button>
    </div>

    <RequirementDetailDialog v-model:open="requirementDetailOpen" :detail="requirementDetail" />
    <BugTicketDetailDialog v-model:open="bugDetailOpen" :detail="bugDetail" />
  </div>
</template>

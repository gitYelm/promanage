<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { listRequirements } from '@/api/project-management'
import { bugProjectOptions, listBugTickets } from '@/api/bug'
import type { Requirement } from '@/api/project-management/types'
import type { BugProject, BugTicket } from '@/api/bug/types'
import { BUG_PRIORITY_OPTIONS, BUG_STATUS_OPTIONS, optionLabel } from '@/views/bug/shared/bug-options'
import { PM_ALL_OPTION_VALUE, PM_BUG_BOARD_COLUMNS, PM_REQUIREMENT_BOARD_COLUMNS, PM_REQUIREMENT_STATUS_OPTIONS, formatDate, pmLabel, pmNormalizeAll } from '../shared/options'

const loading = ref(false)
const projects = ref<BugProject[]>([])
const requirements = ref<Requirement[]>([])
const bugs = ref<BugTicket[]>([])
const query = reactive({ projectId: PM_ALL_OPTION_VALUE })
const requirementColumns = computed(() => PM_REQUIREMENT_BOARD_COLUMNS.map((column) => ({ ...column, rows: requirements.value.filter((row) => column.statuses.includes(row.status)) })))
const bugColumns = computed(() => PM_BUG_BOARD_COLUMNS.map((column) => ({ ...column, rows: bugs.value.filter((row) => column.statuses.includes(row.status)) })))

async function load() {
  loading.value = true
  try {
    const params = { pageNum: 1, pageSize: 100, projectId: pmNormalizeAll(query.projectId) }
    const [reqRes, bugRes] = await Promise.all([listRequirements(params), listBugTickets(params)])
    requirements.value = reqRes.rows; bugs.value = bugRes.rows
  } finally { loading.value = false }
}
function requirementOwner(row: Requirement) { return row.developer?.nickName || row.owner?.nickName || row.owner?.userName || '-' }
function bugOwner(row: BugTicket) { return row.assignee?.nickName || row.submitter?.nickName || '-' }

onMounted(async () => { projects.value = await bugProjectOptions(); await load() })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div><h2 class="text-2xl font-bold">项目看板</h2><p class="text-sm text-muted-foreground">第一版提供只读列视图，方便负责人和老板查看需求与 Bug 当前分布。</p></div>
      <div class="flex flex-wrap gap-2"><Select v-model="query.projectId" @update:model-value="load"><SelectTrigger class="w-64"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select><DataRefreshButton :loading="loading" @refresh="load" /></div>
    </div>
    <Tabs default-value="requirements" class="space-y-4">
      <TabsList><TabsTrigger value="requirements">需求看板</TabsTrigger><TabsTrigger value="bugs">Bug 看板</TabsTrigger></TabsList>
      <TabsContent value="requirements"><div class="grid gap-4 xl:grid-cols-5"><Card v-for="column in requirementColumns" :key="column.title" class="min-h-72"><CardHeader><CardTitle class="flex items-center justify-between text-sm"><span>{{ column.title }}</span><Badge variant="outline">{{ column.rows.length }}</Badge></CardTitle></CardHeader><CardContent class="space-y-3"><div v-for="row in column.rows" :key="row.requirementId" class="rounded-md border bg-background p-3 text-sm shadow-sm"><div class="font-medium">{{ row.title }}</div><div class="mt-2 flex flex-wrap gap-1"><Badge variant="outline">{{ pmLabel(PM_REQUIREMENT_STATUS_OPTIONS, row.status) }}</Badge><Badge variant="outline">{{ row.project?.projectName || '-' }}</Badge></div><div class="mt-2 text-xs text-muted-foreground">负责人：{{ requirementOwner(row) }} · 计划：{{ formatDate(row.plannedEndTime) }}</div></div><EmptyState v-if="!column.rows.length" title="暂无事项" /></CardContent></Card></div></TabsContent>
      <TabsContent value="bugs"><div class="grid gap-4 xl:grid-cols-5"><Card v-for="column in bugColumns" :key="column.title" class="min-h-72"><CardHeader><CardTitle class="flex items-center justify-between text-sm"><span>{{ column.title }}</span><Badge variant="outline">{{ column.rows.length }}</Badge></CardTitle></CardHeader><CardContent class="space-y-3"><div v-for="row in column.rows" :key="row.ticketId" class="rounded-md border bg-background p-3 text-sm shadow-sm"><div class="font-medium">{{ row.ticketNo }} {{ row.title }}</div><div class="mt-2 flex flex-wrap gap-1"><Badge variant="outline">{{ optionLabel(BUG_STATUS_OPTIONS, row.status) }}</Badge><Badge variant="outline">{{ optionLabel(BUG_PRIORITY_OPTIONS, row.priority) }}</Badge></div><div class="mt-2 text-xs text-muted-foreground">负责人：{{ bugOwner(row) }} · 项目：{{ row.project?.projectName || '-' }}</div></div><EmptyState v-if="!column.rows.length" title="暂无事项" /></CardContent></Card></div></TabsContent>
    </Tabs>
    <div v-if="!requirements.length && !bugs.length && !loading" class="rounded-md border p-6 text-center"><EmptyState title="当前筛选暂无看板数据" /><Button class="mt-3" @click="load">重新加载</Button></div>
  </div>
</template>

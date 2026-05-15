<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import ExportDialog from '@/components/common/ExportDialog.vue'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import { bugStatistics } from '@/api/bug'
import type { BugStatisticsResult } from '@/api/bug/types'
import { BUG_SEVERITY_OPTIONS, BUG_STATUS_OPTIONS, optionLabel } from '../shared/bug-options'

const exportOpen = ref(false)
const loading = ref(false)
const data = ref<BugStatisticsResult>({ total: 0, byStatus: [], bySeverity: [], byProject: [], byAssignee: [] })
const statusRows = computed(() => data.value.byStatus.map((item) => ({ label: optionLabel(BUG_STATUS_OPTIONS, item.status), count: item._count.status })))
const severityRows = computed(() => data.value.bySeverity.map((item) => ({ label: optionLabel(BUG_SEVERITY_OPTIONS, item.severity), count: item._count.severity })))
const projectRows = computed(() => data.value.byProject.map((item) => ({ label: item.projectName || `项目 ${item.projectId}`, count: item._count.projectId })))
const assigneeRows = computed(() => data.value.byAssignee.map((item) => ({ label: item.user?.nickName || item.user?.userName || '未指派', count: item._count.assigneeId })))

function percent(count: number) {
  return data.value.total ? Math.round((count / data.value.total) * 100) : 0
}

async function loadStatistics() {
  loading.value = true
  try {
    data.value = await bugStatistics()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadStatistics()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">Bug 看板</h2>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="loadStatistics" />
        <Button v-hasPermi="['bug:statistics:export']" variant="outline" @click="exportOpen = true">导出统计</Button>
      </div>
    </div>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Card><CardHeader><CardTitle>总 Bug 数</CardTitle></CardHeader><CardContent class="text-3xl font-bold">{{ data.total }}</CardContent></Card>
      <Card><CardHeader><CardTitle>状态分布</CardTitle></CardHeader><CardContent class="space-y-2"><div v-for="item in statusRows" :key="item.label"><div class="mb-1 flex justify-between text-sm"><span>{{ item.label }}</span><span>{{ item.count }}</span></div><Progress :model-value="percent(item.count)" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>严重程度</CardTitle></CardHeader><CardContent class="space-y-2"><div v-for="item in severityRows" :key="item.label"><div class="mb-1 flex justify-between text-sm"><span>{{ item.label }}</span><span>{{ item.count }}</span></div><Progress :model-value="percent(item.count)" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>项目分布</CardTitle></CardHeader><CardContent class="space-y-2"><div v-for="item in projectRows" :key="item.label"><div class="mb-1 flex justify-between text-sm"><span>{{ item.label }}</span><span>{{ item.count }}</span></div><Progress :model-value="percent(item.count)" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>负责人分布</CardTitle></CardHeader><CardContent class="space-y-2"><div v-for="item in assigneeRows" :key="item.label"><div class="mb-1 flex justify-between text-sm"><span>{{ item.label }}</span><span>{{ item.count }}</span></div><Progress :model-value="percent(item.count)" /></div></CardContent></Card>
    </div>
    <ExportDialog v-model:open="exportOpen" module="bug-statistics" module-name="Bug 统计" />
  </div>
</template>

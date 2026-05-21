<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ExportDialog from '@/components/common/ExportDialog.vue'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import ProjectBadge from '@/components/common/ProjectBadge.vue'
import SemanticProgress from '@/components/common/SemanticProgress.vue'
import SeverityBadge from '@/components/common/SeverityBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { bugStatistics } from '@/api/bug'
import type { BugStatisticsResult } from '@/api/bug/types'
import { getSeverityStyle, getStatusStyle } from '@/utils/semantic-styles'

const exportOpen = ref(false)
const loading = ref(false)
const data = ref<BugStatisticsResult>({ total: 0, byStatus: [], bySeverity: [], byProject: [], byAssignee: [] })
const statusRows = computed(() => data.value.byStatus.map((item) => ({ value: item.status, count: item._count.status })))
const severityRows = computed(() => data.value.bySeverity.map((item) => ({ value: item.severity, count: item._count.severity })))
const projectRows = computed(() => data.value.byProject.map((item) => ({ projectId: item.projectId, label: item.projectName || `项目 ${item.projectId}`, count: item._count.projectId })))
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
      <h2 class="text-2xl font-bold">缺陷看板</h2>
      <div class="flex items-center gap-2">
        <Button v-hasPermi="['bug:statistics:export']" variant="outline" @click="exportOpen = true">导出统计</Button>
        <TableRefreshIconButton :loading="loading" @refresh="loadStatistics" />
      </div>
    </div>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard title="总 Bug 数" :value="data.total" tone="neutral" description="当前筛选范围内的 Bug 总量" />
      <Card><CardHeader><CardTitle>状态分布</CardTitle></CardHeader><CardContent class="space-y-2"><div v-for="item in statusRows" :key="item.value"><div class="mb-1 flex items-center justify-between gap-2 text-sm"><StatusBadge domain="bug" :value="item.value" /><span :class="getStatusStyle('bug', item.value).textClass" class="font-medium tabular-nums">{{ item.count }}</span></div><SemanticProgress :model-value="percent(item.count)" :tone="getStatusStyle('bug', item.value).tone" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>严重程度</CardTitle></CardHeader><CardContent class="space-y-2"><div v-for="item in severityRows" :key="item.value"><div class="mb-1 flex items-center justify-between gap-2 text-sm"><SeverityBadge :value="item.value" /><span :class="getSeverityStyle(item.value).textClass" class="font-medium tabular-nums">{{ item.count }}</span></div><SemanticProgress :model-value="percent(item.count)" :tone="getSeverityStyle(item.value).tone" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>项目分布</CardTitle></CardHeader><CardContent class="space-y-2"><div v-for="item in projectRows" :key="item.projectId || item.label"><div class="mb-1 flex items-center justify-between gap-2 text-sm"><ProjectBadge :name="item.label" compact /><span>{{ item.count }}</span></div><SemanticProgress :model-value="percent(item.count)" tone="info" /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>负责人分布</CardTitle></CardHeader><CardContent class="space-y-2"><div v-for="item in assigneeRows" :key="item.label"><div class="mb-1 flex justify-between text-sm"><span>{{ item.label }}</span><span>{{ item.count }}</span></div><SemanticProgress :model-value="percent(item.count)" tone="neutral" /></div></CardContent></Card>
    </div>
    <ExportDialog v-model:open="exportOpen" module="bug-statistics" module-name="缺陷统计" />
  </div>
</template>

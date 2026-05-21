<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import SuccessFailBadge from '@/components/common/SuccessFailBadge.vue'
import { RefreshCw } from 'lucide-vue-next'
import { formatDate } from '@/utils/format'
import { getDictLabel } from '@/composables/useDict'
import type { JobRunResult } from '@/api/monitor/job'

const open = defineModel<boolean>('open', { required: true })
defineProps<{
  loading: boolean
  result: JobRunResult | null
  jobGroupOptions: Array<{ label: string; value: string }>
}>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader><DialogTitle>任务执行结果</DialogTitle></DialogHeader>
      <div v-if="loading" class="flex items-center justify-center py-8"><RefreshCw class="h-6 w-6 animate-spin text-muted-foreground" /><span class="ml-2 text-muted-foreground">正在执行...</span></div>
      <div v-else-if="result" class="space-y-4">
        <div class="flex items-center gap-2">
          <SuccessFailBadge :value="result.status" success-label="执行成功" fail-label="执行失败" />
          <span v-if="result.startTime && result.stopTime" class="text-sm text-muted-foreground">耗时 {{ new Date(result.stopTime).getTime() - new Date(result.startTime).getTime() }}ms</span>
        </div>
        <div class="grid gap-3 text-sm">
          <div class="grid grid-cols-[100px_1fr] gap-2"><span class="text-muted-foreground">任务名称</span><span>{{ result.jobName }}</span></div>
          <div class="grid grid-cols-[100px_1fr] gap-2"><span class="text-muted-foreground">任务分组</span><span>{{ getDictLabel(jobGroupOptions, result.jobGroup) }}</span></div>
          <div class="grid grid-cols-[100px_1fr] gap-2"><span class="text-muted-foreground">调用目标</span><span class="break-all">{{ result.invokeTarget }}</span></div>
          <div class="grid grid-cols-[100px_1fr] gap-2"><span class="text-muted-foreground">开始时间</span><span>{{ formatDate(result.startTime) }}</span></div>
          <div class="grid grid-cols-[100px_1fr] gap-2"><span class="text-muted-foreground">结束时间</span><span>{{ formatDate(result.stopTime) }}</span></div>
          <div class="grid grid-cols-[100px_1fr] gap-2"><span class="text-muted-foreground">执行消息</span><span>{{ result.jobMessage }}</span></div>
          <div v-if="result.exceptionInfo" class="grid grid-cols-[100px_1fr] gap-2"><span class="text-muted-foreground">异常信息</span><span class="text-destructive break-all">{{ result.exceptionInfo }}</span></div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

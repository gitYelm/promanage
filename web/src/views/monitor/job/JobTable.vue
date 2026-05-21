<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Edit, Play } from 'lucide-vue-next'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import { changeJobStatus } from '@/api/monitor/job'
import { formatCronExpression, formatDate } from '@/utils/format'
import { getDictLabel } from '@/composables/useDict'
import type { SysJob } from '@/api/system/types'

const props = defineProps<{
  loading: boolean
  jobs: SysJob[]
  selectedIds: string[]
  selectAll: boolean
  jobGroupOptions: Array<{ label: string; value: string }>
  sortBy?: string
  sortOrder?: 'asc' | 'desc' | ''
}>()

const emit = defineEmits<{
  add: []
  run: [job: SysJob]
  edit: [job: SysJob]
  delete: [job: SysJob]
  toggleSelect: [jobId: string]
  updateSelectAll: [checked: boolean]
  statusUpdated: [jobId: string, status: string]
  sort: [key: string]
}>()
</script>

<template>
  <div class="border rounded-md bg-card overflow-x-auto">
    <TableSkeleton v-if="props.loading" :columns="7" :rows="10" show-checkbox />

    <EmptyState
      v-else-if="props.jobs.length === 0"
      title="暂无定时任务"
      description="点击新增任务按钮创建第一个定时任务"
      action-text="新增任务"
      @action="emit('add')"
    />

    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[50px]">
            <Checkbox
              :model-value="props.selectAll"
              :disabled="props.jobs.length === 0"
              @update:model-value="(checked) => emit('updateSelectAll', Boolean(checked))"
            />
          </TableHead>
          <SortableTableHead label="任务编号" sort-key="jobId" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead label="任务名称" sort-key="jobName" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead label="任务组名" sort-key="jobGroup" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead label="调用目标字符串" sort-key="invokeTarget" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead label="Cron执行表达式" sort-key="cronExpression" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead label="状态" sort-key="status" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead label="创建时间" sort-key="createTime" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <TableHead class="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="item in props.jobs" :key="item.jobId">
          <TableCell>
            <Checkbox
              :model-value="props.selectedIds.includes(item.jobId)"
              @update:model-value="() => emit('toggleSelect', item.jobId)"
            />
          </TableCell>
          <TableCell>{{ item.jobId }}</TableCell>
          <TableCell>{{ item.jobName }}</TableCell>
          <TableCell>{{ getDictLabel(props.jobGroupOptions, item.jobGroup) }}</TableCell>
          <TableCell class="max-w-[200px] truncate">{{ item.invokeTarget }}</TableCell>
          <TableCell>
            <div class="space-y-1">
              <Badge variant="outline">{{ item.cronExpression }}</Badge>
              <p
                v-if="formatCronExpression(item.cronExpression)"
                class="text-xs text-muted-foreground"
              >
                {{ formatCronExpression(item.cronExpression) }}
              </p>
            </div>
          </TableCell>
          <TableCell>
            <StatusSwitch
              :status="String(item.status)"
              :name="item.jobName"
              :on-toggle="(status) => changeJobStatus(item.jobId, status)"
              :labels="{ enable: '启用', disable: '暂停' }"
              @update:status="emit('statusUpdated', item.jobId, $event)"
            />
          </TableCell>
          <TableCell>{{ formatDate(item.createTime) }}</TableCell>
          <TableCell class="text-right">
            <TooltipProvider>
              <div class="flex items-center justify-end gap-1">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('run', item)">
                      <Play class="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>执行一次</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('edit', item)">
                      <Edit class="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>修改</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8 text-destructive hover:text-destructive"
                      @click="emit('delete', item)"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>删除</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

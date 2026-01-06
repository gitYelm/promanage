<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DownloadIcon,
  Trash2Icon,
  RefreshCwIcon,
  Loader2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileJsonIcon,
} from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import {
  listExportTasks,
  downloadExportFile,
  deleteExportTask,
  getExportTask,
  getExportConfig,
  type ExportTask,
} from '@/api/common/export'

const props = defineProps<{
  open: boolean
  watchTaskId?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const { toast } = useToast()

const loading = ref(false)
const tasks = ref<ExportTask[]>([])
const fileExpireHours = ref(2) // 默认值
let pollTimer: ReturnType<typeof setInterval> | null = null

// 格式图标
const formatIcons = {
  xlsx: FileSpreadsheetIcon,
  csv: FileTextIcon,
  json: FileJsonIcon,
}

// 状态配置
const statusConfig = {
  pending: { label: '等待中', variant: 'secondary' as const, icon: ClockIcon },
  processing: { label: '处理中', variant: 'default' as const, icon: Loader2Icon },
  completed: { label: '已完成', variant: 'outline' as const, icon: CheckCircle2Icon },
  failed: { label: '失败', variant: 'destructive' as const, icon: XCircleIcon },
}

// 加载任务列表
async function loadTasks() {
  loading.value = true
  try {
    const [result, config] = await Promise.all([
      listExportTasks({ pageSize: 20 }),
      getExportConfig(),
    ])
    tasks.value = result.rows
    fileExpireHours.value = config.fileExpireHours
  } catch {
    toast({ title: '加载失败', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

// 轮询检查任务状态
function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    const pendingTasks = tasks.value.filter(
      (t) => t.status === 'pending' || t.status === 'processing',
    )
    if (pendingTasks.length === 0) {
      stopPolling()
      return
    }

    for (const task of pendingTasks) {
      try {
        const updated = await getExportTask(task.taskId)
        const idx = tasks.value.findIndex((t) => t.taskId === task.taskId)
        if (idx > -1) {
          tasks.value[idx] = updated
          // 完成时自动下载
          if (updated.status === 'completed' && task.status !== 'completed') {
            toast({ title: '导出完成', description: '正在下载...' })
            handleDownload(updated)
          }
        }
      } catch {
        // ignore
      }
    }
  }, 2000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 下载文件
async function handleDownload(task: ExportTask) {
  try {
    const res = await downloadExportFile(task.taskId)
    const blob = new Blob([res as any])
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = task.filePath || `export.${task.format}`
    link.click()
    URL.revokeObjectURL(link.href)
  } catch {
    toast({ title: '下载失败', variant: 'destructive' })
  }
}

// 删除任务
async function handleDelete(task: ExportTask) {
  try {
    await deleteExportTask(task.taskId)
    tasks.value = tasks.value.filter((t) => t.taskId !== task.taskId)
    toast({ title: '已删除' })
  } catch {
    toast({ title: '删除失败', variant: 'destructive' })
  }
}

// 格式化文件大小
function formatSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// 格式化时间
function formatTime(time: string | null): string {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  if (props.open) {
    loadTasks()
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})

// 监听打开状态
import { watch } from 'vue'
watch(
  () => props.open,
  (val) => {
    if (val) {
      loadTasks()
      startPolling()
    } else {
      stopPolling()
    }
  },
)

// 监听新任务
watch(
  () => props.watchTaskId,
  (taskId) => {
    if (taskId) {
      loadTasks()
      startPolling()
    }
  },
)
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent class="w-[450px] sm:max-w-[450px]">
      <SheetHeader>
        <SheetTitle class="flex items-center justify-between">
          导出任务
          <Button variant="ghost" size="icon" :disabled="loading" @click="loadTasks">
            <RefreshCwIcon :class="['h-4 w-4', { 'animate-spin': loading }]" />
          </Button>
        </SheetTitle>
        <SheetDescription>查看和管理导出任务，文件保留 {{ fileExpireHours }} 小时</SheetDescription>
      </SheetHeader>

      <ScrollArea class="h-[calc(100vh-120px)] mt-4 -mx-6 px-6">
        <div v-if="tasks.length === 0" class="text-center text-muted-foreground py-12">
          暂无导出任务
        </div>

        <div v-else class="space-y-3">
          <div v-for="task in tasks" :key="task.taskId" class="rounded-lg border p-4 space-y-3">
            <!-- 头部 -->
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <component :is="formatIcons[task.format]" class="h-5 w-5 text-muted-foreground" />
                <div>
                  <div class="font-medium text-sm line-clamp-1">{{ task.taskName }}</div>
                  <div class="text-xs text-muted-foreground">{{ formatTime(task.createTime) }}</div>
                </div>
              </div>
              <Badge :variant="statusConfig[task.status].variant">
                <component
                  :is="statusConfig[task.status].icon"
                  :class="['h-3 w-3 mr-1', { 'animate-spin': task.status === 'processing' }]"
                />
                {{ statusConfig[task.status].label }}
              </Badge>
            </div>

            <!-- 进度条 -->
            <div v-if="task.status === 'processing'" class="space-y-1">
              <Progress :model-value="task.progress" class="h-2" />
              <div class="text-xs text-muted-foreground text-right">
                {{ task.processedRows || 0 }} / {{ task.totalRows || '?' }} 行 ({{
                  task.progress
                }}%)
              </div>
            </div>

            <!-- 完成信息 -->
            <div v-if="task.status === 'completed'" class="text-xs text-muted-foreground">
              文件大小: {{ formatSize(task.fileSize) }}
            </div>

            <!-- 错误信息 -->
            <div v-if="task.status === 'failed'" class="text-xs text-destructive">
              {{ task.errorMsg || '导出失败' }}
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2">
              <Button v-if="task.status === 'completed'" size="sm" @click="handleDownload(task)">
                <DownloadIcon class="h-4 w-4 mr-1" />
                下载
              </Button>
              <Button variant="ghost" size="sm" @click="handleDelete(task)">
                <Trash2Icon class="h-4 w-4 mr-1" />
                删除
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>
</template>

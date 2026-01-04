<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2Icon, XCircleIcon, Loader2Icon } from 'lucide-vue-next'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ProgressItem {
  id: string | number
  name: string
  status: 'pending' | 'processing' | 'success' | 'error'
  message?: string
}

interface Props {
  /** 是否显示 */
  open: boolean
  /** 标题 */
  title?: string
  /** 进度项列表 */
  items: ProgressItem[]
  /** 是否允许关闭 */
  closable?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '批量操作进度',
  closable: true,
})

const emit = defineEmits<Emits>()

// 统计
const stats = computed(() => {
  const total = props.items.length
  const success = props.items.filter((i) => i.status === 'success').length
  const error = props.items.filter((i) => i.status === 'error').length
  const completed = success + error
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = completed === total
  return { total, success, error, completed, percent, isComplete }
})

function handleClose() {
  if (!props.closable && !stats.value.isComplete) return
  emit('update:open', false)
  emit('close')
}

function getStatusIcon(status: ProgressItem['status']) {
  switch (status) {
    case 'success':
      return CheckCircle2Icon
    case 'error':
      return XCircleIcon
    case 'processing':
      return Loader2Icon
    default:
      return null
  }
}

function getStatusClass(status: ProgressItem['status']) {
  switch (status) {
    case 'success':
      return 'text-green-500'
    case 'error':
      return 'text-destructive'
    case 'processing':
      return 'text-primary animate-spin'
    default:
      return 'text-muted-foreground'
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md" :hide-close="!closable && !stats.isComplete">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          已完成 {{ stats.completed }}/{{ stats.total }}， 成功 {{ stats.success }}，失败
          {{ stats.error }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <Progress :model-value="stats.percent" class="h-2" />

        <ScrollArea class="h-48">
          <div class="space-y-2 pr-4">
            <div
              v-for="item in items"
              :key="item.id"
              class="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span class="truncate">{{ item.name }}</span>
              <div class="flex items-center gap-2">
                <span v-if="item.message" class="text-xs text-muted-foreground">
                  {{ item.message }}
                </span>
                <component
                  :is="getStatusIcon(item.status)"
                  v-if="getStatusIcon(item.status)"
                  class="h-4 w-4 shrink-0"
                  :class="getStatusClass(item.status)"
                />
                <span v-else class="h-4 w-4 shrink-0 rounded-full border-2 border-muted" />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <DialogFooter>
        <Button :disabled="!closable && !stats.isComplete" @click="handleClose">
          {{ stats.isComplete ? '完成' : '关闭' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bug, Bell } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { UserNotification } from '@/api/system/notification-types'

const props = defineProps<{ notification: UserNotification }>()
defineEmits<{ open: [notification: UserNotification] }>()
const unread = computed(() => !props.notification.readTime)
const icon = computed(() => (props.notification.businessType === 'bug_ticket' ? Bug : Bell))
</script>

<template>
  <button
    type="button"
    :class="cn('flex w-full gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted', unread && 'bg-muted/60')"
    @click="$emit('open', notification)"
  >
    <div class="mt-0.5 rounded-full bg-primary/10 p-2 text-primary"><component :is="icon" class="h-4 w-4" /></div>
    <div class="min-w-0 flex-1 space-y-1">
      <div class="flex items-center gap-2">
        <p class="truncate text-sm font-medium">{{ notification.title }}</p>
        <Badge v-if="unread" class="h-4 px-1 text-[10px]">新</Badge>
      </div>
      <p class="line-clamp-2 text-xs text-muted-foreground">{{ notification.content || '暂无通知内容' }}</p>
      <p class="text-[11px] text-muted-foreground">{{ formatRelativeTime(notification.createTime) }}</p>
    </div>
  </button>
</template>

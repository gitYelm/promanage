<script setup lang="ts">
import { computed } from 'vue'
import { Bug, Bell } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { hasAnyPermission } from '@/composables/usePermission'
import { formatRelativeTime } from '@/utils/format'
import { cn } from '@/lib/utils'
import { getNotificationTypeLabel, getNotificationTypeStyle, getSemanticStyle } from '@/utils/semantic-styles'
import type { UserNotification } from '@/api/system/notification-types'

const props = defineProps<{ notification: UserNotification }>()
defineEmits<{ open: [notification: UserNotification] }>()
const unread = computed(() => !props.notification.readTime)
const icon = computed(() => (props.notification.businessType === 'bug_ticket' ? Bug : Bell))
const notificationStatus = computed(() => props.notification.payload?.status)
const tagLabel = computed(() => getNotificationTypeLabel(props.notification.notificationType, notificationStatus.value))
const tagClass = computed(() => getNotificationTypeStyle(props.notification.notificationType, notificationStatus.value).tagClass)
const unreadClass = computed(() => getSemanticStyle('warning').tagClass)
const canMarkRead = computed(() => hasAnyPermission(['system:notification:read']))
</script>

<template>
  <button
    type="button"
    :class="cn('flex w-full min-w-0 gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted', unread && 'bg-muted/60')"
    @click="$emit('open', notification)"
  >
    <div class="mt-0.5 shrink-0 rounded-full bg-primary/10 p-2 text-primary"><component :is="icon" class="h-4 w-4" /></div>
    <div class="min-w-0 flex-1 space-y-1">
      <div class="flex min-w-0 items-center gap-2">
        <p class="min-w-0 flex-1 truncate text-sm font-medium">{{ notification.title }}</p>
        <div class="flex shrink-0 items-center gap-1">
          <Badge variant="outline" :class="cn('h-4 shrink-0 px-1 text-[10px]', tagClass)">{{ tagLabel }}</Badge>
          <Badge v-if="unread && canMarkRead" variant="outline" :class="cn('h-4 shrink-0 px-1 text-[10px]', unreadClass)">新</Badge>
        </div>
      </div>
      <p class="line-clamp-2 break-words text-xs text-muted-foreground">{{ notification.content || '暂无通知内容' }}</p>
      <p class="truncate text-[11px] text-muted-foreground">{{ formatRelativeTime(notification.createTime) }}</p>
    </div>
  </button>
</template>

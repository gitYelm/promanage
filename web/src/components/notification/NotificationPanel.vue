<script setup lang="ts">
import { onMounted } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import EmptyState from '@/components/common/EmptyState.vue'
import { useNotificationStore } from '@/stores/modules/notification'
import NotificationItem from './NotificationItem.vue'

const store = useNotificationStore()
onMounted(() => void store.fetchNotifications())
</script>

<template>
  <div class="w-full min-w-0 max-w-full">
    <div class="flex items-center justify-between border-b p-3">
      <div class="min-w-0">
        <h3 class="text-sm font-semibold">站内通知</h3>
        <p class="truncate text-xs text-muted-foreground">未读 {{ store.unreadCount }} 条</p>
      </div>
      <div class="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" @click="store.fetchNotifications()"><RefreshCw class="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" :disabled="store.unreadCount === 0" @click="store.markAllRead()">全部已读</Button>
      </div>
    </div>
    <ScrollArea class="h-[380px]">
      <div v-if="store.notifications.length" class="space-y-1 p-2">
        <NotificationItem v-for="item in store.notifications" :key="item.notificationId" :notification="item" @open="store.openNotification" />
      </div>
      <EmptyState v-else title="暂无通知" description="新的 Bug、评论和状态变化会显示在这里" />
    </ScrollArea>
  </div>
</template>

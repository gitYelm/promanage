<script setup lang="ts">
import { onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotificationStore } from '@/stores/modules/notification'
import NotificationItem from '@/components/notification/NotificationItem.vue'

const store = useNotificationStore()
onMounted(() => void store.fetchNotifications())
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">站内通知</h2>
        <p class="text-muted-foreground">查看 Bug、评论和状态变化通知。</p>
      </div>
      <Button v-hasPermi="['system:notification:read']" :disabled="store.unreadCount === 0" @click="store.markAllRead()">全部已读</Button>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>通知列表</CardTitle>
        <CardDescription>未读 {{ store.unreadCount }} 条，共 {{ store.total }} 条</CardDescription>
      </CardHeader>
      <CardContent class="space-y-2">
        <NotificationItem v-for="item in store.notifications" :key="item.notificationId" :notification="item" @open="store.openNotification" />
        <p v-if="!store.notifications.length" class="py-12 text-center text-sm text-muted-foreground">暂无通知</p>
      </CardContent>
    </Card>
  </div>
</template>

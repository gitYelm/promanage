<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { Bell } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotificationStore } from '@/stores/modules/notification'
import { useUserStore } from '@/stores/modules/user'
import NotificationPanel from './NotificationPanel.vue'

const store = useNotificationStore()
const userStore = useUserStore()
const canUseNotification = computed(() => {
  return userStore.permissions.includes('*:*:*') || userStore.permissions.includes('system:notification:list')
})

onMounted(() => {
  if (!canUseNotification.value) return
  void store.fetchUnreadCount()
  void store.fetchNotifications()
  void store.connectStream()
})
onBeforeUnmount(() => store.disconnectStream())
</script>

<template>
  <Popover v-if="canUseNotification">
    <PopoverTrigger as-child>
      <Button v-hasPermi="['system:notification:list']" variant="ghost" size="icon" class="relative">
        <Bell class="h-5 w-5" />
        <span v-if="store.unreadCount" class="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1 text-[10px] leading-5 text-destructive-foreground">
          {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
        </span>
        <span class="sr-only">站内通知</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-[min(calc(100vw-2rem),22rem)] p-0">
      <NotificationPanel />
    </PopoverContent>
  </Popover>
</template>

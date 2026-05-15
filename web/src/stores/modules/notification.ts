import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  createNotificationStreamToken,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationUnreadCount,
} from '@/api/system/notification'
import type { UserNotification } from '@/api/system/notification-types'
import { dispatchBugListStale, dispatchBugPendingCountRefresh, dispatchBugTicketOpen } from '@/views/bug/shared/bug-events'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const notifications = ref<UserNotification[]>([])
  const total = ref(0)
  const connectionStatus = ref<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  let eventSource: EventSource | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  const { toast } = useToast()
  const router = useRouter()

  async function fetchUnreadCount() {
    unreadCount.value = (await notificationUnreadCount()).count
  }

  async function fetchNotifications(readStatus?: 'unread' | 'read') {
    const res = await listNotifications({ pageNum: 1, pageSize: 20, readStatus })
    notifications.value = res.rows
    total.value = res.total
  }

  async function connectStream() {
    if (eventSource || connectionStatus.value === 'connecting') return
    connectionStatus.value = 'connecting'
    try {
      const { token } = await createNotificationStreamToken()
      eventSource = new EventSource(`/api/system/notifications/stream?token=${encodeURIComponent(token)}`)
      eventSource.addEventListener('open', () => (connectionStatus.value = 'connected'))
      eventSource.addEventListener('notification', (event) => handleIncomingNotification(JSON.parse((event as MessageEvent).data)))
      eventSource.addEventListener('error', () => scheduleReconnect())
    } catch {
      scheduleReconnect()
    }
  }

  function disconnectStream() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = null
    eventSource?.close()
    eventSource = null
    connectionStatus.value = 'idle'
  }

  function scheduleReconnect() {
    eventSource?.close()
    eventSource = null
    connectionStatus.value = 'error'
    if (reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      void connectStream()
    }, 5000)
  }

  function handleIncomingNotification(notification: UserNotification) {
    unreadCount.value += 1
    notifications.value = [notification, ...notifications.value].slice(0, 20)
    if (notification.businessType === 'bug_ticket') {
      dispatchBugPendingCountRefresh()
      dispatchBugListStale()
    }
    toast({ title: notification.title, description: notification.content || '您有一条新的站内通知' })
  }

  async function markRead(notification: UserNotification) {
    if (!notification.readTime) {
      await markNotificationRead(notification.notificationId)
      notification.readTime = new Date().toISOString()
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  async function markAllRead() {
    await markAllNotificationsRead()
    unreadCount.value = 0
    notifications.value = notifications.value.map((item) => ({ ...item, readTime: item.readTime || new Date().toISOString() }))
  }

  async function openNotification(notification: UserNotification) {
    await markRead(notification)
    const ticketId = notification.payload?.ticketId || notification.businessId
    if (notification.businessType === 'bug_ticket' && ticketId) {
      dispatchBugTicketOpen(String(ticketId))
      await router.push({ path: '/bug/tickets', query: { ticketId: String(ticketId) } })
    }
  }

  return { unreadCount, notifications, total, connectionStatus, fetchUnreadCount, fetchNotifications, connectStream, disconnectStream, markRead, markAllRead, openNotification }
})

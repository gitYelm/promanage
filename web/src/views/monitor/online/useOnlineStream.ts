import { onUnmounted, ref } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { createOnlineStreamToken } from '@/api/monitor/online'

export function useOnlineStream(refresh: () => void | Promise<void>) {
  const enabled = ref(false)
  let eventSource: EventSource | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  const { toast } = useToast()

  async function connect() {
    if (eventSource) return
    try {
      const { token } = await createOnlineStreamToken()
      eventSource = new EventSource(`/api/system/notifications/stream?token=${encodeURIComponent(token)}`)
      eventSource.addEventListener('online-user-change', () => void refresh())
      eventSource.addEventListener('error', scheduleReconnect)
    } catch {
      scheduleReconnect()
    }
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = null
    eventSource?.close()
    eventSource = null
  }

  function scheduleReconnect() {
    eventSource?.close()
    eventSource = null
    if (!enabled.value || reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      void connect()
    }, 5000)
  }

  function toggle() {
    enabled.value = !enabled.value
    if (enabled.value) {
      void connect()
      toast({ title: '实时推送已开启', description: '用户上线、下线或强退后将自动更新列表' })
    } else {
      disconnect()
      toast({ title: '实时推送已关闭' })
    }
  }

  onUnmounted(disconnect)

  return { enabled, toggle }
}

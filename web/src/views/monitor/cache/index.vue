<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCache, type CacheInfo } from '@/api/monitor/cache'
import {
  Loader2,
  RefreshCw,
  Database,
  Activity,
  Server,
  Clock,
  AlertTriangle,
} from 'lucide-vue-next'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from '@/components/ui/toast'
import { SimpleTableFilters } from '@/components/common/table-filter'

const loading = ref(true)
const cache = ref<CacheInfo | null>(null)
const autoRefresh = ref(false)
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)
const lastUpdateTime = ref<string>('')


const commandQuery = reactive({ name: '', callsMin: undefined as number | undefined, callsMax: undefined as number | undefined })
const commandFilterFields = [{ label: '命令名称', key: 'name', placeholder: '请输入命令名称' }]
const commandExpandedFields = [{ label: '调用次数', type: 'number-range' as const, startKey: 'callsMin', endKey: 'callsMax', min: 0 }]
const filteredCommandStats = computed(() =>
  (cache.value?.commandStats || []).filter((item) => {
    const calls = parseInt(item.value) || 0
    return item.name.includes(commandQuery.name.trim()) && inNumberRange(calls, commandQuery.callsMin, commandQuery.callsMax)
  }),
)
function inNumberRange(value: number, min?: number, max?: number) {
  return (min === undefined || value >= min) && (max === undefined || value <= max)
}
function resetCommandFilters() {
  commandQuery.name = ''
  commandQuery.callsMin = undefined
  commandQuery.callsMax = undefined
}

// 命令统计最大值，用于计算进度条
const maxCommandCalls = computed(() => {
  if (!cache.value?.commandStats?.length) return 1
  return Math.max(...filteredCommandStats.value.map((s) => parseInt(s.value) || 0))
})

async function getData() {
  loading.value = true
  try {
    const res = await getCache()
    cache.value = res
    lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN')
  } catch {
    toast({
      title: '获取缓存信息失败',
      description: '请检查 Redis 连接或稍后重试',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
    toast({ title: '已开启自动刷新', description: '每 5 秒更新一次' })
  } else {
    stopAutoRefresh()
    toast({ title: '已关闭自动刷新' })
  }
}

function startAutoRefresh() {
  if (refreshInterval.value) return
  refreshInterval.value = setInterval(() => getData(), 5000)
}

function stopAutoRefresh() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

onMounted(() => {
  getData()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">缓存监控</h2>
        <p class="text-muted-foreground">监控 Redis 缓存服务器状态</p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="lastUpdateTime" class="text-xs text-muted-foreground">
          更新于 {{ lastUpdateTime }}
        </span>
        <Button :variant="autoRefresh ? 'default' : 'outline'" size="sm" @click="toggleAutoRefresh">
          <Activity class="mr-2 h-4 w-4" :class="{ 'animate-pulse': autoRefresh }" />
          {{ autoRefresh ? '自动刷新中' : '自动刷新' }}
        </Button>
        <Button variant="outline" size="sm" :disabled="loading" @click="getData">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          刷新
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-[400px]">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="cache" class="space-y-6">
      <!-- Memory Mode Warning -->
      <Alert
        v-if="cache.isMemoryMode"
        class="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20"
      >
        <AlertTriangle class="h-4 w-4 text-yellow-600" />
        <AlertTitle class="text-yellow-700 dark:text-yellow-500">内存模式</AlertTitle>
        <AlertDescription class="text-yellow-600 dark:text-yellow-500/80">
          当前使用内存模拟 Redis，数据仅供参考。如需真实监控数据，请在 .env 中设置
          REDIS_ENABLED=true 并配置 Redis 连接。
        </AlertDescription>
      </Alert>

      <!-- Key Metrics -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Redis版本</CardTitle>
            <Server class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-xl sm:text-2xl font-bold">{{ cache.redis_version }}</div>
            <p class="text-xs text-muted-foreground">Mode: {{ cache.redis_mode }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">运行时间</CardTitle>
            <Clock class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-xl sm:text-2xl font-bold">{{ cache.uptime_in_days }} 天</div>
            <p class="text-xs text-muted-foreground">Port: {{ cache.tcp_port }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">客户端连接</CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-xl sm:text-2xl font-bold">{{ cache.connected_clients }}</div>
            <p class="text-xs text-muted-foreground">DB Size: {{ cache.dbSize }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">内存使用</CardTitle>
            <Database class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-xl sm:text-2xl font-bold">{{ cache.used_memory_human }}</div>
            <p class="text-xs text-muted-foreground">
              峰值: {{ cache.used_memory_peak_human || '-' }}
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Command Stats -->
      <Card>
        <CardHeader>
          <CardTitle>命令统计</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <SimpleTableFilters
            :query="commandQuery"
            :fields="commandFilterFields"
            :expanded-fields="commandExpandedFields"
            description="默认展示命令名称，展开后可按调用次数范围筛选。"
            @search="() => undefined"
            @reset="resetCommandFilters"
          />
          <div class="space-y-4">
            <div v-for="item in filteredCommandStats" :key="item.name" class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span class="font-medium">{{ item.name }}</span>
                <span>{{ parseInt(item.value).toLocaleString() }} 次</span>
              </div>
              <div class="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary transition-all"
                  :style="{ width: (parseInt(item.value) / maxCommandCalls) * 100 + '%' }"
                />
              </div>
            </div>
            <p
              v-if="!filteredCommandStats.length"
              class="text-sm text-muted-foreground text-center py-4"
            >
              暂无命令统计数据
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Basic Info Table -->
      <Card>
        <CardHeader>
          <CardTitle>详细信息</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell class="font-medium w-[200px]">Redis版本</TableCell>
                <TableCell>{{ cache.redis_version }}</TableCell>
                <TableCell class="font-medium w-[200px]">运行模式</TableCell>
                <TableCell>{{ cache.redis_mode }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">端口</TableCell>
                <TableCell>{{ cache.tcp_port }}</TableCell>
                <TableCell class="font-medium">客户端数</TableCell>
                <TableCell>{{ cache.connected_clients }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">运行时间(天)</TableCell>
                <TableCell>{{ cache.uptime_in_days }}</TableCell>
                <TableCell class="font-medium">使用内存</TableCell>
                <TableCell>{{ cache.used_memory_human }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">内存峰值</TableCell>
                <TableCell>{{ cache.used_memory_peak_human || '-' }}</TableCell>
                <TableCell class="font-medium">最大内存</TableCell>
                <TableCell>
                  <span v-if="cache.maxmemory_human === '0B' || !cache.maxmemory_human">
                    <span class="text-yellow-600">无限制</span>
                    <span class="text-xs text-muted-foreground ml-1">(生产环境建议配置)</span>
                  </span>
                  <span v-else>{{ cache.maxmemory_human }}</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="font-medium">AOF 开启</TableCell>
                <TableCell>{{ cache.aof_enabled === '0' ? '否' : '是' }}</TableCell>
                <TableCell class="font-medium">RDB 状态</TableCell>
                <TableCell>{{ cache.rdb_last_bgsave_status }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

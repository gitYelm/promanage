<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { getDatabase, type DatabaseInfo } from '@/api/monitor/database'
import { Loader2, RefreshCw, Database, Activity, Server, HardDrive, Zap } from 'lucide-vue-next'
import { toast } from '@/components/ui/toast'
import SemanticTag from '@/components/common/SemanticTag.vue'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import { SimpleTableFilters } from '@/components/common/table-filter'
import { sortRowsByState, toggleTableSort } from '@/utils/table-sort'
import {
  DRUID_ALL_VALUE,
  connectionExpandedFields,
  createDruidConnectionQuery,
  createDruidSlowQuery,
  createDruidTableQuery,
  resetDruidConnectionQuery,
  resetDruidSlowQuery,
  resetDruidTableQuery,
  slowExpandedFields,
  slowFilterFields,
  tableExpandedFields,
  tableFilterFields,
} from './druid-filter-config'
import { parseDurationMs, parsePrettySize } from './druid-sort'

const loading = ref(true)
const data = ref<DatabaseInfo | null>(null)
const autoRefresh = ref(false)
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)
const lastUpdateTime = ref<string>('')

const tableQuery = reactive(createDruidTableQuery())
const connectionQuery = reactive(createDruidConnectionQuery())
const slowQuery = reactive(createDruidSlowQuery())
const connectionFilterFields = computed(() => [
  {
    label: '状态',
    key: 'state',
    type: 'select' as const,
    options: toOptions(data.value?.activeConnections.map((item) => item.state) || []),
  },
  { label: '客户端', key: 'clientAddr', placeholder: '请输入客户端地址' },
])
const filteredTables = computed(() =>
  sortRowsByState(
    (data.value?.tables || []).filter((item) =>
      item.tableName.includes(tableQuery.tableName.trim()) &&
      inNumberRange(item.rowCount, tableQuery.rowCountMin, tableQuery.rowCountMax),
    ),
    tableQuery,
    {
      tableName: (item) => item.tableName,
      rowCount: (item) => item.rowCount,
      totalSize: (item) => parsePrettySize(item.totalSize),
      dataSize: (item) => parsePrettySize(item.dataSize),
      indexSize: (item) => parsePrettySize(item.indexSize),
    },
  ),
)
const filteredConnections = computed(() =>
  sortRowsByState(
    (data.value?.activeConnections || []).filter((item) => {
    const stateMatched = connectionQuery.state === DRUID_ALL_VALUE || item.state === connectionQuery.state
      const clientMatched = item.clientAddr.includes(connectionQuery.clientAddr.trim())
      const queryMatched = (item.query || '').includes(connectionQuery.query.trim())
      const timeMatched = inDateRange(item.backendStart, connectionQuery.backendStartBegin, connectionQuery.backendStartEnd)
      return stateMatched && clientMatched && queryMatched && timeMatched
    }),
    connectionQuery,
    {
      pid: (item) => item.pid,
      state: (item) => getStateLabel(item.state),
      clientAddr: (item) => item.clientAddr,
      backendStart: (item) => new Date(item.backendStart || 0),
      query: (item) => item.query || '',
    },
  ),
)
const filteredSlowQueries = computed(() =>
  sortRowsByState(
    (data.value?.slowQueries || []).filter((item) =>
      item.query.includes(slowQuery.query.trim()) &&
      inNumberRange(item.calls, slowQuery.callsMin, slowQuery.callsMax),
    ),
    slowQuery,
    {
      query: (item) => item.query,
      calls: (item) => item.calls,
      avgTime: (item) => parseDurationMs(item.avgTime),
      maxTime: (item) => parseDurationMs(item.maxTime),
    },
  ),
)

function toOptions(values: string[]) {
  return [
    { label: '全部', value: DRUID_ALL_VALUE },
    ...Array.from(new Set(values.filter(Boolean))).map((value) => ({ label: getStateLabel(value), value })),
  ]
}
function inNumberRange(value: number, min?: number, max?: number) {
  return (min === undefined || value >= min) && (max === undefined || value <= max)
}
function inDateRange(value: string | null, begin: string, end: string) {
  if (!value || value === '-') return !begin && !end
  const time = new Date(value).getTime()
  const beginTime = begin ? new Date(begin).getTime() : Number.NEGATIVE_INFINITY
  const endTime = end ? new Date(end).getTime() : Number.POSITIVE_INFINITY
  return !Number.isNaN(time) && time >= beginTime && time <= endTime
}
function handleTableSort(key: string) {
  toggleTableSort(tableQuery, key)
}
function handleConnectionSort(key: string) {
  toggleTableSort(connectionQuery, key)
}
function handleSlowSort(key: string) {
  toggleTableSort(slowQuery, key)
}
const connectionUsageColor = computed(() => {
  if (!data.value) return 'bg-primary'
  const usage = data.value.connections.usage
  if (usage > 80) return 'bg-red-500'
  if (usage > 60) return 'bg-yellow-500'
  return 'bg-green-500'
})

async function getData() {
  loading.value = true
  try {
    const res = await getDatabase()
    data.value = res
    lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN')
  } catch {
    toast({
      title: '获取数据库信息失败',
      description: '请检查数据库连接或稍后重试',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshInterval.value = setInterval(() => getData(), 5000)
    toast({ title: '已开启自动刷新', description: '每 5 秒更新一次' })
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
    toast({ title: '已关闭自动刷新' })
  }
}

function getStateLabel(state: string) {
  const map: Record<string, string> = {
    active: '执行中',
    idle: '空闲',
    'idle in transaction': '事务中',
    unknown: '未知',
  }
  return map[state] || state
}

function getStateTone(state: string) {
  const map = {
    active: 'success',
    idle: 'neutral',
    'idle in transaction': 'warning',
    unknown: 'neutral',
  } as const
  return map[state as keyof typeof map] || 'neutral'
}

function formatTime(iso: string | null) {
  if (!iso || iso === '-') return '-'
  const date = new Date(iso)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN')
}

onMounted(() => getData())
onUnmounted(() => {
  if (refreshInterval.value) clearInterval(refreshInterval.value)
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">数据库监控</h2>
        <p class="text-muted-foreground">PostgreSQL 数据库连接与性能监控</p>
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

    <div v-if="loading && !data" class="flex items-center justify-center h-[400px]">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div v-else-if="data" class="space-y-6">
      <!-- Key Metrics -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">数据库版本</CardTitle>
            <Server class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-xl sm:text-2xl font-bold">
              {{ data.database.version.replace('PostgreSQL ', '') }}
            </div>
            <p class="text-xs text-muted-foreground">{{ data.database.name }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">数据库大小</CardTitle>
            <HardDrive class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-xl sm:text-2xl font-bold">{{ data.database.size }}</div>
            <p class="text-xs text-muted-foreground">{{ data.tables.length }} 张表</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">活跃连接</CardTitle>
            <Activity class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-xl sm:text-2xl font-bold">{{ data.connections.active }}</div>
            <p class="text-xs text-muted-foreground">
              空闲: {{ data.connections.idle }} / 总计: {{ data.connections.total }}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">连接池使用率</CardTitle>
            <Database class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-xl sm:text-2xl font-bold">{{ data.connections.usage }}%</div>
            <Progress
              :model-value="data.connections.usage"
              class="mt-2"
              :class="connectionUsageColor"
            />
            <p class="text-xs text-muted-foreground mt-1">
              {{ data.connections.total }} / {{ data.connections.max }}
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Tables Stats -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <HardDrive class="h-5 w-5" />
            表空间统计
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <SimpleTableFilters
            :query="tableQuery"
            :fields="tableFilterFields"
            :expanded-fields="tableExpandedFields"
            description="默认展示表名，展开后可按行数范围筛选。"
            @search="() => undefined"
            @reset="resetDruidTableQuery(tableQuery)"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label="表名" sort-key="tableName" :sort-by="tableQuery.sortBy" :sort-order="tableQuery.sortOrder" @sort="handleTableSort" />
                <SortableTableHead label="行数" sort-key="rowCount" align="right" class="text-right" :sort-by="tableQuery.sortBy" :sort-order="tableQuery.sortOrder" @sort="handleTableSort" />
                <SortableTableHead label="总大小" sort-key="totalSize" align="right" class="text-right" :sort-by="tableQuery.sortBy" :sort-order="tableQuery.sortOrder" @sort="handleTableSort" />
                <SortableTableHead label="数据大小" sort-key="dataSize" align="right" class="text-right" :sort-by="tableQuery.sortBy" :sort-order="tableQuery.sortOrder" @sort="handleTableSort" />
                <SortableTableHead label="索引大小" sort-key="indexSize" align="right" class="text-right" :sort-by="tableQuery.sortBy" :sort-order="tableQuery.sortOrder" @sort="handleTableSort" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="table in filteredTables" :key="table.tableName">
                <TableCell class="font-medium">{{ table.tableName }}</TableCell>
                <TableCell class="text-right">{{ table.rowCount.toLocaleString() }}</TableCell>
                <TableCell class="text-right">{{ table.totalSize }}</TableCell>
                <TableCell class="text-right">{{ table.dataSize }}</TableCell>
                <TableCell class="text-right">{{ table.indexSize }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Active Connections -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Activity class="h-5 w-5" />
            当前连接
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <SimpleTableFilters
            :query="connectionQuery"
            :fields="connectionFilterFields"
            :expanded-fields="connectionExpandedFields"
            description="默认展示状态和客户端，展开后可按查询语句与连接时间范围筛选。"
            @search="() => undefined"
            @reset="resetDruidConnectionQuery(connectionQuery)"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label="PID" sort-key="pid" :sort-by="connectionQuery.sortBy" :sort-order="connectionQuery.sortOrder" @sort="handleConnectionSort" />
                <SortableTableHead label="状态" sort-key="state" align="center" class="text-center" :sort-by="connectionQuery.sortBy" :sort-order="connectionQuery.sortOrder" @sort="handleConnectionSort" />
                <SortableTableHead label="客户端" sort-key="clientAddr" :sort-by="connectionQuery.sortBy" :sort-order="connectionQuery.sortOrder" @sort="handleConnectionSort" />
                <SortableTableHead label="连接时间" sort-key="backendStart" :sort-by="connectionQuery.sortBy" :sort-order="connectionQuery.sortOrder" @sort="handleConnectionSort" />
                <SortableTableHead label="当前查询" sort-key="query" class="max-w-[300px]" :sort-by="connectionQuery.sortBy" :sort-order="connectionQuery.sortOrder" @sort="handleConnectionSort" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="conn in filteredConnections" :key="conn.pid">
                <TableCell class="font-mono">{{ conn.pid }}</TableCell>
                <TableCell class="text-center">
                  <SemanticTag :tone="getStateTone(conn.state)">
                    {{ getStateLabel(conn.state) }}
                  </SemanticTag>
                </TableCell>
                <TableCell>{{ conn.clientAddr }}</TableCell>
                <TableCell class="text-sm">{{ formatTime(conn.backendStart) }}</TableCell>
                <TableCell class="max-w-[300px] truncate text-xs font-mono">
                  {{ conn.query || '-' }}
                </TableCell>
              </TableRow>
              <TableRow v-if="!filteredConnections.length">
                <TableCell colspan="5" class="text-center text-muted-foreground">
                  暂无活跃连接
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Slow Queries -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Zap class="h-5 w-5" />
            慢查询统计
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <SimpleTableFilters
            v-if="data.slowQueries.length"
            :query="slowQuery"
            :fields="slowFilterFields"
            :expanded-fields="slowExpandedFields"
            description="默认展示查询语句，展开后可按调用次数范围筛选。"
            @search="() => undefined"
            @reset="resetDruidSlowQuery(slowQuery)"
          />
          <div v-if="data.slowQueries.length">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead label="查询语句" sort-key="query" class="w-[50%]" :sort-by="slowQuery.sortBy" :sort-order="slowQuery.sortOrder" @sort="handleSlowSort" />
                  <SortableTableHead label="调用次数" sort-key="calls" align="right" class="text-right" :sort-by="slowQuery.sortBy" :sort-order="slowQuery.sortOrder" @sort="handleSlowSort" />
                  <SortableTableHead label="平均耗时" sort-key="avgTime" align="right" class="text-right" :sort-by="slowQuery.sortBy" :sort-order="slowQuery.sortOrder" @sort="handleSlowSort" />
                  <SortableTableHead label="最大耗时" sort-key="maxTime" align="right" class="text-right" :sort-by="slowQuery.sortBy" :sort-order="slowQuery.sortOrder" @sort="handleSlowSort" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(q, i) in filteredSlowQueries" :key="i">
                  <TableCell class="font-mono text-xs truncate max-w-[400px]">
                    {{ q.query }}
                  </TableCell>
                  <TableCell class="text-right">{{ q.calls.toLocaleString() }}</TableCell>
                  <TableCell class="text-right">{{ q.avgTime }}</TableCell>
                  <TableCell class="text-right">{{ q.maxTime }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div v-else class="py-6 text-muted-foreground">
            <p class="mb-4 text-center">暂无慢查询数据，需要启用 pg_stat_statements 扩展</p>
            <div class="bg-muted rounded-lg p-4 text-sm space-y-4">
              <div class="border-b border-border pb-3">
                <p class="font-medium text-foreground mb-2">💡 何时需要开启？</p>
                <ul class="list-disc list-inside space-y-1 text-xs">
                  <li>接口响应明显变慢，需要排查数据库瓶颈</li>
                  <li>数据量较大（万级以上），想优化查询性能</li>
                  <li>生产环境做性能调优和监控</li>
                </ul>
                <p class="text-xs mt-2 text-muted-foreground">
                  开发环境或小规模使用通常无需开启，该扩展有轻微性能开销（约 1-3%）
                </p>
              </div>
              <div class="space-y-3">
                <p class="font-medium text-foreground">如需开启，请按以下步骤操作：</p>
                <div>
                  <p class="font-medium text-foreground mb-1">1. 修改 postgresql.conf 配置文件：</p>
                  <code class="block p-2 bg-background rounded text-xs">
                    shared_preload_libraries = 'pg_stat_statements'
                  </code>
                </div>
                <div>
                  <p class="font-medium text-foreground mb-1">2. 重启 PostgreSQL 服务</p>
                </div>
                <div>
                  <p class="font-medium text-foreground mb-1">3. 在数据库中执行：</p>
                  <code class="block p-2 bg-background rounded text-xs">
                    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
                  </code>
                </div>
                <div>
                  <p class="font-medium text-foreground mb-1">
                    4. 如果使用 Docker，可在 docker-compose.yml 中添加：
                  </p>
                  <code class="block p-2 bg-background rounded text-xs whitespace-pre"
                    >command: postgres -c shared_preload_libraries=pg_stat_statements</code
                  >
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

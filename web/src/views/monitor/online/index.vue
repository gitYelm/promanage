<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/toast/use-toast'
import { LogOut, RefreshCw, Search, Loader2, Copy } from 'lucide-vue-next'
import TableColumnSettingsButton from '@/components/common/TableColumnSettingsButton.vue'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import { TableFilterPanel } from '@/components/common/table-filter'
import { listOnline, forceLogout, type SysUserOnline } from '@/api/monitor/online'
import { useUserStore } from '@/stores/modules/user'
import { usePermission } from '@/composables/usePermission'
import { toggleTableSort } from '@/utils/table-sort'
import { useOnlineColumns } from './online-columns'

const { toast } = useToast()
const userStore = useUserStore()
const { columns, visibleColumnMap, toggleColumn, resetColumns } = useOnlineColumns()
const canShowOperationColumn = usePermission(['monitor:online:forceLogout'])

// State
const loading = ref(true)
const onlineList = ref<SysUserOnline[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  ipaddr: '',
  userName: '',
  sortBy: '',
  sortOrder: '' as 'asc' | 'desc' | '',
})

// 选择相关
const selectedIds = ref<string[]>([])
const selectAll = ref(false)
const hasSelectedRows = computed(() => selectedIds.value.length > 0)

// 监听全选状态变化
watch(selectAll, (newVal) => {
  if (newVal) {
    selectedIds.value = onlineList.value.map((item) => item.tokenId)
  } else {
    selectedIds.value = []
  }
})

// 强退确认弹窗
const showLogoutDialog = ref(false)
const logoutTarget = ref<{ type: 'single' | 'batch'; user?: SysUserOnline }>({ type: 'single' })

// 自动刷新
const autoRefresh = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

// 格式化时间
function formatTime(isoString: string) {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 格式化在线时长
function formatDuration(ms: number) {
  if (!ms || ms < 0) return '-'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天${hours % 24}小时${minutes % 60}分`
  }
  if (hours > 0) {
    return `${hours}小时${minutes % 60}分${seconds % 60}秒`
  }
  if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`
  }
  return `${seconds}秒`
}

// 截断显示 tokenId（前6位...后6位）
function truncateToken(token: string) {
  if (!token || token.length <= 16) return token
  return `${token.substring(0, 6)}...${token.substring(token.length - 6)}`
}

// 复制会话编号
async function copyTokenId(tokenId: string) {
  try {
    await navigator.clipboard.writeText(tokenId)
    toast({ title: '复制成功', description: '会话编号已复制到剪贴板' })
  } catch {
    toast({ title: '复制失败', variant: 'destructive' })
  }
}

// 判断是否为当前用户
function isCurrentUser(userName: string) {
  return userName === userStore.name
}

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listOnline(queryParams)
    onlineList.value = res.rows
    total.value = res.total
    // 清除已不存在的选中项
    selectedIds.value = selectedIds.value.filter((id) =>
      res.rows.some((r: SysUserOnline) => r.tokenId === id),
    )
  } finally {
    loading.value = false
  }
}

// Search Operations
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function handleSort(key: string) {
  toggleTableSort(queryParams, key)
  getList()
}

function resetQuery() {
  queryParams.ipaddr = ''
  queryParams.userName = ''
  queryParams.sortBy = ''
  queryParams.sortOrder = ''
  handleQuery()
}

// 选择操作
function toggleSelect(tokenId: string) {
  const idx = selectedIds.value.indexOf(tokenId)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(tokenId)
  }
  // 更新全选状态
  selectAll.value =
    selectedIds.value.length > 0 && selectedIds.value.length === onlineList.value.length
}

// 强退操作
function openLogoutDialog(row?: SysUserOnline) {
  if (row) {
    logoutTarget.value = { type: 'single', user: row }
  } else {
    logoutTarget.value = { type: 'batch' }
  }
  showLogoutDialog.value = true
}

async function confirmLogout() {
  try {
    if (logoutTarget.value.type === 'single' && logoutTarget.value.user) {
      await forceLogout(logoutTarget.value.user.tokenId)
      toast({ title: '操作成功', description: '用户已强退' })
    } else {
      // 批量强退
      await Promise.all(selectedIds.value.map((id) => forceLogout(id)))
      toast({ title: '操作成功', description: `已强退 ${selectedIds.value.length} 个用户` })
      selectedIds.value = []
    }
    getList()
  } catch {
    toast({ title: '操作失败', variant: 'destructive' })
  } finally {
    showLogoutDialog.value = false
  }
}

// 自动刷新
function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshTimer = setInterval(getList, 10000) // 10秒刷新一次
    toast({ title: '自动刷新已开启', description: '每10秒刷新一次' })
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    toast({ title: '自动刷新已关闭' })
  }
}

onMounted(() => {
  getList()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">在线用户</h2>
        <p class="text-muted-foreground">监控当前系统活跃用户</p>
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          :class="{ 'bg-primary/10': autoRefresh }"
          @click="toggleAutoRefresh"
        >
          {{ autoRefresh ? '关闭自动刷新' : '自动刷新' }}
        </Button>
        <TableColumnSettingsButton :columns="columns" @toggle="toggleColumn" @reset="resetColumns" />
        <TableRefreshIconButton :loading="loading" @refresh="getList" />
      </div>
    </div>

    <TableFilterPanel description="当前页面筛选项较少，直接展示全部可用查询条件。" expand-text="更多筛选">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-1"><label for="online-filter-ip" class="text-sm font-medium">登录地址</label><Input id="online-filter-ip" v-model="queryParams.ipaddr" placeholder="请输入登录地址" @keyup.enter="handleQuery" /></div>
        <div class="space-y-1"><label for="online-filter-user" class="text-sm font-medium">用户名称</label><Input id="online-filter-user" v-model="queryParams.userName" placeholder="请输入用户名称" @keyup.enter="handleQuery" /></div>
        <div class="flex items-end gap-2"><Button data-permission-neutral @click="handleQuery"><Search class="w-4 h-4 mr-2" />搜索</Button><Button variant="outline" data-permission-neutral @click="resetQuery"><RefreshCw class="w-4 h-4 mr-2" />重置</Button></div>
      </div>
    </TableFilterPanel>

    <!-- 批量操作栏 - 勾选后显示 -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="hasSelectedRows"
        class="flex items-center gap-4 px-4 py-3 bg-muted/50 border rounded-lg"
      >
        <span class="text-sm">
          已选择 <span class="font-medium">{{ selectedIds.length }}</span> 项
        </span>
        <Button variant="destructive" size="sm" @click="openLogoutDialog()"> 批量强退 </Button>
      </div>
    </Transition>

    <!-- Table -->
    <div class="border rounded-md bg-card overflow-x-auto">
      <!-- 骨架屏 -->
      <TableSkeleton
        v-if="loading && onlineList.length === 0"
        :columns="8"
        :rows="10"
        show-checkbox
      />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="!loading && onlineList.length === 0"
        title="暂无在线用户"
        description="当前没有活跃的在线用户"
      />

      <!-- 数据表格 -->
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">
              <Checkbox v-model="selectAll" :disabled="onlineList.length === 0" />
            </TableHead>
            <SortableTableHead v-if="visibleColumnMap.tokenId" label="会话编号" sort-key="tokenId" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead v-if="visibleColumnMap.userName" label="用户名称" sort-key="userName" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead v-if="visibleColumnMap.ipaddr" label="主机" sort-key="ipaddr" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead v-if="visibleColumnMap.loginLocation" label="登录地点" sort-key="loginLocation" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead v-if="visibleColumnMap.browser" label="浏览器" sort-key="browser" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead v-if="visibleColumnMap.os" label="操作系统" sort-key="os" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead v-if="visibleColumnMap.loginTime" label="登录时间" sort-key="loginTime" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead v-if="visibleColumnMap.onlineDuration" label="在线时长" sort-key="onlineDuration" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <TableHead v-if="canShowOperationColumn && visibleColumnMap.actions" class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="item in onlineList"
            :key="item.tokenId"
            :class="{ 'bg-primary/5': isCurrentUser(item.userName) }"
          >
            <TableCell>
              <Checkbox
                :model-value="selectedIds.includes(item.tokenId)"
                @update:model-value="() => toggleSelect(item.tokenId)"
              />
            </TableCell>
            <TableCell v-if="visibleColumnMap.tokenId">
              <div class="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger class="cursor-default font-mono text-xs">
                      {{ truncateToken(item.tokenId) }}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p class="font-mono text-xs">{{ item.tokenId }}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-6 w-6"
                  title="复制会话编号"
                  @click="copyTokenId(item.tokenId)"
                >
                  <Copy class="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
            <TableCell v-if="visibleColumnMap.userName">
              <span class="flex items-center gap-1">
                {{ item.userName }}
                <span
                  v-if="isCurrentUser(item.userName)"
                  class="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded"
                >
                  当前
                </span>
              </span>
            </TableCell>
            <TableCell v-if="visibleColumnMap.ipaddr" class="font-mono text-sm">{{ item.ipaddr }}</TableCell>
            <TableCell v-if="visibleColumnMap.loginLocation">{{ item.loginLocation || '-' }}</TableCell>
            <TableCell v-if="visibleColumnMap.browser">{{ item.browser || '-' }}</TableCell>
            <TableCell v-if="visibleColumnMap.os">{{ item.os || '-' }}</TableCell>
            <TableCell v-if="visibleColumnMap.loginTime">{{ formatTime(item.loginTime) }}</TableCell>
            <TableCell v-if="visibleColumnMap.onlineDuration">
              <span class="text-sm text-muted-foreground">{{
                formatDuration(item.onlineDuration)
              }}</span>
            </TableCell>
            <TableCell v-if="canShowOperationColumn && visibleColumnMap.actions" class="text-right">
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive"
                :disabled="isCurrentUser(item.userName)"
                @click="openLogoutDialog(item)"
              >
                <LogOut class="w-4 h-4 mr-2" />
                强退
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <TablePagination
      v-model:page-num="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      @change="getList"
    />

    <!-- 强退确认弹窗 -->
    <AlertDialog v-model:open="showLogoutDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认强退</AlertDialogTitle>
          <AlertDialogDescription>
            <template v-if="logoutTarget.type === 'single'">
              确定要强制退出用户「{{ logoutTarget.user?.userName }}」吗？该用户将被立即踢出系统。
            </template>
            <template v-else>
              确定要强制退出选中的 {{ selectedIds.length }} 个用户吗？这些用户将被立即踢出系统。
            </template>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmLogout"
          >
            确认强退
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

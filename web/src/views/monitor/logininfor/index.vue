<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useToast } from '@/components/ui/toast/use-toast'
import { Trash2, RefreshCw, Search } from 'lucide-vue-next'
import {
  listLogininfor,
  delLogininfor,
  cleanLogininfor,
  type LogininforQuery,
} from '@/api/monitor/logininfor'
import type { SysLoginLog } from '@/api/system/types'
import { formatDate } from '@/utils/format'
import { getStatusOptionsWithAll, toQueryValue, ALL_OPTION_VALUE } from '@/utils/options'
import TablePagination from '@/components/common/TablePagination.vue'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import SuccessFailBadge from '@/components/common/SuccessFailBadge.vue'
import { FilterRangeField, TableFilterPanel } from '@/components/common/table-filter'
import { toggleTableSort } from '@/utils/table-sort'

const { toast } = useToast()

// State
const loading = ref(true)
const logList = ref<SysLoginLog[]>([])
const total = ref(0)
const queryParams = reactive<LogininforQuery & { status: string }>({
  pageNum: 1,
  pageSize: 20,
  userName: '',
  ipaddr: '',
  status: ALL_OPTION_VALUE,
  beginTime: undefined,
  endTime: undefined,
  sortBy: '',
  sortOrder: '',
})

// 选择相关
const selectedIds = ref<string[]>([])
const selectAll = ref(false)
const hasSelectedRows = computed(() => selectedIds.value.length > 0)

// 监听全选状态变化
watch(selectAll, (newVal) => {
  if (newVal) {
    selectedIds.value = logList.value.map((item) => item.infoId)
  } else {
    selectedIds.value = []
  }
})

const showCleanDialog = ref(false)
const showBatchDeleteDialog = ref(false)

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listLogininfor({
      ...queryParams,
      status: toQueryValue(queryParams.status),
    })
    logList.value = res.rows
    total.value = res.total
    // 清除已不存在的选中项
    selectedIds.value = selectedIds.value.filter((id) =>
      res.rows.some((r: SysLoginLog) => r.infoId === id),
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
  queryParams.userName = ''
  queryParams.ipaddr = ''
  queryParams.status = ALL_OPTION_VALUE
  queryParams.beginTime = undefined
  queryParams.endTime = undefined
  queryParams.sortBy = ''
  queryParams.sortOrder = ''
  handleQuery()
}

// 选择操作
function toggleSelect(infoId: string) {
  const idx = selectedIds.value.indexOf(infoId)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(infoId)
  }
  selectAll.value =
    selectedIds.value.length > 0 && selectedIds.value.length === logList.value.length
}

// 批量删除
function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    toast({ title: '提示', description: '请选择要删除的日志', variant: 'destructive' })
    return
  }
  showBatchDeleteDialog.value = true
}

async function confirmBatchDelete() {
  try {
    await delLogininfor(selectedIds.value)
    toast({ title: '删除成功', description: `已删除 ${selectedIds.value.length} 条日志` })
    selectedIds.value = []
    selectAll.value = false
    getList()
  } finally {
    showBatchDeleteDialog.value = false
  }
}

async function handleClean() {
  await cleanLogininfor()
  toast({ title: '清空成功', description: '日志已清空' })
  showCleanDialog.value = false
  getList()
}

onMounted(() => {
  getList()
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">登录日志</h2>
        <p class="text-muted-foreground">记录系统登录日志信息</p>
      </div>
      <div class="flex items-center gap-2">
        <AlertDialog v-model:open="showCleanDialog">
          <Button variant="destructive" @click="showCleanDialog = true">
            <Trash2 class="mr-2 h-4 w-4" />
            清空
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认清空</AlertDialogTitle>
              <AlertDialogDescription>
                确认要清空所有登录日志吗？此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction @click="handleClean">确认</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <TableRefreshIconButton :loading="loading" @refresh="getList" />
      </div>
    </div>

    <TableFilterPanel description="默认展示用户名称、登录地址和状态，展开后可按登录时间范围完整筛选。">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-1"><label for="login-log-filter-user" class="text-sm font-medium">用户名称</label><Input id="login-log-filter-user" v-model="queryParams.userName" placeholder="请输入用户名称" @keyup.enter="handleQuery" /></div>
        <div class="space-y-1"><label for="login-log-filter-ip" class="text-sm font-medium">登录地址</label><Input id="login-log-filter-ip" v-model="queryParams.ipaddr" placeholder="请输入IP地址" @keyup.enter="handleQuery" /></div>
        <div class="space-y-1"><label for="login-log-filter-status" class="text-sm font-medium">状态</label><Select v-model="queryParams.status"><SelectTrigger id="login-log-filter-status"><SelectValue placeholder="请选择" /></SelectTrigger><SelectContent><SelectItem v-for="opt in getStatusOptionsWithAll('successFail')" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem></SelectContent></Select></div>
        <div class="flex items-end gap-2"><Button data-permission-neutral @click="handleQuery"><Search class="w-4 h-4 mr-2" />搜索</Button><Button variant="outline" data-permission-neutral @click="resetQuery"><RefreshCw class="w-4 h-4 mr-2" />重置</Button></div>
      </div>
      <template #expanded>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <FilterRangeField v-model:start="queryParams.beginTime" v-model:end="queryParams.endTime" label="登录时间" />
        </div>
      </template>
    </TableFilterPanel>

    <!-- 批量操作栏 -->
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
        <Button variant="destructive" size="sm" @click="handleBatchDelete"> 批量删除 </Button>
      </div>
    </Transition>

    <!-- Table -->
    <div class="border rounded-md bg-card overflow-x-auto">
      <!-- 骨架屏 -->
      <TableSkeleton v-if="loading" :columns="8" :rows="10" :show-actions="false" show-checkbox />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="logList.length === 0"
        title="暂无登录日志"
        description="系统登录日志将在此显示"
      />

      <!-- 数据表格 -->
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">
              <Checkbox v-model="selectAll" :disabled="logList.length === 0" />
            </TableHead>
            <SortableTableHead label="访问编号" sort-key="infoId" class="w-[100px]" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="用户名称" sort-key="userName" class="w-[120px]" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="登录地址" sort-key="ipaddr" class="w-[140px]" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="登录地点" sort-key="loginLocation" class="min-w-[120px]" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="浏览器" sort-key="browser" class="w-[120px]" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="操作系统" sort-key="os" class="w-[120px]" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="登录状态" sort-key="status" align="center" class="w-[90px] text-center" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="操作信息" sort-key="msg" class="min-w-[150px]" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="登录时间" sort-key="loginTime" class="w-[170px]" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in logList" :key="item.infoId" class="h-12">
            <TableCell>
              <Checkbox
                :model-value="selectedIds.includes(item.infoId)"
                @update:model-value="() => toggleSelect(item.infoId)"
              />
            </TableCell>
            <TableCell>{{ item.infoId }}</TableCell>
            <TableCell>{{ item.userName }}</TableCell>
            <TableCell>{{ item.ipaddr }}</TableCell>
            <TableCell>{{ item.loginLocation }}</TableCell>
            <TableCell>{{ item.browser }}</TableCell>
            <TableCell>{{ item.os }}</TableCell>
            <TableCell class="text-center">
              <SuccessFailBadge :value="item.status" />
            </TableCell>
            <TableCell>{{ item.msg }}</TableCell>
            <TableCell>{{ formatDate(item.loginTime) }}</TableCell>
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

    <!-- Batch Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showBatchDeleteDialog"
      title="确认批量删除"
      :description="`您确定要删除选中的 ${selectedIds.length} 条登录日志吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmBatchDelete"
    />
  </div>
</template>

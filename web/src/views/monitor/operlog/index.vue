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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast/use-toast'
import { Trash2, RefreshCw, Search, Eye } from 'lucide-vue-next'
import { listOperLog, delOperLog, cleanOperLog } from '@/api/monitor/operlog'
import type { SysOperLog } from '@/api/system/types'
import { formatDate } from '@/utils/format'
import { getStatusOptionsWithAll, toQueryValue, ALL_OPTION_VALUE } from '@/utils/options'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'

const { toast } = useToast()

// State
const loading = ref(true)
const logList = ref<SysOperLog[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  title: '',
  operName: '',
  businessType: ALL_OPTION_VALUE as string,
  status: ALL_OPTION_VALUE as string,
})

// 选择相关
const selectedIds = ref<string[]>([])
const selectAll = ref(false)
const hasSelectedRows = computed(() => selectedIds.value.length > 0)

// 监听全选状态变化
watch(selectAll, (newVal) => {
  if (newVal) {
    selectedIds.value = logList.value.map((item) => item.operId)
  } else {
    selectedIds.value = []
  }
})

const showDetail = ref(false)
const currentLog = ref<SysOperLog | null>(null)
const showCleanDialog = ref(false)
const showBatchDeleteDialog = ref(false)

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listOperLog({
      ...queryParams,
      businessType: toQueryValue(queryParams.businessType),
      status: toQueryValue(queryParams.status),
    })
    logList.value = res.rows
    total.value = res.total
    // 清除已不存在的选中项
    selectedIds.value = selectedIds.value.filter((id) =>
      res.rows.some((r: SysOperLog) => r.operId === id),
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

function resetQuery() {
  queryParams.title = ''
  queryParams.operName = ''
  queryParams.businessType = ALL_OPTION_VALUE
  queryParams.status = ALL_OPTION_VALUE
  handleQuery()
}

// 选择操作
function toggleSelect(operId: string) {
  const idx = selectedIds.value.indexOf(operId)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(operId)
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
    await delOperLog(selectedIds.value)
    toast({ title: '删除成功', description: `已删除 ${selectedIds.value.length} 条日志` })
    selectedIds.value = []
    selectAll.value = false
    getList()
  } finally {
    showBatchDeleteDialog.value = false
  }
}

async function handleClean() {
  await cleanOperLog()
  toast({ title: '清空成功', description: '日志已清空' })
  showCleanDialog.value = false
  getList()
}

function handleView(row: SysOperLog) {
  currentLog.value = row
  showDetail.value = true
}

function getBusinessTypeLabel(type: number) {
  const map: Record<number, string> = {
    0: '其它',
    1: '新增',
    2: '修改',
    3: '删除',
    4: '授权',
    5: '导出',
    6: '导入',
    7: '强退',
    8: '清空',
  }
  return map[type] || '未知'
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
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">操作日志</h2>
        <p class="text-muted-foreground">记录系统操作日志信息</p>
      </div>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getList" />
        <AlertDialog v-model:open="showCleanDialog">
          <Button variant="destructive" @click="showCleanDialog = true">
            <Trash2 class="mr-2 h-4 w-4" />
            清空
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认清空</AlertDialogTitle>
              <AlertDialogDescription>
                确认要清空所有操作日志吗？此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction @click="handleClean">确认</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">系统模块</span>
        <Input
          v-model="queryParams.title"
          placeholder="请输入系统模块"
          class="w-[150px]"
          @keyup.enter="handleQuery"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">操作人员</span>
        <Input
          v-model="queryParams.operName"
          placeholder="请输入操作人员"
          class="w-[150px]"
          @keyup.enter="handleQuery"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">类型</span>
        <Select v-model="queryParams.businessType" @update:model-value="handleQuery">
          <SelectTrigger class="w-[120px]">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL_OPTION_VALUE">全部</SelectItem>
            <SelectItem value="0">其它</SelectItem>
            <SelectItem value="1">新增</SelectItem>
            <SelectItem value="2">修改</SelectItem>
            <SelectItem value="3">删除</SelectItem>
            <SelectItem value="4">授权</SelectItem>
            <SelectItem value="5">导出</SelectItem>
            <SelectItem value="6">导入</SelectItem>
            <SelectItem value="7">强退</SelectItem>
            <SelectItem value="8">清空</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">状态</span>
        <Select v-model="queryParams.status" @update:model-value="handleQuery">
          <SelectTrigger class="w-[120px]">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in getStatusOptionsWithAll('successFail')"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex gap-2 ml-auto">
        <Button @click="handleQuery">
          <Search class="w-4 h-4 mr-2" />
          搜索
        </Button>
        <Button variant="outline" @click="resetQuery">
          <RefreshCw class="w-4 h-4 mr-2" />
          重置
        </Button>
      </div>
    </div>

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
        title="暂无操作日志"
        description="系统操作日志将在此显示"
      />

      <!-- 数据表格 -->
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">
              <Checkbox v-model="selectAll" :disabled="logList.length === 0" />
            </TableHead>
            <TableHead>日志编号</TableHead>
            <TableHead>系统模块</TableHead>
            <TableHead>操作类型</TableHead>
            <TableHead>操作人员</TableHead>
            <TableHead>主机</TableHead>
            <TableHead>操作地点</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in logList" :key="item.operId">
            <TableCell>
              <Checkbox
                :model-value="selectedIds.includes(item.operId)"
                @update:model-value="() => toggleSelect(item.operId)"
              />
            </TableCell>
            <TableCell>{{ item.operId }}</TableCell>
            <TableCell>{{ item.title }}</TableCell>
            <TableCell>
              <Badge variant="outline">{{ getBusinessTypeLabel(item.businessType) }}</Badge>
            </TableCell>
            <TableCell>{{ item.operName }}</TableCell>
            <TableCell>{{ item.operIp }}</TableCell>
            <TableCell>{{ item.operLocation }}</TableCell>
            <TableCell>
              <Badge :variant="item.status === 0 ? 'default' : 'destructive'">
                {{ item.status === 0 ? '成功' : '失败' }}
              </Badge>
            </TableCell>
            <TableCell>{{ formatDate(item.operTime) }}</TableCell>
            <TableCell class="text-right space-x-2">
              <Button variant="ghost" size="icon" @click="handleView(item)">
                <Eye class="w-4 h-4" />
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

    <!-- Detail Dialog -->
    <Dialog v-model:open="showDetail">
      <DialogContent class="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>操作日志详情</DialogTitle>
          <DialogDescription> 查看操作日志的详细信息 </DialogDescription>
        </DialogHeader>

        <div v-if="currentLog" class="flex-1 overflow-y-auto grid gap-4 py-4 text-sm">
          <div class="grid grid-cols-2 gap-4">
            <div><span class="font-medium">操作模块：</span>{{ currentLog.title }}</div>
            <div><span class="font-medium">请求方式：</span>{{ currentLog.requestMethod }}</div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="font-medium">登录信息：</span>{{ currentLog.operName }} /
              {{ currentLog.operIp }} / {{ currentLog.operLocation }}
            </div>
            <div><span class="font-medium">操作方法：</span>{{ currentLog.method }}</div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><span class="font-medium">浏览器：</span>{{ currentLog.browser || '-' }}</div>
            <div><span class="font-medium">操作系统：</span>{{ currentLog.os || '-' }}</div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="font-medium">操作耗时：</span>
              {{ currentLog.costTime !== undefined ? `${currentLog.costTime}ms` : '-' }}
            </div>
            <div>
              <span class="font-medium">操作时间：</span>{{ formatDate(currentLog.operTime) }}
            </div>
          </div>
          <div>
            <div class="font-medium mb-1">请求参数：</div>
            <div
              class="bg-muted p-2 rounded text-xs break-all font-mono max-h-[150px] overflow-y-auto"
            >
              {{ currentLog.operParam }}
            </div>
          </div>
          <div>
            <div class="font-medium mb-1">返回参数：</div>
            <div
              class="bg-muted p-2 rounded text-xs break-all font-mono max-h-[150px] overflow-y-auto"
            >
              {{ currentLog.jsonResult }}
            </div>
          </div>
          <div v-if="currentLog.userAgent">
            <div class="font-medium mb-1">User-Agent：</div>
            <div class="bg-muted p-2 rounded text-xs break-all max-h-[80px] overflow-y-auto">
              {{ currentLog.userAgent }}
            </div>
          </div>
          <div v-if="currentLog.status === 1">
            <div class="font-medium mb-1 text-destructive">异常信息：</div>
            <div
              class="bg-destructive/10 text-destructive p-2 rounded text-xs break-all max-h-[100px] overflow-y-auto"
            >
              {{ currentLog.errorMsg }}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Batch Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showBatchDeleteDialog"
      title="确认批量删除"
      :description="`您确定要删除选中的 ${selectedIds.length} 条操作日志吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmBatchDelete"
    />
  </div>
</template>

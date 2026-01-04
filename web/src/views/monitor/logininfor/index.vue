<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
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
import { Badge } from '@/components/ui/badge'
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
import { listLogininfor, cleanLogininfor, type LogininforQuery } from '@/api/monitor/logininfor'
import type { SysLoginLog } from '@/api/system/types'
import { formatDate } from '@/utils/format'
import { getStatusOptionsWithAll, toQueryValue, ALL_OPTION_VALUE } from '@/utils/options'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'

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
})
const showCleanDialog = ref(false)

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
  queryParams.userName = ''
  queryParams.ipaddr = ''
  queryParams.status = ALL_OPTION_VALUE
  queryParams.beginTime = undefined
  queryParams.endTime = undefined
  handleQuery()
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
      </div>
    </div>

    <!-- Filters -->
    <div
      class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">用户名称</span>
        <Input
          v-model="queryParams.userName"
          placeholder="请输入用户名称"
          class="w-[150px]"
          @keyup.enter="handleQuery"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">登录地址</span>
        <Input
          v-model="queryParams.ipaddr"
          placeholder="请输入IP地址"
          class="w-[150px]"
          @keyup.enter="handleQuery"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">状态</span>
        <Select v-model="queryParams.status" @update:model-value="handleQuery">
          <SelectTrigger class="w-[100px]">
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
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">登录时间</span>
        <Input v-model="queryParams.beginTime" type="date" class="w-[140px]" />
        <span class="text-muted-foreground">至</span>
        <Input v-model="queryParams.endTime" type="date" class="w-[140px]" />
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

    <!-- Table -->
    <div class="border rounded-md bg-card overflow-x-auto">
      <!-- 骨架屏 -->
      <TableSkeleton v-if="loading" :columns="8" :rows="10" :show-actions="false" />

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
            <TableHead class="w-[100px]">访问编号</TableHead>
            <TableHead class="w-[120px]">用户名称</TableHead>
            <TableHead class="w-[140px]">登录地址</TableHead>
            <TableHead class="min-w-[120px]">登录地点</TableHead>
            <TableHead class="w-[120px]">浏览器</TableHead>
            <TableHead class="w-[120px]">操作系统</TableHead>
            <TableHead class="w-[90px]">登录状态</TableHead>
            <TableHead class="min-w-[150px]">操作信息</TableHead>
            <TableHead class="w-[170px]">登录时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in logList" :key="item.infoId" class="h-12">
            <TableCell>{{ item.infoId }}</TableCell>
            <TableCell>{{ item.userName }}</TableCell>
            <TableCell>{{ item.ipaddr }}</TableCell>
            <TableCell>{{ item.loginLocation }}</TableCell>
            <TableCell>{{ item.browser }}</TableCell>
            <TableCell>{{ item.os }}</TableCell>
            <TableCell>
              <Badge :variant="item.status === '0' ? 'default' : 'destructive'">
                {{ item.status === '0' ? '成功' : '失败' }}
              </Badge>
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
  </div>
</template>

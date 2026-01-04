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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast/use-toast'
import { Trash2, Plus, RefreshCw, Search, Edit, Play } from 'lucide-vue-next'
import { formatCronExpression, formatDate } from '@/utils/format'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import CronGenerator from '@/components/common/CronGenerator.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import { listJob, getJob, delJob, addJob, updateJob, runJob, changeJobStatus } from '@/api/monitor/job'
import type { SysJob } from '@/api/system/types'
import { getStatusOptionsWithAll, getStatusOptions, toQueryValue, ALL_OPTION_VALUE } from '@/utils/options'

const { toast } = useToast()

// State
const loading = ref(true)
const jobList = ref<SysJob[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  jobName: '',
  jobGroup: '',
  status: ALL_OPTION_VALUE as string
})

const showDialog = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)

const form = reactive<Partial<SysJob>>({
  jobId: undefined,
  jobName: '',
  jobGroup: 'DEFAULT',
  invokeTarget: '',
  cronExpression: '',
  misfirePolicy: '1',
  concurrent: '1',
  status: '0',
  remark: ''
})

// 确认框状态
const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null
})

// 更新任务状态
function updateJobStatus(jobId: string, status: string) {
  const job = jobList.value.find(j => j.jobId === jobId)
  if (job) {
    job.status = status as '0' | '1'
  }
}

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listJob({
      ...queryParams,
      status: toQueryValue(queryParams.status)
    })
    jobList.value = res.rows
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
  queryParams.jobName = ''
  queryParams.jobGroup = ''
  queryParams.status = ALL_OPTION_VALUE
  handleQuery()
}

// Add/Edit Operations
function handleAdd() {
  resetForm()
  isEdit.value = false
  showDialog.value = true
}

async function handleUpdate(row: SysJob) {
  resetForm()
  isEdit.value = true
  const res = await getJob(row.jobId)
  Object.assign(form, res)
  showDialog.value = true
}

function handleDelete(row: SysJob) {
  confirmDialog.title = '删除任务'
  confirmDialog.description = `确认要删除定时任务"${row.jobName}"吗？`
  confirmDialog.action = async () => {
    await delJob([row.jobId])
    toast({ title: "删除成功", description: "任务已删除" })
    getList()
  }
  confirmDialog.open = true
}

function handleRun(row: SysJob) {
  confirmDialog.title = '执行任务'
  confirmDialog.description = `确认要立即执行一次任务"${row.jobName}"吗？`
  confirmDialog.action = async () => {
    await runJob(row.jobId)
    toast({ title: "执行成功", description: "任务已下发执行" })
  }
  confirmDialog.open = true
}

async function handleConfirm() {
  if (confirmDialog.action) {
    try {
      await confirmDialog.action()
    } catch {
      // error handled by interceptor
    }
  }
  confirmDialog.open = false
}



async function handleSubmit() {
  if (!form.jobName || !form.invokeTarget || !form.cronExpression) {
    toast({ title: "验证失败", description: "任务名称、调用目标和Cron表达式不能为空", variant: "destructive" })
    return
  }

  submitLoading.value = true
  try {
    if (form.jobId) {
      await updateJob(form)
      toast({ title: "修改成功", description: "任务信息已更新" })
    } else {
      await addJob(form)
      toast({ title: "新增成功", description: "任务已创建" })
    }
    showDialog.value = false
    getList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

function resetForm() {
  form.jobId = undefined
  form.jobName = ''
  form.jobGroup = 'DEFAULT'
  form.invokeTarget = ''
  form.cronExpression = ''
  form.misfirePolicy = '1'
  form.concurrent = '1'
  form.status = '0'
  form.remark = ''
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
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">定时任务</h2>
        <p class="text-muted-foreground">
          管理系统定时调度任务
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新增任务
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">任务名称</span>
        <Input 
          v-model="queryParams.jobName" 
          placeholder="请输入任务名称" 
          class="w-[150px]"
          @keyup.enter="handleQuery"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">任务组名</span>
        <Select v-model="queryParams.jobGroup" @update:model-value="handleQuery">
          <SelectTrigger class="w-[150px]">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DEFAULT">默认</SelectItem>
            <SelectItem value="SYSTEM">系统</SelectItem>
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
            <SelectItem v-for="opt in getStatusOptionsWithAll('normalPause')" :key="opt.value" :value="opt.value">
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

    <!-- Table -->
    <div class="border rounded-md bg-card overflow-x-auto">
      <!-- 骨架屏 -->
      <TableSkeleton v-if="loading" :columns="7" :rows="10" />
      
      <!-- 空状态 -->
      <EmptyState
        v-else-if="jobList.length === 0"
        title="暂无定时任务"
        description="点击新增任务按钮创建第一个定时任务"
        action-text="新增任务"
        @action="handleAdd"
      />
      
      <!-- 数据表格 -->
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>任务编号</TableHead>
            <TableHead>任务名称</TableHead>
            <TableHead>任务组名</TableHead>
            <TableHead>调用目标字符串</TableHead>
            <TableHead>Cron执行表达式</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in jobList" :key="item.jobId">
            <TableCell>{{ item.jobId }}</TableCell>
            <TableCell>{{ item.jobName }}</TableCell>
            <TableCell>{{ item.jobGroup }}</TableCell>
            <TableCell class="max-w-[200px] truncate">{{ item.invokeTarget }}</TableCell>
            <TableCell>
              <div class="space-y-1">
                <Badge variant="outline">{{ item.cronExpression }}</Badge>
                <p v-if="formatCronExpression(item.cronExpression)" class="text-xs text-muted-foreground">
                  {{ formatCronExpression(item.cronExpression) }}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <StatusSwitch
                :status="String(item.status)"
                :name="item.jobName"
                :on-toggle="(s) => changeJobStatus(item.jobId, s)"
                :labels="{ enable: '启用', disable: '暂停' }"
                @update:status="updateJobStatus(item.jobId, $event)"
              />
            </TableCell>
            <TableCell>{{ formatDate(item.createTime) }}</TableCell>
            <TableCell class="text-right">
              <TooltipProvider>
                <div class="flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-8 w-8" @click="handleRun(item)">
                        <Play class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>执行一次</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-8 w-8" @click="handleUpdate(item)">
                        <Edit class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>修改</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive" @click="handleDelete(item)">
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>删除</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
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

    <!-- Confirm Dialog -->
    <AlertDialog :open="confirmDialog.open" @update:open="(v) => confirmDialog.open = v">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ confirmDialog.title }}</AlertDialogTitle>
          <AlertDialogDescription>{{ confirmDialog.description }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="confirmDialog.open = false">取消</AlertDialogCancel>
          <AlertDialogAction @click.prevent="handleConfirm">确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Add/Edit Dialog -->
    <Dialog v-model:open="showDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{ isEdit ? '修改任务' : '新增任务' }}</DialogTitle>
          <DialogDescription>
            请填写定时任务信息
          </DialogDescription>
        </DialogHeader>
        
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="jobName">任务名称 *</Label>
              <Input id="jobName" v-model="form.jobName" placeholder="请输入任务名称" />
            </div>
            <div class="grid gap-2">
              <Label for="jobGroup">任务分组</Label>
              <Select v-model="form.jobGroup">
                <SelectTrigger>
                  <SelectValue placeholder="选择分组" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">默认</SelectItem>
                  <SelectItem value="SYSTEM">系统</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div class="grid gap-2">
            <Label for="invokeTarget">调用方法 *</Label>
            <Input id="invokeTarget" v-model="form.invokeTarget" placeholder="请输入调用目标字符串" />
            <p class="text-xs text-muted-foreground">Bean调用示例：ryTask.ryParams('ry')</p>
          </div>

          <div class="grid gap-2">
             <Label for="cronExpression">Cron表达式 *</Label>
             <CronGenerator v-model="form.cronExpression" />
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div class="grid gap-2">
              <Label for="misfirePolicy">错误策略</Label>
              <Select v-model="form.misfirePolicy">
                <SelectTrigger>
                  <SelectValue placeholder="选择策略" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">立即执行</SelectItem>
                  <SelectItem value="2">执行一次</SelectItem>
                  <SelectItem value="3">放弃执行</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2">
              <Label for="concurrent">是否并发</Label>
              <Select v-model="form.concurrent">
                <SelectTrigger>
                  <SelectValue placeholder="选择是否并发" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">允许</SelectItem>
                  <SelectItem value="1">禁止</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="status">状态</Label>
            <div class="flex items-center space-x-2">
               <Switch 
                 :checked="String(form.status) === '0'"
                 @update:checked="(v: boolean) => form.status = v ? '0' : '1'"
               />
               <span class="text-sm text-muted-foreground">{{ String(form.status) === '0' ? '正常' : '暂停' }}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDialog = false">取消</Button>
          <Button @click="handleSubmit" :disabled="submitLoading">
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

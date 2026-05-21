<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
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
import { toggleTableSort } from '@/utils/table-sort'
import { Plus } from 'lucide-vue-next'
import TablePagination from '@/components/common/TablePagination.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import { SimpleTableFilters } from '@/components/common/table-filter'
import JobFormDialog from './JobFormDialog.vue'
import JobRunResultDialog from './JobRunResultDialog.vue'
import JobTable from './JobTable.vue'
import {
  listJob,
  getJob,
  delJob,
  addJob,
  updateJob,
  runJob,
  changeJobStatus,
  type JobRunResult,
} from '@/api/monitor/job'
import type { SysJob } from '@/api/system/types'
import { getStatusOptionsWithAll, toQueryValue, ALL_OPTION_VALUE } from '@/utils/options'
import { useDict, getDictLabel } from '@/composables/useDict'

// 任务分组字典
const { options: jobGroupOptions } = useDict('sys_job_group')

const { toast } = useToast()

// State
const loading = ref(true)
const jobList = ref<SysJob[]>([])
const total = ref(0)
const JOB_GROUP_ALL = '__all__'
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  jobName: '',
  jobGroup: JOB_GROUP_ALL,
  status: ALL_OPTION_VALUE as string,
  invokeTarget: '',
  cronExpression: '',
  sortBy: '',
  sortOrder: '' as 'asc' | 'desc' | '',
})
const jobFilterFields = [
  { label: '任务名称', key: 'jobName', placeholder: '请输入任务名称' },
  { label: '任务组名', key: 'jobGroup', type: 'select' as const, options: [{ label: '全部', value: JOB_GROUP_ALL }, ...jobGroupOptions.value] },
  { label: '状态', key: 'status', type: 'select' as const, options: getStatusOptionsWithAll('normalPause') },
]
const jobExpandedFields = [
  { label: '调用目标', key: 'invokeTarget', placeholder: '请输入调用目标' },
  { label: 'Cron 表达式', key: 'cronExpression', placeholder: '请输入 Cron 表达式' },
]

// 选择相关
const selectedIds = ref<string[]>([])
const selectAll = ref(false)
const hasSelectedRows = computed(() => selectedIds.value.length > 0)

// 监听全选状态变化
watch(selectAll, (newVal) => {
  if (newVal) {
    selectedIds.value = jobList.value.map((item) => item.jobId)
  } else {
    selectedIds.value = []
  }
})

const showDialog = ref(false)
const showBatchDeleteDialog = ref(false)
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
  remark: '',
})

// 确认框状态
const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null,
})

// 执行结果弹窗
const runResultDialog = reactive({
  open: false,
  loading: false,
  result: null as JobRunResult | null,
})

// 更新任务状态
function updateJobStatus(jobId: string, status: string) {
  const job = jobList.value.find((j) => j.jobId === jobId)
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
      jobGroup: queryParams.jobGroup === JOB_GROUP_ALL ? '' : queryParams.jobGroup,
      status: toQueryValue(queryParams.status),
    })
    jobList.value = res.rows
    total.value = res.total
    // 清除已不存在的选中项
    selectedIds.value = selectedIds.value.filter((id) =>
      res.rows.some((r: SysJob) => r.jobId === id),
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
  queryParams.jobName = ''
  queryParams.jobGroup = JOB_GROUP_ALL
  queryParams.status = ALL_OPTION_VALUE
  queryParams.invokeTarget = ''
  queryParams.cronExpression = ''
  queryParams.sortBy = ''
  queryParams.sortOrder = ''
  handleQuery()
}

// 选择操作
function toggleSelect(jobId: string) {
  const idx = selectedIds.value.indexOf(jobId)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(jobId)
  }
  selectAll.value =
    selectedIds.value.length > 0 && selectedIds.value.length === jobList.value.length
}

// 批量删除
function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    toast({ title: '提示', description: '请选择要删除的任务', variant: 'destructive' })
    return
  }
  showBatchDeleteDialog.value = true
}

async function confirmBatchDelete() {
  try {
    await delJob(selectedIds.value)
    toast({ title: '删除成功', description: `已删除 ${selectedIds.value.length} 个任务` })
    selectedIds.value = []
    selectAll.value = false
    getList()
  } finally {
    showBatchDeleteDialog.value = false
  }
}

// 批量启用/停用
const showBatchStatusDialog = ref(false)
const batchStatusType = ref<'0' | '1'>('0')

function handleBatchStatus(status: '0' | '1') {
  if (selectedIds.value.length === 0) {
    toast({ title: '提示', description: '请选择要操作的任务', variant: 'destructive' })
    return
  }
  batchStatusType.value = status
  showBatchStatusDialog.value = true
}

async function confirmBatchStatus() {
  const status = batchStatusType.value
  const text = status === '0' ? '启用' : '暂停'
  try {
    for (const jobId of selectedIds.value) {
      await changeJobStatus(jobId, status)
    }
    toast({ title: '操作成功', description: `已${text} ${selectedIds.value.length} 个任务` })
    selectedIds.value = []
    selectAll.value = false
    getList()
  } finally {
    showBatchStatusDialog.value = false
  }
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
    toast({ title: '删除成功', description: '任务已删除' })
    getList()
  }
  confirmDialog.open = true
}

function handleRun(row: SysJob) {
  confirmDialog.title = '执行任务'
  confirmDialog.description = `确认要立即执行一次任务"${row.jobName}"吗？`
  confirmDialog.action = async () => {
    runResultDialog.loading = true
    runResultDialog.open = true
    runResultDialog.result = null
    try {
      const result = await runJob(row.jobId)
      runResultDialog.result = result
    } catch {
      runResultDialog.open = false
    } finally {
      runResultDialog.loading = false
    }
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
    toast({
      title: '验证失败',
      description: '任务名称、调用目标和Cron表达式不能为空',
      variant: 'destructive',
    })
    return
  }

  submitLoading.value = true
  try {
    if (form.jobId) {
      await updateJob(form)
      toast({ title: '修改成功', description: '任务信息已更新' })
    } else {
      await addJob(form)
      toast({ title: '新增成功', description: '任务已创建' })
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
        <p class="text-muted-foreground">管理系统定时调度任务</p>
      </div>
      <div class="flex items-center gap-2">
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新增任务
        </Button>
        <TableRefreshIconButton :loading="loading" @refresh="getList" />
      </div>
    </div>

    <SimpleTableFilters
      :query="queryParams"
      :fields="jobFilterFields"
      :expanded-fields="jobExpandedFields"
      description="默认展示任务名称、分组和状态，展开后可按调用目标与 Cron 表达式完整筛选。"
      @search="handleQuery"
      @reset="resetQuery"
    />

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
        <Button variant="outline" size="sm" @click="handleBatchStatus('0')"> 批量启用 </Button>
        <Button variant="outline" size="sm" @click="handleBatchStatus('1')"> 批量暂停 </Button>
        <Button variant="destructive" size="sm" @click="handleBatchDelete"> 批量删除 </Button>
      </div>
    </Transition>

    <JobTable
      :loading="loading"
      :jobs="jobList"
      :selected-ids="selectedIds"
      :select-all="selectAll"
      :job-group-options="jobGroupOptions"
      :sort-by="queryParams.sortBy"
      :sort-order="queryParams.sortOrder"
      @add="handleAdd"
      @run="handleRun"
      @edit="handleUpdate"
      @delete="handleDelete"
      @toggle-select="toggleSelect"
      @update-select-all="(checked) => (selectAll = checked)"
      @status-updated="updateJobStatus"
      @sort="handleSort"
    />

    <!-- Pagination -->
    <TablePagination
      v-model:page-num="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      @change="getList"
    />

    <!-- Confirm Dialog -->
    <AlertDialog :open="confirmDialog.open" @update:open="(v) => (confirmDialog.open = v)">
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

    <!-- Batch Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showBatchDeleteDialog"
      title="确认批量删除"
      :description="`您确定要删除选中的 ${selectedIds.length} 个任务吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmBatchDelete"
    />

    <!-- Batch Status Dialog -->
    <ConfirmDialog
      v-model:open="showBatchStatusDialog"
      :title="`确认批量${batchStatusType === '0' ? '启用' : '暂停'}`"
      :description="`您确定要${batchStatusType === '0' ? '启用' : '暂停'}选中的 ${selectedIds.length} 个任务吗？`"
      confirm-text="确定"
      @confirm="confirmBatchStatus"
    />

    <JobFormDialog
      v-model:open="showDialog"
      :form="form"
      :is-edit="isEdit"
      :submitting="submitLoading"
      :job-group-options="jobGroupOptions"
      @submit="handleSubmit"
    />

    <JobRunResultDialog
      v-model:open="runResultDialog.open"
      :loading="runResultDialog.loading"
      :result="runResultDialog.result"
      :job-group-options="jobGroupOptions"
    />
  </div>
</template>

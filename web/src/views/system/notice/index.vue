<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast/use-toast'
import { Plus } from 'lucide-vue-next'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import { SimpleTableFilters } from '@/components/common/table-filter'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LeaveConfirmDialog from '@/components/common/LeaveConfirmDialog.vue'
import { toggleTableSort } from '@/utils/table-sort'
import {
  listNotice,
  getNotice,
  delNotice,
  addNotice,
  updateNotice,
  changeNoticeStatus,
  type NoticeFormState,
  type SysNotice,
} from '@/api/system/notice'
import { getUploadConfig, type UploadConfig } from '@/api/system/config'
import { useUnsavedChanges } from '@/composables'
import NoticeTable from './components/NoticeTable.vue'
import NoticeFormDialog from './NoticeFormDialog.vue'
import NoticePreviewDialog from './NoticePreviewDialog.vue'

const { toast } = useToast()

// 上传配置
const uploadConfig = ref<UploadConfig>({
  editorImageMaxSize: 5,
  editorVideoMaxSize: 50,
  avatarMaxSize: 2,
  systemMaxSize: 2,
})

// 未保存更改提示（弹窗场景，禁用路由守卫）
const { isDirty, markClean, showLeaveDialog, confirmLeave, cancelLeave, tryLeave } =
  useUnsavedChanges({ enableRouteGuard: false })

// State
const loading = ref(true)
const noticeList = ref<SysNotice[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  noticeTitle: '',
  createBy: '',
  noticeType: undefined,
  sortBy: '',
  sortOrder: '' as 'asc' | 'desc' | '',
})
const noticeFilterFields = [
  { label: '公告标题', key: 'noticeTitle', placeholder: '请输入公告标题' },
  { label: '操作人员', key: 'createBy', placeholder: '请输入操作人员' },
]
const noticeExpandedFields = [
  { label: '公告类型', key: 'noticeType', type: 'select' as const, options: [{ label: '通知', value: '1' }, { label: '公告', value: '2' }] },
]

// 选择相关
const selectedIds = ref<string[]>([])
const selectAll = ref(false)
const hasSelectedRows = computed(() => selectedIds.value.length > 0)

// 监听全选状态变化（独立的 watch，不与表单脏状态冲突）
watch(selectAll, (newVal) => {
  if (newVal) {
    selectedIds.value = noticeList.value.map((item) => item.noticeId)
  } else if (selectedIds.value.length === noticeList.value.length) {
    selectedIds.value = []
  }
})

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showBatchDeleteDialog = ref(false)
const showPreviewDialog = ref(false)
const noticeToDelete = ref<SysNotice | null>(null)
const previewNotice = ref<SysNotice | null>(null)
const isEdit = ref(false)
const submitLoading = ref(false)

const form = reactive<NoticeFormState>({
  noticeId: undefined as string | undefined,
  noticeTitle: '',
  noticeType: '1',
  noticeContent: '',
  status: '0',
})

// 监听表单变化，标记脏状态（仅在弹窗打开时）
// 使用 skipNextChange 跳过弹窗打开时的初始赋值
let skipNextChange = false
watch(
  () => ({ ...form }),
  () => {
    if (showDialog.value && !skipNextChange) {
      isDirty.value = true
    }
    skipNextChange = false
  },
  { deep: true },
)

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listNotice(queryParams)
    noticeList.value = res.rows
    total.value = res.total
    // 清除已不存在的选中项
    selectedIds.value = selectedIds.value.filter((id) =>
      res.rows.some((r: SysNotice) => r.noticeId === id),
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
  queryParams.noticeTitle = ''
  queryParams.createBy = ''
  queryParams.noticeType = undefined
  queryParams.sortBy = ''
  queryParams.sortOrder = ''
  handleQuery()
}

async function handleStatusChange(noticeId: string, status: string) {
  await changeNoticeStatus(noticeId, status)
  const notice = noticeList.value.find((item) => item.noticeId === noticeId)
  if (notice) notice.status = status as '0' | '1'
}

// 选择操作
function toggleSelect(noticeId: string) {
  const idx = selectedIds.value.indexOf(noticeId)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(noticeId)
  }
  selectAll.value =
    selectedIds.value.length > 0 && selectedIds.value.length === noticeList.value.length
}

// 批量删除
function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    toast({ title: '提示', description: '请选择要删除的公告', variant: 'destructive' })
    return
  }
  showBatchDeleteDialog.value = true
}

async function confirmBatchDelete() {
  try {
    await delNotice(selectedIds.value)
    toast({ title: '删除成功', description: `已删除 ${selectedIds.value.length} 条公告` })
    selectedIds.value = []
    selectAll.value = false
    getList()
  } finally {
    showBatchDeleteDialog.value = false
  }
}

// Add/Edit Operations
function handleAdd() {
  resetForm()
  isEdit.value = false
  skipNextChange = true
  showDialog.value = true
}

async function handleUpdate(row: SysNotice) {
  resetForm()
  isEdit.value = true
  const res = await getNotice(row.noticeId)
  skipNextChange = true
  Object.assign(form, res)
  showDialog.value = true
}

function handleDelete(row: SysNotice) {
  noticeToDelete.value = row
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!noticeToDelete.value) return
  try {
    await delNotice([noticeToDelete.value.noticeId])
    toast({ title: '删除成功', description: '公告已删除' })
    getList()
  } finally {
    showDeleteDialog.value = false
  }
}

// 预览公告
function handlePreview(row: SysNotice) {
  previewNotice.value = row
  showPreviewDialog.value = true
}

async function handleSubmit() {
  if (!form.noticeTitle || !form.noticeContent) {
    toast({ title: '验证失败', description: '标题和内容不能为空', variant: 'destructive' })
    return
  }

  submitLoading.value = true
  try {
    if (form.noticeId) {
      await updateNotice(form)
      toast({ title: '修改成功', description: '公告已更新' })
    } else {
      await addNotice(form)
      toast({ title: '新增成功', description: '公告已创建' })
    }
    markClean() // 保存成功后清除脏状态
    showDialog.value = false
    getList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 关闭弹窗时检查未保存更改
async function handleCloseDialog() {
  if (await tryLeave()) {
    showDialog.value = false
  }
}

function resetForm() {
  form.noticeId = undefined
  form.noticeTitle = ''
  form.noticeType = '1'
  form.noticeContent = ''
  form.status = '0'
  markClean() // 重置表单时清除脏状态
}

onMounted(() => {
  getList()
  // 获取上传配置
  getUploadConfig()
    .then((config) => {
      uploadConfig.value = config
    })
    .catch(() => {
      // 使用默认值
    })
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">通知公告</h2>
        <p class="text-muted-foreground">发布和管理系统通知公告</p>
      </div>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getList" />
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新增公告
        </Button>
      </div>
    </div>

    <SimpleTableFilters
      :query="queryParams"
      :fields="noticeFilterFields"
      :expanded-fields="noticeExpandedFields"
      description="默认展示公告标题和操作人员，展开后可按类型完整筛选。"
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
        <Button variant="destructive" size="sm" @click="handleBatchDelete"> 批量删除 </Button>
      </div>
    </Transition>

    <!-- Table -->
    <div class="border rounded-md bg-card overflow-x-auto">
      <!-- 骨架屏 -->
      <TableSkeleton v-if="loading" :columns="6" :rows="10" show-checkbox />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="noticeList.length === 0"
        title="暂无公告数据"
        description="点击新增公告按钮发布第一条公告"
        action-text="新增公告"
        @action="handleAdd"
      />

      <!-- 数据表格 -->
      <NoticeTable
        v-else
        v-model:select-all="selectAll"
        :rows="noticeList"
        :selected-ids="selectedIds"
        :sort-by="queryParams.sortBy"
        :sort-order="queryParams.sortOrder"
        @toggle-select="toggleSelect"
        @preview="handlePreview"
        @edit="handleUpdate"
        @remove="handleDelete"
        @change-status="handleStatusChange"
        @sort="handleSort"
      />
    </div>

    <!-- Pagination -->
    <TablePagination
      v-model:page-num="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      @change="getList"
    />

    <NoticeFormDialog
      v-model:open="showDialog"
      :form="form"
      :is-edit="isEdit"
      :submit-loading="submitLoading"
      :upload-config="uploadConfig"
      @close="handleCloseDialog"
      @submit="handleSubmit"
    />

    <!-- 未保存更改确认弹窗 -->
    <LeaveConfirmDialog
      v-model:open="showLeaveDialog"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showDeleteDialog"
      title="确认删除"
      :description="`您确定要删除公告 &quot;${noticeToDelete?.noticeTitle}&quot; 吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmDelete"
    />

    <!-- Batch Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showBatchDeleteDialog"
      title="确认批量删除"
      :description="`您确定要删除选中的 ${selectedIds.length} 条公告吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmBatchDelete"
    />

    <NoticePreviewDialog v-model:open="showPreviewDialog" :notice="previewNotice" />
  </div>
</template>

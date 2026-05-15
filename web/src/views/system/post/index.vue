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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast/use-toast'
import { Plus, Edit, Trash2, RefreshCw, Search, Loader2 } from 'lucide-vue-next'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import { formatDate } from '@/utils/format'
import {
  getStatusOptionsWithAll,
  getStatusOptions,
  toQueryValue,
  ALL_OPTION_VALUE,
} from '@/utils/options'
import {
  listPost,
  getPost,
  delPost,
  addPost,
  updatePost,
  changePostStatus,
} from '@/api/system/post'
import type { SysPost } from '@/api/system/types'

const { toast } = useToast()

// State
const loading = ref(true)
const postList = ref<SysPost[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  postCode: '',
  postName: '',
  status: ALL_OPTION_VALUE as string,
})

// 选择相关
const selectedIds = ref<string[]>([])
const selectAll = ref(false)
const hasSelectedRows = computed(() => selectedIds.value.length > 0)

// 监听全选状态变化
watch(selectAll, (newVal) => {
  if (newVal) {
    selectedIds.value = postList.value.map((item) => item.postId)
  } else {
    selectedIds.value = []
  }
})

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showBatchDeleteDialog = ref(false)
const postToDelete = ref<SysPost | null>(null)
const isEdit = ref(false)
const submitLoading = ref(false)

const form = reactive<Partial<SysPost>>({
  postId: undefined,
  postCode: '',
  postName: '',
  postSort: 0,
  status: '0',
  remark: '',
})

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listPost({
      ...queryParams,
      status: toQueryValue(queryParams.status),
    })
    postList.value = res.rows
    total.value = res.total
    // 清除已不存在的选中项
    selectedIds.value = selectedIds.value.filter((id) =>
      res.rows.some((r: SysPost) => r.postId === id),
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
  queryParams.postCode = ''
  queryParams.postName = ''
  queryParams.status = ALL_OPTION_VALUE
  handleQuery()
}

// 选择操作
function toggleSelect(postId: string) {
  const idx = selectedIds.value.indexOf(postId)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(postId)
  }
  selectAll.value =
    selectedIds.value.length > 0 && selectedIds.value.length === postList.value.length
}

// 批量删除
function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    toast({ title: '提示', description: '请选择要删除的岗位', variant: 'destructive' })
    return
  }
  showBatchDeleteDialog.value = true
}

async function confirmBatchDelete() {
  try {
    await delPost(selectedIds.value)
    toast({ title: '删除成功', description: `已删除 ${selectedIds.value.length} 个岗位` })
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
    toast({ title: '提示', description: '请选择要操作的岗位', variant: 'destructive' })
    return
  }
  batchStatusType.value = status
  showBatchStatusDialog.value = true
}

async function confirmBatchStatus() {
  const status = batchStatusType.value
  const text = status === '0' ? '启用' : '停用'
  try {
    for (const postId of selectedIds.value) {
      await changePostStatus(postId, status)
    }
    toast({ title: '操作成功', description: `已${text} ${selectedIds.value.length} 个岗位` })
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

async function handleUpdate(row: SysPost) {
  resetForm()
  isEdit.value = true
  const res = await getPost(row.postId)
  Object.assign(form, res)
  showDialog.value = true
}

function handleDelete(row: SysPost) {
  postToDelete.value = row
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!postToDelete.value) return
  try {
    await delPost([postToDelete.value.postId])
    toast({ title: '删除成功', description: '岗位已删除' })
    getList()
  } finally {
    showDeleteDialog.value = false
  }
}

async function handleSubmit() {
  if (!form.postName || !form.postCode) {
    toast({ title: '验证失败', description: '岗位名称和编码不能为空', variant: 'destructive' })
    return
  }

  submitLoading.value = true
  try {
    if (form.postId) {
      await updatePost(form)
      toast({ title: '修改成功', description: '岗位信息已更新' })
    } else {
      await addPost(form)
      toast({ title: '新增成功', description: '岗位已创建' })
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
  form.postId = undefined
  form.postCode = ''
  form.postName = ''
  form.postSort = 0
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
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">岗位管理</h2>
        <p class="text-muted-foreground">管理系统岗位信息</p>
      </div>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getList" />
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新增岗位
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">岗位编码</span>
        <Input
          v-model="queryParams.postCode"
          placeholder="请输入岗位编码"
          class="w-[200px]"
          @keyup.enter="handleQuery"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">岗位名称</span>
        <Input
          v-model="queryParams.postName"
          placeholder="请输入岗位名称"
          class="w-[200px]"
          @keyup.enter="handleQuery"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">状态</span>
        <Select v-model="queryParams.status" @update:model-value="handleQuery">
          <SelectTrigger class="w-[120px]">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in getStatusOptionsWithAll()"
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
        <Button variant="outline" size="sm" @click="handleBatchStatus('0')"> 批量启用 </Button>
        <Button variant="outline" size="sm" @click="handleBatchStatus('1')"> 批量停用 </Button>
        <Button variant="destructive" size="sm" @click="handleBatchDelete"> 批量删除 </Button>
      </div>
    </Transition>

    <!-- Table -->
    <div class="border rounded-md bg-card overflow-x-auto">
      <!-- 骨架屏 -->
      <TableSkeleton v-if="loading" :columns="6" :rows="10" show-checkbox />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="postList.length === 0"
        title="暂无岗位数据"
        description="点击新增岗位按钮添加第一个岗位"
        action-text="新增岗位"
        @action="handleAdd"
      />

      <!-- 数据表格 -->
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">
              <Checkbox v-model="selectAll" :disabled="postList.length === 0" />
            </TableHead>
            <TableHead>岗位编号</TableHead>
            <TableHead>岗位编码</TableHead>
            <TableHead>岗位名称</TableHead>
            <TableHead>排序</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in postList" :key="item.postId">
            <TableCell>
              <Checkbox
                :model-value="selectedIds.includes(item.postId)"
                @update:model-value="() => toggleSelect(item.postId)"
              />
            </TableCell>
            <TableCell>{{ item.postId }}</TableCell>
            <TableCell
              ><Badge variant="outline">{{ item.postCode }}</Badge></TableCell
            >
            <TableCell>{{ item.postName }}</TableCell>
            <TableCell>{{ item.postSort }}</TableCell>
            <TableCell>
              <StatusSwitch
                :status="item.status"
                :name="item.postName"
                :on-toggle="(s) => changePostStatus(item.postId, s)"
                @update:status="item.status = $event as '0' | '1'"
              />
            </TableCell>
            <TableCell>{{ formatDate(item.createTime) }}</TableCell>
            <TableCell class="text-right space-x-2">
              <Button variant="ghost" size="icon" @click="handleUpdate(item)">
                <Edit class="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="text-destructive"
                @click="handleDelete(item)"
              >
                <Trash2 class="w-4 h-4" />
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

    <!-- Add/Edit Dialog -->
    <Dialog v-model:open="showDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{ isEdit ? '修改岗位' : '新增岗位' }}</DialogTitle>
          <DialogDescription> 请填写岗位信息 </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="postName">岗位名称 *</Label>
              <Input id="postName" v-model="form.postName" placeholder="请输入岗位名称" />
            </div>
            <div class="grid gap-2">
              <Label for="postCode">岗位编码 *</Label>
              <Input id="postCode" v-model="form.postCode" placeholder="请输入岗位编码" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="postSort">显示顺序</Label>
              <Input id="postSort" v-model="form.postSort" type="number" />
            </div>
            <div class="grid gap-2">
              <Label for="status">岗位状态</Label>
              <Select v-model="form.status">
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in getStatusOptions()" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="remark">备注</Label>
            <Input id="remark" v-model="form.remark" placeholder="请输入备注" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDialog = false">取消</Button>
          <Button :disabled="submitLoading" @click="handleSubmit">
            <Loader2 v-if="submitLoading" class="mr-2 h-4 w-4 animate-spin" />
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showDeleteDialog"
      title="确认删除"
      :description="`您确定要删除岗位 &quot;${postToDelete?.postName}&quot; 吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmDelete"
    />

    <!-- Batch Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showBatchDeleteDialog"
      title="确认批量删除"
      :description="`您确定要删除选中的 ${selectedIds.length} 个岗位吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmBatchDelete"
    />

    <!-- Batch Status Dialog -->
    <ConfirmDialog
      v-model:open="showBatchStatusDialog"
      :title="`确认批量${batchStatusType === '0' ? '启用' : '停用'}`"
      :description="`您确定要${batchStatusType === '0' ? '启用' : '停用'}选中的 ${selectedIds.length} 个岗位吗？`"
      confirm-text="确定"
      @confirm="confirmBatchStatus"
    />
  </div>
</template>

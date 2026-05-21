<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Edit, Trash2, List } from 'lucide-vue-next'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import { SimpleTableFilters } from '@/components/common/table-filter'
import { formatDate } from '@/utils/format'
import { toggleTableSort } from '@/utils/table-sort'
import { getStatusOptionsWithAll, getStatusOptions, toQueryValue, ALL_OPTION_VALUE } from '@/utils/options'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import DictDataSheet from './DictDataSheet.vue'
import {
  listType,
  getType,
  delType,
  addType,
  updateType,
  changeDictTypeStatus,
  type DictType,
} from '@/api/system/dict'

const { toast } = useToast()

// ==================== 字典类型 ====================
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  dictName: '',
  dictType: '',
  status: ALL_OPTION_VALUE as string,
  sortBy: '',
  sortOrder: '' as 'asc' | 'desc' | '',
})
const dictFilterFields = [
  { label: '字典名称', key: 'dictName', placeholder: '请输入字典名称' },
  { label: '字典类型', key: 'dictType', placeholder: '请输入字典类型' },
]
const dictExpandedFields = [
  { label: '状态', key: 'status', type: 'select' as const, options: getStatusOptionsWithAll() },
]

const loading = ref(true)
const total = ref(0)
const typeList = ref<DictType[]>([])
const showTypeDialog = ref(false)
const showDeleteDialog = ref(false)
const dictToDelete = ref<DictType | null>(null)
const typeDialogTitle = ref('')
const typeForm = reactive<Partial<DictType>>({
  dictId: undefined,
  dictName: '',
  dictType: '',
  status: '0',
  remark: '',
})

async function getTypeList() {
  loading.value = true
  try {
    const response = await listType({
      ...queryParams,
      status: toQueryValue(queryParams.status),
    })
    typeList.value = response.rows
    total.value = response.total
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  getTypeList()
}

function handleSort(key: string) {
  toggleTableSort(queryParams, key)
  getTypeList()
}

function resetQuery() {
  queryParams.dictName = ''
  queryParams.dictType = ''
  queryParams.status = ALL_OPTION_VALUE
  queryParams.sortBy = ''
  queryParams.sortOrder = ''
  handleQuery()
}

function handleAddType() {
  resetTypeForm()
  typeDialogTitle.value = '添加字典类型'
  showTypeDialog.value = true
}

async function handleUpdateType(row: DictType) {
  try {
    resetTypeForm()
    const res = await getType(row.dictId)
    Object.assign(typeForm, res)
    typeDialogTitle.value = '修改字典类型'
    showTypeDialog.value = true
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

function handleDeleteType(row: DictType) {
  dictToDelete.value = row
  showDeleteDialog.value = true
}

async function confirmDeleteType() {
  if (!dictToDelete.value) return
  try {
    await delType([dictToDelete.value.dictId])
    toast({ title: '删除成功', description: '字典类型已删除' })
    getTypeList()
  } finally {
    showDeleteDialog.value = false
  }
}

async function submitTypeForm() {
  if (!typeForm.dictName || !typeForm.dictType) {
    toast({ title: '验证失败', description: '字典名称和类型不能为空', variant: 'destructive' })
    return
  }
  try {
    if (typeForm.dictId) {
      await updateType(typeForm)
      toast({ title: '修改成功', description: '字典类型已更新' })
    } else {
      await addType(typeForm)
      toast({ title: '添加成功', description: '字典类型已添加' })
    }
    showTypeDialog.value = false
    getTypeList()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

function resetTypeForm() {
  typeForm.dictId = undefined
  typeForm.dictName = ''
  typeForm.dictType = ''
  typeForm.status = '0'
  typeForm.remark = ''
}

// ==================== 字典数据 ====================
const dataSheetRef = ref<InstanceType<typeof DictDataSheet> | null>(null)

function openDataSheet(row: DictType) {
  dataSheetRef.value?.openFor(row)
}

onMounted(() => {
  getTypeList()
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">字典管理</h2>
        <p class="text-muted-foreground">管理系统字典类型和字典数据</p>
      </div>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getTypeList" />
        <Button @click="handleAddType">
          <Plus class="mr-2 h-4 w-4" />
          新增字典
        </Button>
      </div>
    </div>

    <SimpleTableFilters
      :query="queryParams"
      :fields="dictFilterFields"
      :expanded-fields="dictExpandedFields"
      description="默认展示字典名称和类型，展开后可按状态完整筛选。"
      @search="handleQuery"
      @reset="resetQuery"
    />

    <!-- Table -->
    <div class="border rounded-md bg-card overflow-x-auto">
      <TableSkeleton v-if="loading" :columns="7" :rows="10" />
      <EmptyState
        v-else-if="typeList.length === 0"
        title="暂无字典数据"
        description="点击新增字典按钮添加"
        action-text="新增字典"
        @action="handleAddType"
      />
      <Table v-else>
        <TableHeader>
          <TableRow>
            <SortableTableHead label="字典编号" sort-key="dictId" class="w-[80px]" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="字典名称" sort-key="dictName" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="字典类型" sort-key="dictType" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <SortableTableHead label="状态" sort-key="status" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <TableHead>备注</TableHead>
            <SortableTableHead label="创建时间" sort-key="createTime" :sort-by="queryParams.sortBy" :sort-order="queryParams.sortOrder" @sort="handleSort" />
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in typeList" :key="item.dictId">
            <TableCell>{{ item.dictId }}</TableCell>
            <TableCell>{{ item.dictName }}</TableCell>
            <TableCell>
              <Button variant="link" class="p-0 h-auto" @click="openDataSheet(item)">{{
                item.dictType
              }}</Button>
            </TableCell>
            <TableCell>
              <StatusSwitch
                :status="item.status"
                :name="item.dictName"
                :on-toggle="(s) => changeDictTypeStatus(item.dictId, s)"
                @update:status="item.status = $event as '0' | '1'"
              />
            </TableCell>
            <TableCell class="text-muted-foreground max-w-[200px] truncate">{{
              item.remark
            }}</TableCell>
            <TableCell>{{ formatDate(item.createTime) }}</TableCell>
            <TableCell class="text-right space-x-1">
              <Button variant="ghost" size="icon" title="字典数据" @click="openDataSheet(item)"
                ><List class="w-4 h-4"
              /></Button>
              <Button variant="ghost" size="icon" title="编辑" @click="handleUpdateType(item)"
                ><Edit class="w-4 h-4"
              /></Button>
              <Button
                variant="ghost"
                size="icon"
                class="text-destructive"
                title="删除"
                @click="handleDeleteType(item)"
                ><Trash2 class="w-4 h-4"
              /></Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <TablePagination
      v-model:page-num="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      @change="getTypeList"
    />

    <!-- 字典类型弹窗 -->
    <Dialog v-model:open="showTypeDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ typeDialogTitle }}</DialogTitle>
          <DialogDescription>请填写字典类型信息</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">字典名称</Label>
            <Input v-model="typeForm.dictName" class="col-span-3" placeholder="请输入字典名称" />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">字典类型</Label>
            <Input
              v-model="typeForm.dictType"
              class="col-span-3"
              placeholder="请输入字典类型"
              :disabled="!!typeForm.dictId"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">状态</Label>
            <Select v-model="typeForm.status">
              <SelectTrigger class="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in getStatusOptions()" :key="opt.value" :value="opt.value">{{
                  opt.label
                }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">备注</Label>
            <Input v-model="typeForm.remark" class="col-span-3" placeholder="请输入备注" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showTypeDialog = false">取消</Button>
          <Button @click="submitTypeForm">确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除字典类型确认 -->
    <ConfirmDialog
      v-model:open="showDeleteDialog"
      title="确认删除"
      :description="`确定要删除字典类型「${dictToDelete?.dictName}」吗？`"
      confirm-text="删除"
      destructive
      @confirm="confirmDeleteType"
    />

    <DictDataSheet ref="dataSheetRef" />
  </div>
</template>

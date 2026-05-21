<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Edit, Plus, Trash2 } from 'lucide-vue-next'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SemanticTag from '@/components/common/SemanticTag.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import { SimpleTableFilters } from '@/components/common/table-filter'
import { toggleTableSort } from '@/utils/table-sort'
import { getStatusOptions, getStatusOptionsWithAll, toQueryValue, ALL_OPTION_VALUE } from '@/utils/options'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/toast/use-toast'
import type { SemanticTone } from '@/utils/semantic-styles'
import {
  listData,
  getData,
  delData,
  addData,
  updateData,
  changeDictDataStatus,
  type DictType,
  type DictData,
  type DictDataForm,
} from '@/api/system/dict'

const open = defineModel<boolean>('open', { default: false })
const { toast } = useToast()

const currentDictType = ref<DictType | null>(null)
const dataLoading = ref(false)
const dataList = ref<DictData[]>([])
const dataTotal = ref(0)
const dataQueryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  dictType: '',
  dictLabel: '',
  status: ALL_OPTION_VALUE as string,
  sortBy: '',
  sortOrder: '' as 'asc' | 'desc' | '',
})
const dataFilterFields = [
  { label: '数据标签', key: 'dictLabel', placeholder: '请输入数据标签' },
  { label: '状态', key: 'status', type: 'select' as const, options: getStatusOptionsWithAll() },
]

const showDataDialog = ref(false)
const showDataDeleteDialog = ref(false)
const dataToDelete = ref<DictData | null>(null)
const dataDialogTitle = ref('')
const dataForm = reactive<DictDataForm>({
  dictCode: undefined,
  dictType: '',
  dictLabel: '',
  dictValue: '',
  dictSort: 0,
  cssClass: '',
  listClass: 'default',
  isDefault: 'N',
  status: '0',
  remark: '',
})

const listClassOptions = [
  { label: '默认', value: 'default' },
  { label: '主要', value: 'primary' },
  { label: '成功', value: 'success' },
  { label: '信息', value: 'info' },
  { label: '警告', value: 'warning' },
  { label: '危险', value: 'danger' },
]

function openFor(row: DictType) {
  currentDictType.value = row
  dataQueryParams.dictType = row.dictType
  dataQueryParams.dictLabel = ''
  dataQueryParams.status = ALL_OPTION_VALUE
  dataQueryParams.sortBy = ''
  dataQueryParams.sortOrder = ''
  dataQueryParams.pageNum = 1
  open.value = true
  getDataList()
}

async function getDataList() {
  dataLoading.value = true
  try {
    const response = await listData({
      ...dataQueryParams,
      status: toQueryValue(dataQueryParams.status),
    })
    dataList.value = response.rows
    dataTotal.value = response.total
  } finally {
    dataLoading.value = false
  }
}

function handleDataQuery() {
  dataQueryParams.pageNum = 1
  getDataList()
}

function handleDataSort(key: string) {
  toggleTableSort(dataQueryParams, key)
  getDataList()
}

function resetDataQuery() {
  dataQueryParams.dictLabel = ''
  dataQueryParams.status = ALL_OPTION_VALUE
  dataQueryParams.sortBy = ''
  dataQueryParams.sortOrder = ''
  handleDataQuery()
}

function handleAddData() {
  resetDataForm()
  dataForm.dictType = currentDictType.value?.dictType || ''
  dataDialogTitle.value = '添加字典数据'
  showDataDialog.value = true
}

async function handleUpdateData(row: DictData) {
  try {
    resetDataForm()
    const res = await getData(row.dictCode)
    Object.assign(dataForm, res)
    dataDialogTitle.value = '修改字典数据'
    showDataDialog.value = true
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

function handleDeleteData(row: DictData) {
  dataToDelete.value = row
  showDataDeleteDialog.value = true
}

async function confirmDeleteData() {
  if (!dataToDelete.value) return
  try {
    await delData([dataToDelete.value.dictCode])
    toast({ title: '删除成功', description: '字典数据已删除' })
    getDataList()
  } finally {
    showDataDeleteDialog.value = false
  }
}

async function submitDataForm() {
  if (!dataForm.dictLabel || !dataForm.dictValue) {
    toast({ title: '验证失败', description: '数据标签和数据键值不能为空', variant: 'destructive' })
    return
  }
  try {
    if (dataForm.dictCode) {
      await updateData(dataForm)
      toast({ title: '修改成功', description: '字典数据已更新' })
    } else {
      await addData(dataForm)
      toast({ title: '添加成功', description: '字典数据已添加' })
    }
    showDataDialog.value = false
    getDataList()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

function resetDataForm() {
  dataForm.dictCode = undefined
  dataForm.dictType = ''
  dataForm.dictLabel = ''
  dataForm.dictValue = ''
  dataForm.dictSort = 0
  dataForm.cssClass = ''
  dataForm.listClass = 'default'
  dataForm.isDefault = 'N'
  dataForm.status = '0'
  dataForm.remark = ''
}

function getListClassTone(listClass: string): SemanticTone {
  const map: Record<string, SemanticTone> = {
    primary: 'info',
    success: 'success',
    info: 'info',
    warning: 'warning',
    danger: 'danger',
    default: 'neutral',
  }
  return map[listClass] || 'neutral'
}

defineExpose({ openFor })
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent class="w-[600px] sm:max-w-[600px] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>字典数据 - {{ currentDictType?.dictName }}</SheetTitle>
        <SheetDescription>字典类型：{{ currentDictType?.dictType }}</SheetDescription>
      </SheetHeader>

      <div class="mt-6 space-y-4">
        <SimpleTableFilters
          :query="dataQueryParams"
          :fields="dataFilterFields"
          description="字典数据筛选项较少，默认直接展示数据标签和状态。"
          @search="handleDataQuery"
          @reset="resetDataQuery"
        >
          <template #actions>
            <Button size="sm" @click="handleAddData"><Plus class="w-4 h-4 mr-1" />新增</Button>
          </template>
        </SimpleTableFilters>

        <div class="border rounded-md">
          <TableSkeleton v-if="dataLoading" :columns="5" :rows="5" />
          <EmptyState v-else-if="dataList.length === 0" title="暂无数据" description="点击新增按钮添加字典数据" />
          <Table v-else>
            <TableHeader>
              <TableRow>
                <SortableTableHead label="数据标签" sort-key="dictLabel" :sort-by="dataQueryParams.sortBy" :sort-order="dataQueryParams.sortOrder" @sort="handleDataSort" />
                <SortableTableHead label="数据键值" sort-key="dictValue" :sort-by="dataQueryParams.sortBy" :sort-order="dataQueryParams.sortOrder" @sort="handleDataSort" />
                <SortableTableHead label="排序" sort-key="dictSort" :sort-by="dataQueryParams.sortBy" :sort-order="dataQueryParams.sortOrder" @sort="handleDataSort" />
                <SortableTableHead label="状态" sort-key="status" :sort-by="dataQueryParams.sortBy" :sort-order="dataQueryParams.sortOrder" @sort="handleDataSort" />
                <TableHead class="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in dataList" :key="item.dictCode">
                <TableCell><SemanticTag :tone="getListClassTone(item.listClass)">{{ item.dictLabel }}</SemanticTag></TableCell>
                <TableCell>{{ item.dictValue }}</TableCell>
                <TableCell>{{ item.dictSort }}</TableCell>
                <TableCell>
                  <StatusSwitch
                    :status="item.status"
                    :name="item.dictLabel"
                    :on-toggle="(status) => changeDictDataStatus(item.dictCode, status)"
                    @update:status="item.status = $event as '0' | '1'"
                  />
                </TableCell>
                <TableCell class="text-right space-x-1">
                  <Button variant="ghost" size="icon" @click="handleUpdateData(item)"><Edit class="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" class="text-destructive" @click="handleDeleteData(item)"><Trash2 class="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <TablePagination
          v-model:page-num="dataQueryParams.pageNum"
          v-model:page-size="dataQueryParams.pageSize"
          :total="dataTotal"
          :page-sizes="[10, 20, 50]"
          @change="getDataList"
        />
      </div>
    </SheetContent>
  </Sheet>

  <Dialog v-model:open="showDataDialog">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ dataDialogTitle }}</DialogTitle>
        <DialogDescription>字典类型：{{ dataForm.dictType }}</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2"><Label>数据标签 *</Label><Input v-model="dataForm.dictLabel" placeholder="请输入" /></div>
          <div class="grid gap-2"><Label>数据键值 *</Label><Input v-model="dataForm.dictValue" placeholder="请输入" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2"><Label>显示排序</Label><Input v-model.number="dataForm.dictSort" type="number" /></div>
          <div class="grid gap-2"><Label>回显样式</Label><Select v-model="dataForm.listClass"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="opt in listClassOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem></SelectContent></Select></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2"><Label>状态</Label><Select v-model="dataForm.status"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="opt in getStatusOptions()" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem></SelectContent></Select></div>
          <div class="grid gap-2"><Label>是否默认</Label><Select v-model="dataForm.isDefault"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Y">是</SelectItem><SelectItem value="N">否</SelectItem></SelectContent></Select></div>
        </div>
        <div class="grid gap-2"><Label>备注</Label><Input v-model="dataForm.remark" placeholder="请输入备注" /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showDataDialog = false">取消</Button>
        <Button @click="submitDataForm">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ConfirmDialog
    v-model:open="showDataDeleteDialog"
    title="确认删除"
    :description="`确定要删除字典数据「${dataToDelete?.dictLabel}」吗？`"
    confirm-text="删除"
    destructive
    @confirm="confirmDeleteData"
  />
</template>

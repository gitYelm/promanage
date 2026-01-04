<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus, Edit, Trash2, RefreshCw, List } from 'lucide-vue-next'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import { formatDate } from '@/utils/format'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  listType, getType, delType, addType, updateType,
  listData, getData, delData, addData, updateData,
  changeDictTypeStatus, changeDictDataStatus,
  type DictType, type DictData, type DictDataForm
} from '@/api/system/dict'

const { toast } = useToast()

// ==================== 字典类型 ====================
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  dictName: '',
  dictType: '',
  status: ALL_OPTION_VALUE as string
})

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
  remark: ''
})

async function getTypeList() {
  loading.value = true
  try {
    const response = await listType({
      ...queryParams,
      status: toQueryValue(queryParams.status)
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

function resetQuery() {
  queryParams.dictName = ''
  queryParams.dictType = ''
  queryParams.status = ALL_OPTION_VALUE
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
    toast({ title: "删除成功", description: "字典类型已删除" })
    getTypeList()
  } finally {
    showDeleteDialog.value = false
  }
}

async function submitTypeForm() {
  if (!typeForm.dictName || !typeForm.dictType) {
    toast({ title: "验证失败", description: "字典名称和类型不能为空", variant: "destructive" })
    return
  }
  try {
    if (typeForm.dictId) {
      await updateType(typeForm)
      toast({ title: "修改成功", description: "字典类型已更新" })
    } else {
      await addType(typeForm)
      toast({ title: "添加成功", description: "字典类型已添加" })
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
const showDataSheet = ref(false)
const currentDictType = ref<DictType | null>(null)
const dataLoading = ref(false)
const dataList = ref<DictData[]>([])
const dataTotal = ref(0)
const dataQueryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  dictType: '',
  dictLabel: '',
  status: ALL_OPTION_VALUE as string
})

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
  remark: ''
})

// 标签样式选项
const listClassOptions = [
  { label: '默认', value: 'default' },
  { label: '主要', value: 'primary' },
  { label: '成功', value: 'success' },
  { label: '信息', value: 'info' },
  { label: '警告', value: 'warning' },
  { label: '危险', value: 'danger' },
]

function openDataSheet(row: DictType) {
  currentDictType.value = row
  dataQueryParams.dictType = row.dictType
  dataQueryParams.dictLabel = ''
  dataQueryParams.status = ALL_OPTION_VALUE
  dataQueryParams.pageNum = 1
  showDataSheet.value = true
  getDataList()
}

async function getDataList() {
  dataLoading.value = true
  try {
    const response = await listData({
      ...dataQueryParams,
      status: toQueryValue(dataQueryParams.status)
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

function resetDataQuery() {
  dataQueryParams.dictLabel = ''
  dataQueryParams.status = ALL_OPTION_VALUE
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
    toast({ title: "删除成功", description: "字典数据已删除" })
    getDataList()
  } finally {
    showDataDeleteDialog.value = false
  }
}

async function submitDataForm() {
  if (!dataForm.dictLabel || !dataForm.dictValue) {
    toast({ title: "验证失败", description: "数据标签和数据键值不能为空", variant: "destructive" })
    return
  }
  try {
    if (dataForm.dictCode) {
      await updateData(dataForm)
      toast({ title: "修改成功", description: "字典数据已更新" })
    } else {
      await addData(dataForm)
      toast({ title: "添加成功", description: "字典数据已添加" })
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

// 获取标签样式对应的 Badge variant
function getListClassVariant(listClass: string) {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    primary: 'default',
    success: 'default',
    info: 'secondary',
    warning: 'secondary',
    danger: 'destructive',
    default: 'outline'
  }
  return map[listClass] || 'outline'
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
      <Button @click="handleAddType">
        <Plus class="mr-2 h-4 w-4" />
        新增字典
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">字典名称</span>
        <Input v-model="queryParams.dictName" placeholder="请输入" class="w-[150px]" @keyup.enter="handleQuery" />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">字典类型</span>
        <Input v-model="queryParams.dictType" placeholder="请输入" class="w-[150px]" @keyup.enter="handleQuery" />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">状态</span>
        <Select v-model="queryParams.status" @update:model-value="handleQuery">
          <SelectTrigger class="w-[120px]"><SelectValue placeholder="请选择" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in getStatusOptionsWithAll()" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex gap-2 ml-auto">
        <Button @click="handleQuery"><Search class="w-4 h-4 mr-2" />搜索</Button>
        <Button variant="outline" @click="resetQuery"><RefreshCw class="w-4 h-4 mr-2" />重置</Button>
      </div>
    </div>

    <!-- Table -->
    <div class="border rounded-md bg-card overflow-x-auto">
      <TableSkeleton v-if="loading" :columns="7" :rows="10" />
      <EmptyState v-else-if="typeList.length === 0" title="暂无字典数据" description="点击新增字典按钮添加" action-text="新增字典" @action="handleAddType" />
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[80px]">字典编号</TableHead>
            <TableHead>字典名称</TableHead>
            <TableHead>字典类型</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>备注</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in typeList" :key="item.dictId">
            <TableCell>{{ item.dictId }}</TableCell>
            <TableCell>{{ item.dictName }}</TableCell>
            <TableCell>
              <Button variant="link" class="p-0 h-auto" @click="openDataSheet(item)">{{ item.dictType }}</Button>
            </TableCell>
            <TableCell>
              <StatusSwitch
                :status="item.status"
                :name="item.dictName"
                :on-toggle="(s) => changeDictTypeStatus(item.dictId, s)"
                @update:status="item.status = $event as '0' | '1'"
              />
            </TableCell>
            <TableCell class="text-muted-foreground max-w-[200px] truncate">{{ item.remark }}</TableCell>
            <TableCell>{{ formatDate(item.createTime) }}</TableCell>
            <TableCell class="text-right space-x-1">
              <Button variant="ghost" size="icon" title="字典数据" @click="openDataSheet(item)"><List class="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" title="编辑" @click="handleUpdateType(item)"><Edit class="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" class="text-destructive" title="删除" @click="handleDeleteType(item)"><Trash2 class="w-4 h-4" /></Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <TablePagination v-model:page-num="queryParams.pageNum" v-model:page-size="queryParams.pageSize" :total="total" @change="getTypeList" />

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
            <Input v-model="typeForm.dictType" class="col-span-3" placeholder="请输入字典类型" :disabled="!!typeForm.dictId" />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label class="text-right">状态</Label>
            <Select v-model="typeForm.status">
              <SelectTrigger class="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in getStatusOptions()" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
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
    <ConfirmDialog v-model:open="showDeleteDialog" title="确认删除" :description="`确定要删除字典类型「${dictToDelete?.dictName}」吗？`" confirm-text="删除" destructive @confirm="confirmDeleteType" />

    <!-- 字典数据侧边栏 -->
    <Sheet v-model:open="showDataSheet">
      <SheetContent class="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>字典数据 - {{ currentDictType?.dictName }}</SheetTitle>
          <SheetDescription>字典类型：{{ currentDictType?.dictType }}</SheetDescription>
        </SheetHeader>

        <div class="mt-6 space-y-4">
          <!-- 搜索和新增 -->
          <div class="flex flex-wrap gap-2 items-center">
            <Input v-model="dataQueryParams.dictLabel" placeholder="数据标签" class="w-[120px]" @keyup.enter="handleDataQuery" />
            <Select v-model="dataQueryParams.status" @update:model-value="handleDataQuery">
              <SelectTrigger class="w-[100px]"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in getStatusOptionsWithAll()" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" @click="handleDataQuery"><Search class="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" @click="resetDataQuery"><RefreshCw class="w-4 h-4" /></Button>
            <Button size="sm" class="ml-auto" @click="handleAddData"><Plus class="w-4 h-4 mr-1" />新增</Button>
          </div>

          <!-- 数据列表 -->
          <div class="border rounded-md">
            <TableSkeleton v-if="dataLoading" :columns="5" :rows="5" />
            <EmptyState v-else-if="dataList.length === 0" title="暂无数据" description="点击新增按钮添加字典数据" />
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>数据标签</TableHead>
                  <TableHead>数据键值</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead class="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in dataList" :key="item.dictCode">
                  <TableCell>
                    <Badge :variant="getListClassVariant(item.listClass)">{{ item.dictLabel }}</Badge>
                  </TableCell>
                  <TableCell>{{ item.dictValue }}</TableCell>
                  <TableCell>{{ item.dictSort }}</TableCell>
                  <TableCell>
                    <StatusSwitch
                      :status="item.status"
                      :name="item.dictLabel"
                      :on-toggle="(s) => changeDictDataStatus(item.dictCode, s)"
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

          <!-- 分页 -->
          <TablePagination v-model:page-num="dataQueryParams.pageNum" v-model:page-size="dataQueryParams.pageSize" :total="dataTotal" :page-sizes="[10, 20, 50]" @change="getDataList" />
        </div>
      </SheetContent>
    </Sheet>

    <!-- 字典数据弹窗 -->
    <Dialog v-model:open="showDataDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ dataDialogTitle }}</DialogTitle>
          <DialogDescription>字典类型：{{ dataForm.dictType }}</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>数据标签 *</Label>
              <Input v-model="dataForm.dictLabel" placeholder="请输入" />
            </div>
            <div class="grid gap-2">
              <Label>数据键值 *</Label>
              <Input v-model="dataForm.dictValue" placeholder="请输入" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>显示排序</Label>
              <Input v-model.number="dataForm.dictSort" type="number" />
            </div>
            <div class="grid gap-2">
              <Label>回显样式</Label>
              <Select v-model="dataForm.listClass">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in listClassOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label>状态</Label>
              <Select v-model="dataForm.status">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in getStatusOptions()" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2">
              <Label>是否默认</Label>
              <Select v-model="dataForm.isDefault">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Y">是</SelectItem>
                  <SelectItem value="N">否</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid gap-2">
            <Label>备注</Label>
            <Input v-model="dataForm.remark" placeholder="请输入备注" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDataDialog = false">取消</Button>
          <Button @click="submitDataForm">确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除字典数据确认 -->
    <ConfirmDialog v-model:open="showDataDeleteDialog" title="确认删除" :description="`确定要删除字典数据「${dataToDelete?.dictLabel}」吗？`" confirm-text="删除" destructive @confirm="confirmDeleteData" />
  </div>
</template>

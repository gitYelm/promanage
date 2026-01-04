<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast/use-toast'
import { Plus, Edit, Trash2, RefreshCw, Search, RotateCw } from 'lucide-vue-next'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LeaveConfirmDialog from '@/components/common/LeaveConfirmDialog.vue'
import { formatDate } from '@/utils/format'
import { listConfig, getConfig, delConfig, addConfig, updateConfig, refreshCache, type SysConfig } from '@/api/system/config'
import { useUnsavedChanges } from '@/composables'

const { toast } = useToast()

// 未保存更改提示（同时支持路由离开和弹窗关闭）
const {
  isDirty,
  markClean,
  showLeaveDialog,
  confirmLeave,
  cancelLeave,
  tryLeave
} = useUnsavedChanges()

// State
const loading = ref(true)
const configList = ref<SysConfig[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  configName: '',
  configKey: '',
  configType: undefined
})

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const configToDelete = ref<SysConfig | null>(null)
const isEdit = ref(false)
const submitLoading = ref(false)

const form = reactive<Partial<SysConfig>>({
  configId: undefined,
  configName: '',
  configKey: '',
  configValue: '',
  configType: 'Y',
  remark: ''
})

// 监听表单变化，标记脏状态（仅在弹窗打开时）
// 使用 skipFirstChange 跳过弹窗打开时的初始赋值
let skipNextChange = false
watch(
  () => ({ ...form }),
  () => {
    if (showDialog.value && !skipNextChange) {
      isDirty.value = true
    }
    skipNextChange = false
  },
  { deep: true }
)

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listConfig(queryParams)
    configList.value = res.rows
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
  queryParams.configName = ''
  queryParams.configKey = ''
  queryParams.configType = undefined
  handleQuery()
}

// Add/Edit Operations
function handleAdd() {
  resetForm()
  isEdit.value = false
  skipNextChange = true
  showDialog.value = true
}

async function handleUpdate(row: SysConfig) {
  resetForm()
  isEdit.value = true
  const res = await getConfig(row.configId)
  skipNextChange = true
  Object.assign(form, res)
  showDialog.value = true
}

function handleDelete(row: SysConfig) {
  configToDelete.value = row
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!configToDelete.value) return
  try {
    await delConfig([configToDelete.value.configId])
    toast({ title: "删除成功", description: "参数已删除" })
    getList()
  } finally {
    showDeleteDialog.value = false
  }
}

async function handleRefreshCache() {
  await refreshCache()
  toast({ title: "操作成功", description: "缓存刷新成功" })
}

async function handleSubmit() {
  if (!form.configName || !form.configKey || !form.configValue) {
    toast({ title: "验证失败", description: "参数名称、键名和键值不能为空", variant: "destructive" })
    return
  }

  submitLoading.value = true
  try {
    if (form.configId) {
      await updateConfig(form)
      toast({ title: "修改成功", description: "参数信息已更新" })
    } else {
      await addConfig(form)
      toast({ title: "新增成功", description: "参数已创建" })
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
  form.configId = undefined
  form.configName = ''
  form.configKey = ''
  form.configValue = ''
  form.configType = 'Y'
  form.remark = ''
  markClean() // 重置表单时清除脏状态
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
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">参数设置</h2>
        <p class="text-muted-foreground">
          管理系统全局配置参数
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="handleRefreshCache">
          <RotateCw class="mr-2 h-4 w-4" />
          刷新缓存
        </Button>
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新增参数
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">参数名称</span>
        <Input 
          v-model="queryParams.configName" 
          placeholder="请输入参数名称" 
          class="w-[150px]"
          @keyup.enter="handleQuery"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">参数键名</span>
        <Input 
          v-model="queryParams.configKey" 
          placeholder="请输入参数键名" 
          class="w-[150px]"
          @keyup.enter="handleQuery"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">系统内置</span>
        <Select v-model="queryParams.configType" @update:model-value="handleQuery">
          <SelectTrigger class="w-[120px]">
            <SelectValue placeholder="请选择" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Y">是</SelectItem>
            <SelectItem value="N">否</SelectItem>
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
        v-else-if="configList.length === 0"
        title="暂无参数数据"
        description="点击新增参数按钮添加第一个系统参数"
        action-text="新增参数"
        @action="handleAdd"
      />
      
      <!-- 数据表格 -->
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>参数主键</TableHead>
            <TableHead>参数名称</TableHead>
            <TableHead>参数键名</TableHead>
            <TableHead>参数键值</TableHead>
            <TableHead>系统内置</TableHead>
            <TableHead>备注</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in configList" :key="item.configId">
            <TableCell>{{ item.configId }}</TableCell>
            <TableCell>{{ item.configName }}</TableCell>
            <TableCell>{{ item.configKey }}</TableCell>
            <TableCell class="max-w-[200px] truncate" :title="item.configValue">{{ item.configValue }}</TableCell>
            <TableCell>
               <Badge :variant="item.configType === 'Y' ? 'default' : 'secondary'">
                {{ item.configType === 'Y' ? '是' : '否' }}
              </Badge>
            </TableCell>
            <TableCell class="max-w-[200px] truncate">{{ item.remark }}</TableCell>
            <TableCell>{{ formatDate(item.createTime) }}</TableCell>
            <TableCell class="text-right space-x-2">
              <Button variant="ghost" size="icon" @click="handleUpdate(item)">
                <Edit class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" class="text-destructive" @click="handleDelete(item)">
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
    <Dialog :open="showDialog" @update:open="(val) => !val && handleCloseDialog()">
      <DialogContent class="sm:max-w-[600px]" @escape-key-down.prevent="handleCloseDialog" @pointer-down-outside.prevent="handleCloseDialog">
        <DialogHeader>
          <DialogTitle>{{ isEdit ? '修改参数' : '新增参数' }}</DialogTitle>
          <DialogDescription>
            请填写参数信息
          </DialogDescription>
        </DialogHeader>
        
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="configName">参数名称 *</Label>
            <Input id="configName" v-model="form.configName" placeholder="请输入参数名称" />
          </div>
          <div class="grid gap-2">
            <Label for="configKey">参数键名 *</Label>
            <Input id="configKey" v-model="form.configKey" placeholder="请输入参数键名" />
          </div>
          <div class="grid gap-2">
            <Label for="configValue">参数键值 *</Label>
            <Textarea id="configValue" v-model="form.configValue" placeholder="请输入参数键值" />
          </div>
          <div class="grid gap-2">
             <Label for="configType">系统内置</Label>
             <Select v-model="form.configType">
                <SelectTrigger>
                  <SelectValue placeholder="选择是否内置" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Y">是</SelectItem>
                  <SelectItem value="N">否</SelectItem>
                </SelectContent>
              </Select>
          </div>
          <div class="grid gap-2">
            <Label for="remark">备注</Label>
            <Input id="remark" v-model="form.remark" placeholder="请输入备注" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="handleCloseDialog">取消</Button>
          <Button @click="handleSubmit" :disabled="submitLoading">
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
      :description="`您确定要删除参数 &quot;${configToDelete?.configName}&quot; 吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmDelete"
    />
  </div>
</template>

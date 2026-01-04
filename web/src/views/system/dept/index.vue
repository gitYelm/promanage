<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
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
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Search,
  Loader2,
  Maximize2,
  Minimize2,
} from 'lucide-vue-next'
import { formatDate } from '@/utils/format'
import {
  getStatusOptionsWithAll,
  getStatusOptions,
  toQueryValue,
  ALL_OPTION_VALUE,
} from '@/utils/options'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import {
  listDept,
  getDept,
  delDept,
  addDept,
  updateDept,
  listDeptTree,
  changeDeptStatus,
} from '@/api/system/dept'
import type { SysDept } from '@/api/system/types'

const { toast } = useToast()

// State
const loading = ref(true)
const deptList = ref<SysDept[]>([])
const queryParams = reactive({
  deptName: '',
  status: ALL_OPTION_VALUE as string,
})
const isExpanded = ref<Record<string, boolean>>({})
const expandedAll = ref(true) // 默认展开全部

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const deptToDelete = ref<SysDept | null>(null)
const isEdit = ref(false)
const submitLoading = ref(false)
const deptOptions = ref<any[]>([])

const form = reactive<Partial<SysDept>>({
  deptId: undefined,
  parentId: undefined,
  deptName: '',
  orderNum: 0,
  leader: '',
  phone: '',
  email: '',
  status: '0',
})

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listDept({
      ...queryParams,
      status: toQueryValue(queryParams.status),
    })
    deptList.value = toTreeDept(res)
    // Default expand all for demo
    expandAll(deptList.value)
  } finally {
    loading.value = false
  }
}

function expandAll(depts: SysDept[]) {
  depts.forEach((dept) => {
    isExpanded.value[dept.deptId] = true
    if (dept.children) {
      expandAll(dept.children)
    }
  })
}

function collapseAll(depts: SysDept[]) {
  depts.forEach((dept) => {
    isExpanded.value[dept.deptId] = false
    if (dept.children) {
      collapseAll(dept.children)
    }
  })
}

// 切换全部展开/收起
function toggleExpandAll() {
  if (expandedAll.value) {
    collapseAll(deptList.value)
  } else {
    expandAll(deptList.value)
  }
  expandedAll.value = !expandedAll.value
}

async function getDeptTree() {
  const res = await listDeptTree()
  deptOptions.value = toTreeDept(res)
}

// 部门ID到部门对象的映射，用于快速查找和更新
const deptMap = computed(() => {
  const map = new Map<string, SysDept>()
  const traverse = (nodes: SysDept[]) => {
    nodes.forEach((node) => {
      map.set(node.deptId, node)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(deptList.value)
  return map
})

// Helper to flatten tree for table display with expansion control
const flattenDepts = computed(() => {
  const result: (SysDept & { level: number; hasChildren: boolean })[] = []
  const traverse = (nodes: SysDept[], level = 0) => {
    nodes.forEach((node) => {
      const hasChildren = !!(node.children && node.children.length > 0)
      result.push({ ...node, level, hasChildren })
      if (hasChildren && isExpanded.value[node.deptId]) {
        traverse(node.children!, level + 1)
      }
    })
  }
  traverse(deptList.value)
  return result
})

// 更新部门状态
function updateDeptStatus(deptId: string, status: string) {
  const dept = deptMap.value.get(deptId)
  if (dept) {
    dept.status = status as '0' | '1'
  }
}

// Helper for Select options (flattened with indentation)
// 将部门树扁平化为下拉选项，确保拥有有效的 id 与 label 字段
const flattenedOptions = computed(() => {
  const result: Array<{ id: string; label: string }> = []
  const traverse = (
    nodes: Array<{ deptId: string; deptName: string; children?: any[] }>,
    prefix = ''
  ) => {
    for (const node of nodes || []) {
      result.push({ id: node.deptId, label: prefix + node.deptName })
      if (node.children && node.children.length) {
        traverse(node.children as any[], prefix + '-- ')
      }
    }
  }
  traverse(deptOptions.value as any[])
  return result
})

// Actions
function toggleExpand(deptId: string) {
  isExpanded.value[deptId] = !isExpanded.value[deptId]
}

function handleQuery() {
  getList()
}

function resetQuery() {
  queryParams.deptName = ''
  queryParams.status = ALL_OPTION_VALUE
  handleQuery()
}

async function handleAdd(parentId?: string) {
  resetForm()
  isEdit.value = false
  form.parentId = parentId
  await getDeptTree()
  showDialog.value = true
}

async function handleUpdate(row: SysDept) {
  resetForm()
  isEdit.value = true
  await getDeptTree()
  const res = await getDept(row.deptId)
  Object.assign(form, res)
  showDialog.value = true
}

async function handleDelete(row: SysDept) {
  deptToDelete.value = row
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deptToDelete.value) return
  try {
    await delDept(deptToDelete.value.deptId)
    toast({ title: '删除成功', description: '部门已删除' })
    getList()
    showDeleteDialog.value = false
  } catch (error) {
    console.error('删除失败:', error)
  }
}

async function handleSubmit() {
  if (!form.deptName) {
    toast({ title: '验证失败', description: '部门名称不能为空', variant: 'destructive' })
    return
  }

  submitLoading.value = true
  try {
    if (form.deptId) {
      await updateDept(form)
      toast({ title: '修改成功', description: '部门信息已更新' })
    } else {
      await addDept(form)
      toast({ title: '新增成功', description: '部门已创建' })
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
  form.deptId = undefined
  form.parentId = undefined
  form.deptName = ''
  form.orderNum = 0
  form.leader = ''
  form.phone = ''
  form.email = ''
  form.status = '0'
}

// 将扁平部门列表转换为树形结构
function toTreeDept(list: SysDept[]): SysDept[] {
  const map = new Map<string, SysDept & { children: SysDept[] }>()
  const roots: (SysDept & { children: SysDept[] })[] = []

  list.forEach((item) => {
    const node = { ...item, children: item.children ?? [] }
    map.set(item.deptId, node)
  })

  map.forEach((node) => {
    const pid = node.parentId ?? '0'
    if (pid === '0' || !map.has(pid)) {
      roots.push(node)
    } else {
      const parent = map.get(pid)!
      parent.children = parent.children ?? []
      parent.children.push(node)
    }
  })

  return roots
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
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">部门管理</h2>
        <p class="text-muted-foreground">管理系统部门组织架构</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="toggleExpandAll">
          <Maximize2 v-if="!expandedAll" class="mr-2 h-4 w-4" />
          <Minimize2 v-else class="mr-2 h-4 w-4" />
          {{ expandedAll ? '收起全部' : '展开全部' }}
        </Button>
        <Button @click="handleAdd()">
          <Plus class="mr-2 h-4 w-4" />
          新增部门
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">部门名称</span>
        <Input
          v-model="queryParams.deptName"
          placeholder="请输入部门名称"
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

    <!-- Table -->
    <div class="border rounded-md bg-card overflow-x-auto">
      <!-- 骨架屏 -->
      <TableSkeleton v-if="loading" :columns="4" :rows="10" />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="flattenDepts.length === 0"
        title="暂无部门数据"
        description="点击新增部门按钮添加第一个部门"
        action-text="新增部门"
        @action="handleAdd()"
      />

      <!-- 数据表格 -->
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>部门名称</TableHead>
            <TableHead>排序</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in flattenDepts" :key="item.deptId">
            <TableCell>
              <div class="flex items-center" :style="{ paddingLeft: `${item.level * 24}px` }">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-6 w-6 mr-1 p-0 hover:bg-transparent"
                  :class="{ invisible: !item.hasChildren }"
                  @click="toggleExpand(item.deptId)"
                >
                  <ChevronDown v-if="isExpanded[item.deptId]" class="h-4 w-4" />
                  <ChevronRight v-else class="h-4 w-4" />
                </Button>
                {{ item.deptName }}
              </div>
            </TableCell>
            <TableCell>{{ item.orderNum }}</TableCell>
            <TableCell>
              <StatusSwitch
                :status="item.status"
                :name="item.deptName"
                :on-toggle="(s) => changeDeptStatus(item.deptId, s)"
                @update:status="updateDeptStatus(item.deptId, $event)"
              />
            </TableCell>
            <TableCell>{{ formatDate(item.createTime) }}</TableCell>
            <TableCell class="text-right space-x-2">
              <Button variant="ghost" size="icon" @click="handleUpdate(item)">
                <Edit class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="handleAdd(item.deptId)">
                <Plus class="w-4 h-4" />
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

    <!-- Add/Edit Dialog -->
    <Dialog v-model:open="showDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{{ isEdit ? '修改部门' : '新增部门' }}</DialogTitle>
          <DialogDescription> 请填写部门信息 </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="parentId">上级部门</Label>
            <Select v-model="form.parentId">
              <SelectTrigger>
                <SelectValue placeholder="选择上级部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">无上级</SelectItem>
                <SelectItem v-for="dept in flattenedOptions" :key="dept.id" :value="dept.id">
                  {{ dept.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="deptName">部门名称 *</Label>
              <Input id="deptName" v-model="form.deptName" placeholder="请输入部门名称" />
            </div>
            <div class="grid gap-2">
              <Label for="orderNum">显示排序</Label>
              <Input id="orderNum" v-model="form.orderNum" type="number" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="leader">负责人</Label>
              <Input id="leader" v-model="form.leader" placeholder="请输入负责人" />
            </div>
            <div class="grid gap-2">
              <Label for="phone">联系电话</Label>
              <Input id="phone" v-model="form.phone" placeholder="请输入联系电话" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="email">邮箱</Label>
              <Input id="email" v-model="form.email" placeholder="请输入邮箱" />
            </div>
            <div class="grid gap-2">
              <Label for="status">部门状态</Label>
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
      :description="`您确定要删除部门 &quot;${deptToDelete?.deptName}&quot; 吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmDelete"
    />
  </div>
</template>

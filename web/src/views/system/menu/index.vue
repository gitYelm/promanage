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
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import IconPicker from '@/components/common/IconPicker.vue'
import * as icons from 'lucide-vue-next'

// 获取图标组件 (将 kebab-case 转换为 PascalCase)
function getIconComponent(name: string) {
  if (!name) return null
  const pascalName = name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  return (icons as any)[pascalName]
}
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import { listMenu, delMenu, addMenu, updateMenu, changeMenuStatus } from '@/api/system/menu'
import type { SysMenu } from '@/api/system/types'
import {
  getStatusOptionsWithAll,
  getStatusOptions,
  toQueryValue,
  ALL_OPTION_VALUE,
} from '@/utils/options'

const { toast } = useToast()

// State
const loading = ref(true)
const menuList = ref<SysMenu[]>([])
const queryParams = reactive({
  menuName: '',
  status: ALL_OPTION_VALUE as string,
})
const isExpanded = ref<Record<string, boolean>>({})
const expandedAll = ref(true) // 默认展开第一级

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const menuToDelete = ref<SysMenu | null>(null)
const isEdit = ref(false)
const submitLoading = ref(false)
const menuOptions = ref<any[]>([])

const form = reactive<Partial<SysMenu>>({
  menuId: undefined,
  parentId: undefined,
  menuName: '',
  orderNum: 0,
  path: '',
  component: '',
  isFrame: 1,
  isCache: 0,
  menuType: 'M',
  visible: '0',
  status: '0',
  perms: '',
  icon: '',
})

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listMenu({
      ...queryParams,
      status: toQueryValue(queryParams.status),
    })
    menuList.value = toTreeMenu(res)
    // Default expand first level
    if (expandedAll.value) {
      menuList.value.forEach((m) => (isExpanded.value[m.menuId] = true))
    }
  } finally {
    loading.value = false
  }
}

function expandAllMenus(menus: SysMenu[]) {
  menus.forEach((menu) => {
    isExpanded.value[menu.menuId] = true
    if (menu.children) {
      expandAllMenus(menu.children)
    }
  })
}

function collapseAllMenus(menus: SysMenu[]) {
  menus.forEach((menu) => {
    isExpanded.value[menu.menuId] = false
    if (menu.children) {
      collapseAllMenus(menu.children)
    }
  })
}

// 切换全部展开/收起
function toggleExpandAll() {
  if (expandedAll.value) {
    collapseAllMenus(menuList.value)
  } else {
    expandAllMenus(menuList.value)
  }
  expandedAll.value = !expandedAll.value
}

async function getMenuTree() {
  const res = await listMenu({})
  menuOptions.value = toTreeMenu(res)
}

// 菜单ID到菜单对象的映射，用于快速查找和更新
const menuMap = computed(() => {
  const map = new Map<string, SysMenu>()
  const traverse = (nodes: SysMenu[]) => {
    nodes.forEach((node) => {
      map.set(node.menuId, node)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(menuList.value)
  return map
})

// Helper to flatten tree for table display with expansion control
const flattenMenus = computed(() => {
  const result: (SysMenu & { level: number; hasChildren: boolean })[] = []
  const traverse = (nodes: SysMenu[], level = 0) => {
    nodes.forEach((node) => {
      const hasChildren = !!(node.children && node.children.length > 0)
      result.push({ ...node, level, hasChildren })
      if (hasChildren && isExpanded.value[node.menuId]) {
        traverse(node.children!, level + 1)
      }
    })
  }
  traverse(menuList.value)
  return result
})

// 更新菜单状态
function updateMenuStatus(menuId: string, status: string) {
  const menu = menuMap.value.get(menuId)
  if (menu) {
    menu.status = status as '0' | '1'
  }
}

// Helper for Select options (flattened with indentation)
const flattenedOptions = computed(() => {
  const result: Array<{ id: string; label: string }> = []
  const traverse = (
    nodes: Array<{ menuId: string; menuName: string; children?: any[] }>,
    prefix = ''
  ) => {
    for (const node of nodes || []) {
      result.push({ id: node.menuId, label: prefix + node.menuName })
      if (node.children && node.children.length) {
        traverse(node.children as any[], prefix + '-- ')
      }
    }
  }
  traverse(menuOptions.value as any[])
  return result
})

// Actions
function toggleExpand(menuId: string) {
  isExpanded.value[menuId] = !isExpanded.value[menuId]
}

function handleQuery() {
  getList()
}

function resetQuery() {
  queryParams.menuName = ''
  queryParams.status = ALL_OPTION_VALUE
  handleQuery()
}

async function handleAdd(parentId?: string) {
  resetForm()
  isEdit.value = false
  form.parentId = parentId
  await getMenuTree()
  showDialog.value = true
}

async function handleUpdate(row: SysMenu) {
  resetForm()
  isEdit.value = true
  await getMenuTree()
  // Mock fetch detail, in real app call API
  Object.assign(form, row)
  showDialog.value = true
}

async function handleDelete(row: SysMenu) {
  menuToDelete.value = row
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!menuToDelete.value) return
  try {
    await delMenu(menuToDelete.value.menuId)
    toast({ title: '删除成功', description: '菜单已删除' })
    getList()
    showDeleteDialog.value = false
  } catch (error) {
    console.error('删除失败:', error)
  }
}

async function handleSubmit() {
  if (!form.menuName) {
    toast({ title: '验证失败', description: '菜单名称不能为空', variant: 'destructive' })
    return
  }

  submitLoading.value = true
  try {
    if (form.menuId) {
      await updateMenu(form)
      toast({ title: '修改成功', description: '菜单信息已更新' })
    } else {
      await addMenu(form)
      toast({ title: '新增成功', description: '菜单已创建' })
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
  form.menuId = undefined
  form.parentId = undefined
  form.menuName = ''
  form.orderNum = 0
  form.path = ''
  form.component = ''
  form.isFrame = 1
  form.isCache = 0
  form.menuType = 'M'
  form.visible = '0'
  form.status = '0'
  form.perms = ''
  form.icon = ''
}

// 将扁平菜单列表转换为树形结构
function toTreeMenu(list: SysMenu[]): SysMenu[] {
  const map = new Map<string, SysMenu & { children: SysMenu[] }>()
  const roots: (SysMenu & { children: SysMenu[] })[] = []

  list.forEach((item) => {
    const node = { ...item, children: item.children ?? [] }
    map.set(item.menuId, node)
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
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">菜单管理</h2>
        <p class="text-muted-foreground">管理系统菜单、路由及按钮权限</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="toggleExpandAll">
          <Maximize2 v-if="!expandedAll" class="mr-2 h-4 w-4" />
          <Minimize2 v-else class="mr-2 h-4 w-4" />
          {{ expandedAll ? '收起全部' : '展开全部' }}
        </Button>
        <Button @click="handleAdd()">
          <Plus class="mr-2 h-4 w-4" />
          新增菜单
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">菜单名称</span>
        <Input
          v-model="queryParams.menuName"
          placeholder="请输入菜单名称"
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
      <TableSkeleton v-if="loading" :columns="6" :rows="10" />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="flattenMenus.length === 0"
        title="暂无菜单数据"
        description="点击新增菜单按钮添加第一个菜单"
        action-text="新增菜单"
        @action="handleAdd()"
      />

      <!-- 数据表格 -->
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>菜单名称</TableHead>
            <TableHead>图标</TableHead>
            <TableHead>排序</TableHead>
            <TableHead>权限标识</TableHead>
            <TableHead>组件路径</TableHead>
            <TableHead>状态</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in flattenMenus" :key="item.menuId">
            <TableCell>
              <div class="flex items-center" :style="{ paddingLeft: `${item.level * 24}px` }">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-6 w-6 mr-1 p-0 hover:bg-transparent"
                  :class="{ invisible: !item.hasChildren }"
                  @click="toggleExpand(item.menuId)"
                >
                  <ChevronDown v-if="isExpanded[item.menuId]" class="h-4 w-4" />
                  <ChevronRight v-else class="h-4 w-4" />
                </Button>
                <span class="mr-2 font-medium">{{ item.menuName }}</span>
                <Badge
                  :variant="
                    item.menuType === 'M'
                      ? 'default'
                      : item.menuType === 'C'
                        ? 'secondary'
                        : 'outline'
                  "
                >
                  {{ item.menuType === 'M' ? '目录' : item.menuType === 'C' ? '菜单' : '按钮' }}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <component
                  :is="getIconComponent(item.icon)"
                  v-if="item.icon && getIconComponent(item.icon)"
                  class="h-4 w-4 text-muted-foreground"
                />
                <span class="text-xs text-muted-foreground">{{ item.icon }}</span>
              </div>
            </TableCell>
            <TableCell>{{ item.orderNum }}</TableCell>
            <TableCell
              ><Badge v-if="item.perms" variant="outline">{{ item.perms }}</Badge></TableCell
            >
            <TableCell class="max-w-[200px] truncate">{{ item.component }}</TableCell>
            <TableCell>
              <StatusSwitch
                :status="item.status"
                :name="item.menuName"
                :on-toggle="(s) => changeMenuStatus(item.menuId, s)"
                @update:status="updateMenuStatus(item.menuId, $event)"
              />
            </TableCell>
            <TableCell class="text-right space-x-2">
              <Button variant="ghost" size="icon" @click="handleUpdate(item)">
                <Edit class="w-4 h-4" />
              </Button>
              <Button
                v-if="item.menuType !== 'F'"
                variant="ghost"
                size="icon"
                @click="handleAdd(item.menuId)"
              >
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
          <DialogTitle>{{ isEdit ? '修改菜单' : '新增菜单' }}</DialogTitle>
          <DialogDescription> 请填写菜单信息 </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="parentId">上级菜单</Label>
            <Select v-model="form.parentId">
              <SelectTrigger>
                <SelectValue placeholder="选择上级菜单" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">主类目</SelectItem>
                <SelectItem v-for="menu in flattenedOptions" :key="menu.id" :value="menu.id">
                  {{ menu.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label>菜单类型</Label>
            <RadioGroup v-model="form.menuType" class="flex items-center gap-4">
              <div class="flex items-center space-x-2">
                <RadioGroupItem id="typeM" value="M" />
                <Label for="typeM">目录</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem id="typeC" value="C" />
                <Label for="typeC">菜单</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem id="typeF" value="F" />
                <Label for="typeF">按钮</Label>
              </div>
            </RadioGroup>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="menuName">菜单名称 *</Label>
              <Input id="menuName" v-model="form.menuName" placeholder="请输入菜单名称" />
            </div>
            <div class="grid gap-2">
              <Label for="orderNum">显示排序</Label>
              <Input id="orderNum" v-model="form.orderNum" type="number" />
            </div>
          </div>

          <div v-if="form.menuType !== 'F'" class="grid gap-2">
            <Label for="icon">菜单图标</Label>
            <IconPicker v-model="form.icon" />
          </div>

          <div v-if="form.menuType !== 'F'" class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="path">路由地址</Label>
              <Input id="path" v-model="form.path" placeholder="请输入路由地址" />
            </div>
            <div v-if="form.menuType === 'C'" class="grid gap-2">
              <Label for="component">组件路径</Label>
              <Input id="component" v-model="form.component" placeholder="请输入组件路径" />
            </div>
          </div>

          <div v-if="form.menuType !== 'M'" class="grid gap-2">
            <Label for="perms">权限字符</Label>
            <Input id="perms" v-model="form.perms" placeholder="system:user:list" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="visible">显示状态</Label>
              <Select v-model="form.visible">
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in getStatusOptions('showHide')"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-2">
              <Label for="status">菜单状态</Label>
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
      :description="`您确定要删除菜单 &quot;${menuToDelete?.menuName}&quot; 吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmDelete"
    />
  </div>
</template>

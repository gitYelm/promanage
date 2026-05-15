<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, h } from 'vue'
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
import {
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Edit,
  Loader2,
  ChevronRight,
  ChevronDown,
  Eye,
  Users,
  Shield,
} from 'lucide-vue-next'
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
  listRole,
  getRole,
  delRole,
  addRole,
  updateRole,
  changeRoleStatus,
} from '@/api/system/role'
import { listMenu } from '@/api/system/menu'
import type { SysRole, SysMenu } from '@/api/system/types'

const { toast } = useToast()

// State
const loading = ref(true)
const roleList = ref<SysRole[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  roleName: '',
  roleKey: '',
  status: ALL_OPTION_VALUE as string,
})

// 选择相关
const selectedIds = ref<string[]>([])
const selectAll = ref(false)
const hasSelectedRows = computed(() => selectedIds.value.length > 0)

// 监听全选状态变化
watch(selectAll, (newVal) => {
  if (newVal) {
    selectedIds.value = roleList.value.map((item) => item.roleId)
  } else {
    selectedIds.value = []
  }
})

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showBatchDeleteDialog = ref(false)
const showPreviewDialog = ref(false)
const previewExpandAll = ref(false)
const roleToDelete = ref<SysRole | null>(null)
const roleToPreview = ref<SysRole | null>(null)
const isEdit = ref(false)
const submitLoading = ref(false)
const menuList = ref<SysMenu[]>([])
const flatMenuList = ref<SysMenu[]>([]) // 扁平菜单列表，用于ID到名称的映射
const allMenuIds = ref<string[]>([]) // 所有菜单ID
const expandedAll = ref(false) // 是否展开全部

// 预览用的已选中菜单ID集合
const previewSelectedIds = computed(() => {
  if (!roleToPreview.value?.menuIds) {
    return new Set<string>()
  }
  return new Set(roleToPreview.value.menuIds.map((id) => String(id)))
})

const form = reactive<Partial<SysRole>>({
  roleId: undefined,
  roleName: '',
  roleKey: '',
  roleSort: 0,
  status: '0',
  menuIds: [],
  remark: '',
  menuCheckStrictly: true,
  dataScope: '1', // 数据权限范围: 1-全部 2-自定义 3-本部门 4-本部门及以下 5-仅本人
})

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listRole({
      ...queryParams,
      status: toQueryValue(queryParams.status),
    })
    roleList.value = res.rows
    total.value = res.total
    // 清除已不存在的选中项
    selectedIds.value = selectedIds.value.filter((id) =>
      res.rows.some((r: SysRole) => r.roleId === id),
    )
  } finally {
    loading.value = false
  }
}

// 将扁平菜单列表转换为树形结构
function buildMenuTree(flatList: SysMenu[]): SysMenu[] {
  const map = new Map<string, SysMenu>()
  const roots: SysMenu[] = []

  // 先创建所有节点的映射,并添加 children 数组
  flatList.forEach((item) => {
    map.set(item.menuId, { ...item, children: [] })
  })

  // 构建树形结构
  flatList.forEach((item) => {
    const node = map.get(item.menuId)!
    if (item.parentId === null || item.parentId === '0') {
      // 根节点
      roots.push(node)
    } else {
      // 子节点,添加到父节点的 children 中
      const parent = map.get(item.parentId)
      if (parent) {
        parent.children!.push(node)
      }
    }
  })

  return roots
}

async function getMenuTree() {
  if (menuList.value.length > 0) return
  const res = await listMenu({})
  // 保存扁平列表用于ID到名称的映射
  flatMenuList.value = res
  // 将扁平列表转换为树形结构
  menuList.value = buildMenuTree(res)
  // 收集所有菜单ID
  allMenuIds.value = res.map((menu: SysMenu) => menu.menuId)
}

// 全选菜单
function selectAllMenus() {
  form.menuIds = [...allMenuIds.value]
}

// 反选菜单
function invertMenuSelection() {
  const currentIds = new Set(form.menuIds)
  form.menuIds = allMenuIds.value.filter((id) => !currentIds.has(id))
}

// 展开/收起全部
function toggleExpandAll() {
  expandedAll.value = !expandedAll.value
}

// Search Operations
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.roleName = ''
  queryParams.roleKey = ''
  queryParams.status = ALL_OPTION_VALUE
  handleQuery()
}

// 选择操作
function toggleSelect(roleId: string) {
  const idx = selectedIds.value.indexOf(roleId)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(roleId)
  }
  selectAll.value =
    selectedIds.value.length > 0 && selectedIds.value.length === roleList.value.length
}

// 批量删除
function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    toast({ title: '提示', description: '请选择要删除的角色', variant: 'destructive' })
    return
  }
  showBatchDeleteDialog.value = true
}

async function confirmBatchDelete() {
  try {
    for (const roleId of selectedIds.value) {
      await delRole([roleId])
    }
    toast({ title: '删除成功', description: `已删除 ${selectedIds.value.length} 个角色` })
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
    toast({ title: '提示', description: '请选择要操作的角色', variant: 'destructive' })
    return
  }
  batchStatusType.value = status
  showBatchStatusDialog.value = true
}

async function confirmBatchStatus() {
  const status = batchStatusType.value
  const text = status === '0' ? '启用' : '停用'
  try {
    for (const roleId of selectedIds.value) {
      await changeRoleStatus(roleId, status)
    }
    toast({ title: '操作成功', description: `已${text} ${selectedIds.value.length} 个角色` })
    selectedIds.value = []
    selectAll.value = false
    getList()
  } finally {
    showBatchStatusDialog.value = false
  }
}

// Add/Edit Operations
async function handleAdd() {
  resetForm()
  isEdit.value = false
  await getMenuTree()
  showDialog.value = true
}

async function handleUpdate(row: SysRole) {
  resetForm()
  isEdit.value = true
  const roleId = row.roleId
  await getMenuTree()
  try {
    // getRole 已经在 API 层做了 .then(res => res.data),所以这里直接使用返回值
    const roleData = await getRole(roleId)
    if (roleData) {
      // 将后端返回的数据赋值给表单,确保 menuIds 是字符串数组
      Object.assign(form, {
        ...roleData,
        menuIds: (roleData.menuIds || []).map((id: any) => String(id)),
      })
    }
    showDialog.value = true
  } catch (error) {
    console.error('获取角色详情失败:', error)
    toast({
      title: '获取失败',
      description: '无法获取角色详情',
      variant: 'destructive',
    })
  }
}

async function handleDelete(row: SysRole) {
  roleToDelete.value = row
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!roleToDelete.value) return
  try {
    await delRole([roleToDelete.value.roleId])
    toast({ title: '删除成功', description: '角色已删除' })
    getList()
    showDeleteDialog.value = false
  } catch {
    // handled by interceptor
  }
}

// 查看角色权限预览
async function handlePreview(row: SysRole) {
  try {
    // 先加载菜单树
    await getMenuTree()
    const roleData = await getRole(row.roleId)
    roleToPreview.value = roleData
    previewExpandAll.value = false
    showPreviewDialog.value = true
  } catch (error) {
    console.error('获取角色详情失败:', error)
    toast({
      title: '获取失败',
      description: '无法获取角色详情',
      variant: 'destructive',
    })
  }
}

// 获取数据权限范围文本
function getDataScopeText(dataScope?: string): string {
  const scopeMap: Record<string, string> = {
    '1': '全部数据',
    '2': '自定义数据',
    '3': '本部门数据',
    '4': '本部门及以下数据',
    '5': '仅本人数据',
  }
  return scopeMap[dataScope || '1'] || '全部数据'
}

async function handleSubmit() {
  if (!form.roleName || !form.roleKey) {
    toast({
      title: '验证失败',
      description: '角色名称和权限字符不能为空',
      variant: 'destructive',
    })
    return
  }

  submitLoading.value = true
  try {
    if (form.roleId) {
      await updateRole(form)
      toast({ title: '修改成功', description: '角色信息已更新' })
    } else {
      await addRole(form)
      toast({ title: '新增成功', description: '角色已创建' })
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
  form.roleId = undefined
  form.roleName = ''
  form.roleKey = ''
  form.roleSort = 0
  form.status = '0'
  form.menuIds = []
  form.remark = ''
  form.menuCheckStrictly = true
  form.dataScope = '1'
  expandedAll.value = false
}

// 预览用的菜单树组件（只读展示，风格与编辑一致）
const PreviewMenuTreeItem: any = {
  name: 'PreviewMenuTreeItem',
  props: ['menu', 'level', 'selectedIds', 'expandAll'],
  setup(props: any) {
    const currentLevel = props.level || 0
    const isExpanded = ref(false)
    const hasChildren = computed(() => props.menu.children && props.menu.children.length > 0)
    const shouldExpand = computed(() => props.expandAll || isExpanded.value)
    const isChecked = computed(() => props.selectedIds?.has(String(props.menu.menuId)))

    function toggleExpand() {
      isExpanded.value = !isExpanded.value
    }

    return () =>
      h('div', { class: 'py-1' }, [
        h(
          'div',
          {
            class: 'flex items-center gap-1',
            style: { 'padding-left': `${currentLevel * 24}px` },
          },
          [
            // 展开/收起图标
            hasChildren.value
              ? h(
                  'button',
                  {
                    class:
                      'w-4 h-4 flex items-center justify-center hover:bg-accent rounded transition-colors',
                    onClick: (e: Event) => {
                      e.stopPropagation()
                      toggleExpand()
                    },
                  },
                  [h(isExpanded.value ? ChevronDown : ChevronRight, { class: 'w-3 h-3' })],
                )
              : h('span', { class: 'w-4' }),
            // 禁用的 Checkbox
            h(Checkbox, {
              modelValue: isChecked.value,
              disabled: true,
            }),
            h('span', { class: 'text-sm' }, props.menu.menuName),
          ],
        ),
        // 子节点(仅在展开时显示)
        hasChildren.value && shouldExpand.value
          ? h(
              'div',
              {},
              props.menu.children.map((child: any) =>
                h(PreviewMenuTreeItem, {
                  key: child.menuId,
                  menu: child,
                  level: currentLevel + 1,
                  selectedIds: props.selectedIds,
                  expandAll: props.expandAll,
                }),
              ),
            )
          : null,
      ])
  },
}

// Simple recursive component for menu tree checklist
// In real project, use a Tree component with checkbox support
const MenuTreeItem: any = {
  name: 'MenuTreeItem',
  props: ['menu', 'modelValue', 'checkStrictly', 'level', 'expandAll'],
  emits: ['update:modelValue'],
  setup(props: any, { emit }: any) {
    const isChecked = computed(() => props.modelValue.includes(props.menu.menuId))
    const currentLevel = props.level || 0
    const isExpanded = ref(false) // 默认收起
    const hasChildren = computed(() => props.menu.children && props.menu.children.length > 0)

    // 监听expandAll变化
    const shouldExpand = computed(() => props.expandAll || isExpanded.value)

    function toggleExpand() {
      isExpanded.value = !isExpanded.value
    }

    function toggle(checked: boolean | 'indeterminate') {
      if (checked === 'indeterminate') return

      let newIds = [...props.modelValue]
      if (checked) {
        if (!newIds.includes(props.menu.menuId)) newIds.push(props.menu.menuId)
        // Select children if checkStrictly is true (联动开启)
        if (props.checkStrictly && hasChildren.value) {
          const addChildren = (nodes: any[]) => {
            nodes.forEach((n) => {
              if (!newIds.includes(n.menuId)) newIds.push(n.menuId)
              if (n.children && n.children.length > 0) addChildren(n.children)
            })
          }
          addChildren(props.menu.children)
        }
      } else {
        newIds = newIds.filter((id: string) => id !== props.menu.menuId)
        // Deselect children if checkStrictly is true (联动开启)
        if (props.checkStrictly && hasChildren.value) {
          const removeChildren = (nodes: any[]) => {
            nodes.forEach((n) => {
              newIds = newIds.filter((id: string) => id !== n.menuId)
              if (n.children && n.children.length > 0) removeChildren(n.children)
            })
          }
          removeChildren(props.menu.children)
        }
      }
      emit('update:modelValue', newIds)
    }

    return () =>
      h('div', { class: 'py-1' }, [
        h(
          'div',
          {
            class: 'flex items-center gap-1',
            style: { 'padding-left': `${currentLevel * 24}px` },
          },
          [
            // 展开/收起图标
            hasChildren.value
              ? h(
                  'button',
                  {
                    class:
                      'w-4 h-4 flex items-center justify-center hover:bg-accent rounded transition-colors',
                    onClick: (e: Event) => {
                      e.stopPropagation()
                      toggleExpand()
                    },
                  },
                  [h(isExpanded.value ? ChevronDown : ChevronRight, { class: 'w-3 h-3' })],
                )
              : h('span', { class: 'w-4' }), // 占位符保持对齐
            h(Checkbox, {
              modelValue: isChecked.value,
              'onUpdate:modelValue': toggle,
            }),
            h('span', { class: 'text-sm' }, props.menu.menuName),
          ],
        ),
        // 子节点(仅在展开时显示)
        hasChildren.value && shouldExpand.value
          ? h(
              'div',
              {},
              props.menu.children.map((child: any) =>
                h(MenuTreeItem, {
                  key: child.menuId,
                  menu: child,
                  modelValue: props.modelValue,
                  checkStrictly: props.checkStrictly,
                  level: currentLevel + 1,
                  expandAll: props.expandAll,
                  'onUpdate:modelValue': (val: any) => emit('update:modelValue', val),
                }),
              ),
            )
          : null,
      ])
  },
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
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">角色管理</h2>
        <p class="text-muted-foreground">管理系统角色及其权限分配</p>
      </div>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getList" />
        <Button @click="handleAdd">
          <Plus class="mr-2 h-4 w-4" />
          新增角色
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">角色名称</span>
        <Input
          v-model="queryParams.roleName"
          placeholder="请输入角色名称"
          class="w-[200px]"
          @keyup.enter="handleQuery"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">权限字符</span>
        <Input
          v-model="queryParams.roleKey"
          placeholder="请输入权限字符"
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
      <TableSkeleton v-if="loading" :columns="8" :rows="10" show-checkbox />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="roleList.length === 0"
        title="暂无角色数据"
        description="点击新增角色按钮添加第一个角色"
        action-text="新增角色"
        @action="handleAdd"
      />

      <!-- 数据表格 -->
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">
              <Checkbox v-model="selectAll" :disabled="roleList.length === 0" />
            </TableHead>
            <TableHead>角色编号</TableHead>
            <TableHead>角色名称</TableHead>
            <TableHead>权限字符</TableHead>
            <TableHead>用户数</TableHead>
            <TableHead>数据权限</TableHead>
            <TableHead>显示顺序</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="item in roleList" :key="item.roleId">
            <TableCell>
              <Checkbox
                :model-value="selectedIds.includes(item.roleId)"
                @update:model-value="() => toggleSelect(item.roleId)"
              />
            </TableCell>
            <TableCell>{{ item.roleId }}</TableCell>
            <TableCell>{{ item.roleName }}</TableCell>
            <TableCell
              ><Badge variant="outline">{{ item.roleKey }}</Badge></TableCell
            >
            <TableCell>
              <Badge variant="outline" class="font-mono">
                <Users class="w-3 h-3 mr-1" />
                {{ item.userCount || 0 }}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                <Shield class="w-3 h-3 mr-1" />
                {{ getDataScopeText(item.dataScope) }}
              </Badge>
            </TableCell>
            <TableCell>{{ item.roleSort }}</TableCell>
            <TableCell>
              <StatusSwitch
                :status="item.status"
                :name="item.roleName"
                :on-toggle="(s) => changeRoleStatus(item.roleId, s)"
                @update:status="item.status = $event as '0' | '1'"
              />
            </TableCell>
            <TableCell>{{ formatDate(item.createTime) }}</TableCell>
            <TableCell class="text-right space-x-2">
              <Button variant="ghost" size="icon" title="查看权限" @click="handlePreview(item)">
                <Eye class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" title="修改" @click="handleUpdate(item)">
                <Edit class="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="text-destructive"
                title="删除"
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
      <DialogContent class="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>{{ isEdit ? '修改角色' : '新增角色' }}</DialogTitle>
          <DialogDescription> 请填写角色信息 </DialogDescription>
        </DialogHeader>

        <div class="flex-1 overflow-y-auto grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="roleName">角色名称 *</Label>
              <Input id="roleName" v-model="form.roleName" placeholder="请输入角色名称" />
            </div>
            <div class="grid gap-2">
              <Label for="roleKey">权限字符 *</Label>
              <Input id="roleKey" v-model="form.roleKey" placeholder="请输入权限字符" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="roleSort">显示顺序</Label>
              <Input id="roleSort" v-model="form.roleSort" type="number" />
            </div>
            <div class="grid gap-2">
              <Label for="status">状态</Label>
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
            <Label for="dataScope">数据权限范围</Label>
            <Select v-model="form.dataScope">
              <SelectTrigger>
                <SelectValue placeholder="选择数据权限范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">全部数据</SelectItem>
                <SelectItem value="2">自定义数据</SelectItem>
                <SelectItem value="3">本部门数据</SelectItem>
                <SelectItem value="4">本部门及以下数据</SelectItem>
                <SelectItem value="5">仅本人数据</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Label>菜单权限</Label>
              <div class="flex gap-2">
                <Button type="button" variant="outline" size="sm" @click="selectAllMenus">
                  全选
                </Button>
                <Button type="button" variant="outline" size="sm" @click="invertMenuSelection">
                  反选
                </Button>
                <Button type="button" variant="outline" size="sm" @click="toggleExpandAll">
                  {{ expandedAll ? '收起' : '展开' }}全部
                </Button>
              </div>
            </div>
            <div class="flex items-center space-x-2 mb-2">
              <Checkbox
                id="checkStrictly"
                :model-value="form.menuCheckStrictly"
                @update:model-value="(val) => (form.menuCheckStrictly = !!val)"
              />
              <Label for="checkStrictly" class="text-sm text-muted-foreground">父子联动</Label>
            </div>
            <div class="border rounded-md p-2 h-[200px] overflow-y-auto">
              <MenuTreeItem
                v-for="menu in menuList"
                :key="menu.menuId"
                v-model="form.menuIds"
                :menu="menu"
                :check-strictly="form.menuCheckStrictly"
                :level="0"
                :expand-all="expandedAll"
              />
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="remark">备注</Label>
            <Input id="remark" v-model="form.remark" placeholder="请输入备注" />
          </div>
        </div>

        <DialogFooter class="flex-shrink-0">
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
      :description="`您确定要删除角色 &quot;${roleToDelete?.roleName}&quot; 吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmDelete"
    />

    <!-- Batch Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showBatchDeleteDialog"
      title="确认批量删除"
      :description="`您确定要删除选中的 ${selectedIds.length} 个角色吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmBatchDelete"
    />

    <!-- Batch Status Dialog -->
    <ConfirmDialog
      v-model:open="showBatchStatusDialog"
      :title="`确认批量${batchStatusType === '0' ? '启用' : '停用'}`"
      :description="`您确定要${batchStatusType === '0' ? '启用' : '停用'}选中的 ${selectedIds.length} 个角色吗？`"
      confirm-text="确定"
      @confirm="confirmBatchStatus"
    />

    <!-- Preview Dialog -->
    <Dialog v-model:open="showPreviewDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>角色权限预览</DialogTitle>
          <DialogDescription>
            查看角色 "{{ roleToPreview?.roleName }}" 的详细权限信息
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm font-medium text-muted-foreground mb-1">角色名称</div>
              <div class="text-sm">{{ roleToPreview?.roleName }}</div>
            </div>
            <div>
              <div class="text-sm font-medium text-muted-foreground mb-1">权限字符</div>
              <div class="text-sm">
                <Badge variant="outline">{{ roleToPreview?.roleKey }}</Badge>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-sm font-medium text-muted-foreground mb-1">数据权限</div>
              <div class="text-sm">
                <Badge variant="secondary">
                  <Shield class="w-3 h-3 mr-1" />
                  {{ getDataScopeText(roleToPreview?.dataScope) }}
                </Badge>
              </div>
            </div>
            <div>
              <div class="text-sm font-medium text-muted-foreground mb-1">状态</div>
              <div class="text-sm">
                <Badge :variant="roleToPreview?.status === '0' ? 'default' : 'secondary'">
                  {{ roleToPreview?.status === '0' ? '正常' : '停用' }}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium text-muted-foreground">菜单权限</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="previewExpandAll = !previewExpandAll"
              >
                {{ previewExpandAll ? '收起' : '展开' }}全部
              </Button>
            </div>
            <div class="border rounded-md p-2 h-[200px] overflow-y-auto">
              <template v-if="menuList.length > 0">
                <PreviewMenuTreeItem
                  v-for="menu in menuList"
                  :key="menu.menuId"
                  :menu="menu"
                  :level="0"
                  :selected-ids="previewSelectedIds"
                  :expand-all="previewExpandAll"
                />
              </template>
              <div v-else class="text-sm text-muted-foreground text-center py-4">暂无菜单数据</div>
            </div>
          </div>

          <div v-if="roleToPreview?.remark">
            <div class="text-sm font-medium text-muted-foreground mb-1">备注</div>
            <div class="text-sm text-muted-foreground">{{ roleToPreview.remark }}</div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span class="font-medium">创建时间:</span> {{ formatDate(roleToPreview?.createTime) }}
            </div>
            <div v-if="roleToPreview?.updateTime">
              <span class="font-medium">更新时间:</span> {{ formatDate(roleToPreview.updateTime) }}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showPreviewDialog = false">关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

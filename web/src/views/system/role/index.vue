<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast/use-toast'
import { Plus } from 'lucide-vue-next'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import RoleFilters from './components/RoleFilters.vue'
import RoleBatchActions from './components/RoleBatchActions.vue'
import RoleTable from './components/RoleTable.vue'
import RoleFormDialog from './components/RoleFormDialog.vue'
import RolePreviewDialog from './components/RolePreviewDialog.vue'
import RoleConfirmDialogs from './components/RoleConfirmDialogs.vue'
import { toQueryValue, ALL_OPTION_VALUE } from '@/utils/options'
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
import { useUserStore } from '@/stores/modules/user'
import {
  defaultEditableSecurityLevel,
  getCurrentMaxSecurityLevel,
  validateEditableSecurityLevel,
} from './utils/securityLevel'

const { toast } = useToast()
const userStore = useUserStore()

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
const allMenuIds = ref<string[]>([]) // 所有菜单ID
const expandedAll = ref(false) // 是否展开全部
const currentMaxSecurityLevel = computed(() => {
  return getCurrentMaxSecurityLevel(userStore.roles, userStore.roleList)
})

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
  securityLevel: 100,
})

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listRole({ ...queryParams, status: toQueryValue(queryParams.status) })
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
    toast({ title: '获取失败', description: '无法获取角色详情', variant: 'destructive' })
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
    toast({ title: '获取失败', description: '无法获取角色详情', variant: 'destructive' })
  }
}

async function handleSubmit() {
  const securityLevelMessage = validateEditableSecurityLevel(
    form.securityLevel,
    currentMaxSecurityLevel.value,
  )
  if (!form.roleName || !form.roleKey || securityLevelMessage) {
    toast({
      title: '验证失败',
      description: securityLevelMessage || '角色名称、权限字符不能为空',
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
  form.securityLevel = defaultEditableSecurityLevel(currentMaxSecurityLevel.value)
  expandedAll.value = false
}

function handleRoleStatusChange(role: SysRole, status: '0' | '1') {
  role.status = status
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

    <RoleFilters
      v-model:query-params="queryParams"
      @query="handleQuery"
      @reset="resetQuery"
    />

    <RoleBatchActions
      :selected-count="selectedIds.length"
      @status="handleBatchStatus"
      @delete="handleBatchDelete"
    />

    <RoleTable
      v-model:select-all="selectAll"
      v-model:page-num="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :loading="loading"
      :role-list="roleList"
      :selected-ids="selectedIds"
      :total="total"
      @add="handleAdd"
      @toggle-select="toggleSelect"
      @status-change="handleRoleStatusChange"
      @preview="handlePreview"
      @edit="handleUpdate"
      @delete="handleDelete"
      @change="getList"
    />

    <RoleFormDialog
      v-model:open="showDialog"
      :is-edit="isEdit"
      :form="form"
      :menu-list="menuList"
      :expanded-all="expandedAll"
      :submit-loading="submitLoading"
      @toggle-expand-all="toggleExpandAll"
      @select-all-menus="selectAllMenus"
      @invert-menu-selection="invertMenuSelection"
      @submit="handleSubmit"
    />

    <RoleConfirmDialogs
      v-model:delete-open="showDeleteDialog"
      v-model:batch-delete-open="showBatchDeleteDialog"
      v-model:batch-status-open="showBatchStatusDialog"
      :role-to-delete="roleToDelete"
      :selected-count="selectedIds.length"
      :batch-status-type="batchStatusType"
      @confirm-delete="confirmDelete"
      @confirm-batch-delete="confirmBatchDelete"
      @confirm-batch-status="confirmBatchStatus"
    />

    <RolePreviewDialog
      v-model:open="showPreviewDialog"
      v-model:expand-all="previewExpandAll"
      :role="roleToPreview"
      :menu-list="menuList"
      :selected-ids="previewSelectedIds"
    />
  </div>
</template>

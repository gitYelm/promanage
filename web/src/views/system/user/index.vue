<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  FileDown,
  FileUp,
  Trash2,
  Loader2,
  RefreshCw,
  Key,
  Eye,
  CheckSquare,
  XSquare,
  Filter,
  Edit,
  Settings2,
  Download,
} from 'lucide-vue-next'
import {
  listUser,
  getUser,
  delUser,
  addUser,
  updateUser,
  resetUserPwd,
  changeUserStatus,
  downloadUserTemplate,
  importUserExcel,
} from '@/api/system/user'
import { listDeptTree } from '@/api/system/dept'
import { listRole } from '@/api/system/role'
import { listPost } from '@/api/system/post'
import type { SysUser, SysRole, SysPost } from '@/api/system/types'
import DeptTreeSelect from '@/components/business/DeptTreeSelect.vue'
import UserForm from '@/components/business/UserForm.vue'
import UserDetailDialog from '@/components/business/UserDetailDialog.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ExportButton from '@/components/common/ExportButton.vue'
import ExportDialog from '@/components/common/ExportDialog.vue'
import ExportTaskList from '@/components/common/ExportTaskList.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import { formatDate } from '@/utils/format'
import { getStatusOptionsWithAll, toQueryValue, ALL_OPTION_VALUE } from '@/utils/options'

// State
const loading = ref(true)
const userList = ref<SysUser[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  userName: '',
  phonenumber: '',
  status: ALL_OPTION_VALUE as string,
  deptId: undefined,
  roleId: undefined,
})

// 高级搜索
const showAdvancedSearch = ref(false)
const selectedRows = ref<string[]>([])
const selectAll = ref(false)

// 表格列配置
interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  fixed?: boolean // 固定列不可隐藏
}

const COLUMN_STORAGE_KEY = 'user-table-columns'

// 默认列配置
const defaultColumns: ColumnConfig[] = [
  { key: 'userId', label: '用户编号', visible: true },
  { key: 'userName', label: '用户名', visible: true, fixed: true },
  { key: 'nickName', label: '用户昵称', visible: true },
  { key: 'dept', label: '部门', visible: true },
  { key: 'phonenumber', label: '手机号码', visible: true },
  { key: 'email', label: '邮箱', visible: false },
  { key: 'status', label: '状态', visible: true },
  { key: 'createTime', label: '创建时间', visible: true },
]

// 从 localStorage 加载列配置
function loadColumnConfig(): ColumnConfig[] {
  try {
    const saved = localStorage.getItem(COLUMN_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as ColumnConfig[]
      // 合并保存的配置与默认配置，确保新增列也能显示
      return defaultColumns.map((col) => {
        const savedCol = parsed.find((c) => c.key === col.key)
        return savedCol ? { ...col, visible: savedCol.visible } : col
      })
    }
  } catch {
    // ignore
  }
  return defaultColumns.map((c) => ({ ...c }))
}

// 保存列配置到 localStorage
function saveColumnConfig() {
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columns.value))
}

const columns = ref<ColumnConfig[]>(loadColumnConfig())

// 切换列显示
function toggleColumn(key: string) {
  const col = columns.value.find((c) => c.key === key)
  if (col && !col.fixed) {
    col.visible = !col.visible
    saveColumnConfig()
  }
}

// 重置列配置
function resetColumns() {
  columns.value = defaultColumns.map((c) => ({ ...c }))
  saveColumnConfig()
}

// 判断列是否可见
function isColumnVisible(key: string): boolean {
  const col = columns.value.find((c) => c.key === key)
  return col ? col.visible : true
}

// 计算属性:是否有选中的行
const hasSelectedRows = computed(() => selectedRows.value.length > 0)

// 计算属性:可见列数量(用于空数据colspan)
const _visibleColumnCount = computed(() => {
  // 选择框列 + 可见数据列 + 操作列
  return 1 + columns.value.filter((c) => c.visible).length + 1
})

const deptOptions = ref<any[]>([])
const roleOptions = ref<SysRole[]>([])
const postOptions = ref<SysPost[]>([])

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showDetailDialog = ref(false)
const showBatchDeleteDialog = ref(false)
const userToDelete = ref<SysUser | null>(null)
const currentUser = ref<SysUser | null>(null)
const isEdit = ref(false)
const submitLoading = ref(false)
const userFormRef = ref<InstanceType<typeof UserForm> | null>(null)

// Form Data
const form = reactive<Partial<SysUser>>({
  userId: undefined,
  deptId: undefined,
  userName: '',
  nickName: '',
  password: '',
  phonenumber: '',
  email: '',
  sex: '0',
  status: '0',
  remark: '',
  postIds: [],
  roleIds: [],
})

const { toast } = useToast()

// 获取完整的头像URL
function getAvatarUrl(avatar: string | undefined | null): string {
  if (!avatar) return ''
  // 如果已经是完整URL,直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  // 如果是相对路径,拼接后端地址
  return `${import.meta.env.VITE_API_URL}${avatar}`
}

// Fetch Data
async function getList() {
  loading.value = true
  try {
    const res = await listUser({
      ...queryParams,
      status: toQueryValue(queryParams.status),
    })
    userList.value = res.rows
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function getDeptTree() {
  const res = await listDeptTree()
  deptOptions.value = toTreeDept(res)
}

// Search Operations
function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.userName = ''
  queryParams.phonenumber = ''
  queryParams.status = ALL_OPTION_VALUE
  queryParams.deptId = undefined
  queryParams.roleId = undefined
  handleQuery()
}

// 切换高级搜索
function toggleAdvancedSearch() {
  showAdvancedSearch.value = !showAdvancedSearch.value
}

// Add/Edit Operations
async function handleAdd() {
  resetForm()
  isEdit.value = false
  // Load roles and posts
  const [roleRes, postRes] = await Promise.all([listRole({}), listPost({})])
  roleOptions.value = roleRes.rows
  postOptions.value = postRes.rows
  showDialog.value = true
}

async function handleUpdate(row: SysUser) {
  resetForm()
  isEdit.value = true
  const userId = row.userId

  const [userRes, roleRes, postRes] = await Promise.all([
    getUser(userId),
    listRole({}),
    listPost({}),
  ])

  Object.assign(form, userRes.user)
  form.postIds = userRes.postIds
  form.roleIds = userRes.roleIds
  // Password is not needed for update
  delete form.password

  roleOptions.value = roleRes.rows
  postOptions.value = postRes.rows
  showDialog.value = true
}

async function handleSubmit() {
  // 使用表单组件的验证方法
  if (userFormRef.value && !userFormRef.value.validate()) {
    return
  }

  submitLoading.value = true
  try {
    if (form.userId) {
      await updateUser(form)
      toast({ title: '修改成功', description: '用户信息已更新' })
    } else {
      await addUser(form)
      toast({ title: '新增成功', description: '用户已创建' })
    }
    showDialog.value = false
    getList()
  } catch {
    // 错误已由请求拦截器处理
  } finally {
    submitLoading.value = false
  }
}

// 查看详情
async function handleDetail(row: SysUser) {
  // 获取完整的用户信息(包含角色和岗位)
  const userRes = await getUser(row.userId)
  currentUser.value = {
    ...userRes.user,
    roles: userRes.roles,
    posts: userRes.posts,
  } as any
  showDetailDialog.value = true
}

// 批量删除
function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    toast({
      title: '提示',
      description: '请选择要删除的用户',
      variant: 'destructive',
    })
    return
  }
  showBatchDeleteDialog.value = true
}

async function confirmBatchDelete() {
  try {
    // 逐个删除
    for (const userId of selectedRows.value) {
      await delUser([userId])
    }
    toast({
      title: '删除成功',
      description: `已删除 ${selectedRows.value.length} 个用户`,
    })
    selectedRows.value = []
    selectAll.value = false
    getList()
    showBatchDeleteDialog.value = false
  } catch {
    // Error handled by interceptor
  }
}

// 批量启用/停用
const showBatchStatusDialog = ref(false)
const batchStatusType = ref<'0' | '1'>('0')

function handleBatchStatus(status: '0' | '1') {
  if (selectedRows.value.length === 0) {
    toast({
      title: '提示',
      description: '请选择要操作的用户',
      variant: 'destructive',
    })
    return
  }
  batchStatusType.value = status
  showBatchStatusDialog.value = true
}

async function confirmBatchStatus() {
  const status = batchStatusType.value
  const text = status === '0' ? '启用' : '停用'

  try {
    for (const userId of selectedRows.value) {
      await changeUserStatus(userId, status)
    }
    toast({
      title: '操作成功',
      description: `已${text} ${selectedRows.value.length} 个用户`,
    })
    selectedRows.value = []
    selectAll.value = false
    getList()
    showBatchStatusDialog.value = false
  } catch {
    // Error handled by interceptor
  }
}

// 导出功能
const showExportDialog = ref(false)
const showExportTasks = ref(false)
const lastExportTaskId = ref<string | null>(null)

function handleExport() {
  showExportDialog.value = true
}

function handleExportSuccess(taskId: string) {
  lastExportTaskId.value = taskId
  showExportTasks.value = true
}

// 导入功能
const showImportDialog = ref(false)
const importFile = ref<File | null>(null)
const importLoading = ref(false)
const updateSupport = ref(false)
const importResult = ref<{ success: number; fail: number; errors: string[] } | null>(null)

function handleImport() {
  importFile.value = null
  updateSupport.value = false
  importResult.value = null
  showImportDialog.value = true
}

async function handleDownloadTemplate() {
  try {
    const res = await downloadUserTemplate()
    const blob = new Blob([res as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '用户导入模板.xlsx'
    link.click()
    URL.revokeObjectURL(link.href)
  } catch {
    toast({ title: '下载失败', variant: 'destructive' })
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    importFile.value = target.files[0]
  }
}

async function confirmImport() {
  if (!importFile.value) {
    toast({ title: '请选择文件', variant: 'destructive' })
    return
  }
  importLoading.value = true
  try {
    const result = await importUserExcel(importFile.value, updateSupport.value)
    importResult.value = result
    if (result.success > 0) {
      toast({ title: '导入完成', description: `成功 ${result.success} 条，失败 ${result.fail} 条` })
      getList()
    }
  } catch {
    toast({ title: '导入失败', variant: 'destructive' })
  } finally {
    importLoading.value = false
  }
}

// 清除选择
function clearSelection() {
  selectedRows.value = []
  selectAll.value = false
}

// 切换单个选择
function toggleRowSelection(userId: string) {
  const index = selectedRows.value.indexOf(userId)
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(userId)
  }
  // 更新全选状态
  selectAll.value =
    selectedRows.value.length > 0 && selectedRows.value.length === userList.value.length
}

async function handleDelete(row: SysUser) {
  userToDelete.value = row
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!userToDelete.value) return
  try {
    await delUser([userToDelete.value.userId])
    toast({ title: '删除成功', description: '用户已删除' })
    getList()
    showDeleteDialog.value = false
  } catch {
    // Error handled by interceptor
  }
}

// 重置密码
const showResetPwdDialog = ref(false)
const userToResetPwd = ref<SysUser | null>(null)
const newPassword = ref('admin123')

function handleResetPwd(row: SysUser) {
  userToResetPwd.value = row
  newPassword.value = 'admin123'
  showResetPwdDialog.value = true
}

async function confirmResetPwd() {
  if (!userToResetPwd.value || !newPassword.value) return
  try {
    await resetUserPwd(userToResetPwd.value.userId, newPassword.value)
    toast({ title: '操作成功', description: '密码已重置' })
    showResetPwdDialog.value = false
  } catch {
    // Error handled by interceptor
  }
}

function resetForm() {
  form.userId = undefined
  form.deptId = undefined
  form.userName = ''
  form.nickName = ''
  form.password = ''
  form.phonenumber = ''
  form.email = ''
  form.sex = '0'
  form.status = '0'
  form.remark = ''
  form.postIds = []
  form.roleIds = []
}

// Dept Tree Helper
// 将部门树扁平化为下拉选项，确保拥有有效的 id 与 label 字段
const _flattenedDepts = computed(() => {
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

// 将扁平部门列表转换为树形结构（用于筛选与表单）
function toTreeDept(list: any[]): any[] {
  const map = new Map<string, any>()
  const roots: any[] = []

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

// 监听全选状态变化
watch(selectAll, (newVal) => {
  if (newVal) {
    selectedRows.value = userList.value.map((u) => u.userId)
  } else {
    selectedRows.value = []
  }
})

const route = useRoute()

onMounted(async () => {
  await getList()
  getDeptTree()
  // 加载角色列表用于高级搜索
  const roleRes = await listRole({})
  roleOptions.value = roleRes.rows

  // 检查URL参数,如果有edit参数则自动打开编辑对话框
  const editUserId = route.query.edit as string
  if (editUserId) {
    const user = userList.value.find((u) => String(u.userId) === editUserId)
    if (user) {
      handleUpdate(user)
    }
  }
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">用户管理</h2>
        <p class="text-sm text-muted-foreground">管理系统用户、分配角色和部门</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" @click="handleImport">
          <FileUp class="h-4 w-4 sm:mr-2" />
          <span class="hidden sm:inline">导入</span>
        </Button>
        <ExportButton size="sm" @export="handleExport" />
        <Button variant="outline" size="sm" title="导出任务" @click="showExportTasks = true">
          <FileDown class="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon" class="h-8 w-8 sm:h-9 sm:w-9">
              <Settings2 class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuLabel>显示列</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              v-for="col in columns"
              :key="col.key"
              :checked="col.visible"
              :disabled="col.fixed"
              @select="
                (e: Event) => {
                  e.preventDefault()
                  toggleColumn(col.key)
                }
              "
            >
              {{ col.label }}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem @select="resetColumns"> 重置默认 </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" @click="handleAdd">
          <Plus class="h-4 w-4 sm:mr-2" />
          <span class="hidden sm:inline">新增用户</span>
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div class="space-y-4">
      <!-- 基础搜索 -->
      <div
        class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-3 sm:p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <span class="text-sm font-medium whitespace-nowrap">用户名</span>
          <Input
            v-model="queryParams.userName"
            placeholder="请输入用户名"
            class="w-full sm:w-[150px]"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <span class="text-sm font-medium whitespace-nowrap">手机号码</span>
          <Input
            v-model="queryParams.phonenumber"
            placeholder="请输入手机号码"
            class="w-full sm:w-[150px]"
            @keyup.enter="handleQuery"
          />
        </div>
        <div class="flex gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" @click="toggleAdvancedSearch">
            <Filter class="w-4 h-4 mr-2" />
            {{ showAdvancedSearch ? '收起' : '高级搜索' }}
          </Button>
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

      <!-- 高级搜索 -->
      <div
        v-if="showAdvancedSearch"
        class="bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div class="grid grid-cols-3 gap-4">
          <div class="grid gap-2">
            <Label>状态</Label>
            <Select v-model="queryParams.status" @update:model-value="handleQuery">
              <SelectTrigger>
                <SelectValue placeholder="请选择状态" />
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
          <div class="grid gap-2">
            <Label>部门</Label>
            <DeptTreeSelect
              v-model="queryParams.deptId"
              :depts="deptOptions"
              placeholder="请选择部门"
              @update:model-value="handleQuery"
            />
          </div>
          <div class="grid gap-2">
            <Label>角色</Label>
            <Select v-model="queryParams.roleId" @update:model-value="handleQuery">
              <SelectTrigger>
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="role in roleOptions" :key="role.roleId" :value="role.roleId">
                  {{ role.roleName }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量操作栏 - 勾选后显示 -->
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
        class="flex items-center justify-between gap-4 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg"
      >
        <div class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground">已选择</span>
          <span class="font-medium text-primary">{{ selectedRows.length }}</span>
          <span class="text-muted-foreground">项</span>
          <Button
            variant="link"
            size="sm"
            class="h-auto p-0 text-muted-foreground"
            @click="clearSelection"
          >
            取消选择
          </Button>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="handleBatchStatus('0')">
            <CheckSquare class="h-4 w-4 mr-2" />
            批量启用
          </Button>
          <Button variant="outline" size="sm" @click="handleBatchStatus('1')">
            <XSquare class="h-4 w-4 mr-2" />
            批量停用
          </Button>
          <Button variant="destructive" size="sm" @click="handleBatchDelete">
            <Trash2 class="h-4 w-4 mr-2" />
            批量删除
          </Button>
        </div>
      </div>
    </Transition>

    <!-- Table -->
    <div class="border rounded-md bg-card overflow-x-auto">
      <!-- 骨架屏 -->
      <TableSkeleton v-if="loading" :columns="6" :rows="10" show-checkbox />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="userList.length === 0"
        title="暂无用户数据"
        description="点击新增用户按钮添加第一个用户"
        action-text="新增用户"
        @action="handleAdd"
      />

      <!-- 数据表格 -->
      <Table v-else class="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead class="w-[50px]">
              <Checkbox v-model="selectAll" />
            </TableHead>
            <TableHead v-if="isColumnVisible('userId')" class="w-[100px]">用户编号</TableHead>
            <TableHead v-if="isColumnVisible('userName')">用户名</TableHead>
            <TableHead v-if="isColumnVisible('nickName')">用户昵称</TableHead>
            <TableHead v-if="isColumnVisible('dept')">部门</TableHead>
            <TableHead v-if="isColumnVisible('phonenumber')">手机号码</TableHead>
            <TableHead v-if="isColumnVisible('email')">邮箱</TableHead>
            <TableHead v-if="isColumnVisible('status')">状态</TableHead>
            <TableHead v-if="isColumnVisible('createTime')">创建时间</TableHead>
            <TableHead class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="user in userList" :key="user.userId">
            <TableCell>
              <Checkbox
                :model-value="selectedRows.includes(user.userId)"
                @update:model-value="() => toggleRowSelection(user.userId)"
              />
            </TableCell>
            <TableCell v-if="isColumnVisible('userId')">{{ user.userId }}</TableCell>
            <TableCell v-if="isColumnVisible('userName')" class="font-medium">
              <div class="flex items-center gap-2">
                <Avatar class="h-8 w-8">
                  <AvatarImage :src="getAvatarUrl(user.avatar)" />
                  <AvatarFallback>{{ user.nickName?.charAt(0) || 'U' }}</AvatarFallback>
                </Avatar>
                {{ user.userName }}
              </div>
            </TableCell>
            <TableCell v-if="isColumnVisible('nickName')">{{ user.nickName }}</TableCell>
            <TableCell v-if="isColumnVisible('dept')">{{ user.dept?.deptName }}</TableCell>
            <TableCell v-if="isColumnVisible('phonenumber')">{{ user.phonenumber }}</TableCell>
            <TableCell v-if="isColumnVisible('email')">{{ user.email }}</TableCell>
            <TableCell v-if="isColumnVisible('status')">
              <StatusSwitch
                :status="user.status"
                :name="user.nickName"
                :on-toggle="(s) => changeUserStatus(user.userId, s)"
                @update:status="user.status = $event as '0' | '1'"
              />
            </TableCell>
            <TableCell v-if="isColumnVisible('createTime')">{{
              formatDate(user.createTime)
            }}</TableCell>
            <TableCell class="text-right space-x-2">
              <Button variant="ghost" size="icon" title="查看详情" @click="handleDetail(user)">
                <Eye class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" title="修改" @click="handleUpdate(user)">
                <Edit class="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" title="重置密码" @click="handleResetPwd(user)">
                <Key class="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                class="text-destructive"
                title="删除"
                @click="handleDelete(user)"
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
      <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ isEdit ? '修改用户' : '新增用户' }}</DialogTitle>
          <DialogDescription> 请填写用户信息 </DialogDescription>
        </DialogHeader>

        <UserForm
          ref="userFormRef"
          v-model="form"
          :is-edit="isEdit"
          :depts="deptOptions"
          :roles="roleOptions"
          :posts="postOptions"
        />

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
      :description="`您确定要删除用户 &quot;${userToDelete?.userName}&quot; 吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      @confirm="confirmDelete"
    />

    <!-- Batch Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showBatchDeleteDialog"
      title="确认批量删除"
      :description="`您确定要删除选中的 ${selectedRows.length} 个用户吗？此操作无法撤销。`"
      confirm-text="删除"
      destructive
      :confirm-input="selectedRows.length >= 5 ? '确认删除' : ''"
      @confirm="confirmBatchDelete"
    />

    <!-- User Detail Dialog -->
    <UserDetailDialog v-model:open="showDetailDialog" :user="currentUser" />

    <!-- Reset Password Dialog -->
    <AlertDialog v-model:open="showResetPwdDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>重置密码</AlertDialogTitle>
          <AlertDialogDescription>
            为用户 "{{ userToResetPwd?.userName }}" 重置密码
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="newPassword">新密码</Label>
            <Input
              id="newPassword"
              v-model="newPassword"
              type="password"
              placeholder="请输入新密码"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction @click="confirmResetPwd"> 确定 </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Batch Status Dialog -->
    <AlertDialog v-model:open="showBatchStatusDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认{{ batchStatusType === '0' ? '启用' : '停用' }}?</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要{{ batchStatusType === '0' ? '启用' : '停用' }}选中的
            {{ selectedRows.length }} 个用户吗？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction @click="confirmBatchStatus"> 确定 </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Import Dialog -->
    <Dialog v-model:open="showImportDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>导入用户</DialogTitle>
          <DialogDescription> 上传 Excel 文件批量导入用户数据 </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div class="text-sm">
              <p class="font-medium">下载导入模板</p>
              <p class="text-muted-foreground">请先下载模板，按格式填写数据</p>
            </div>
            <Button variant="outline" size="sm" @click="handleDownloadTemplate">
              <Download class="mr-2 h-4 w-4" />
              下载模板
            </Button>
          </div>

          <div class="grid gap-2">
            <Label>选择文件</Label>
            <Input type="file" accept=".xlsx,.xls" @change="handleFileChange" />
            <p v-if="importFile" class="text-sm text-muted-foreground">
              已选择: {{ importFile.name }}
            </p>
          </div>

          <div class="flex items-center space-x-2">
            <Checkbox id="updateSupport" v-model:checked="updateSupport" />
            <Label for="updateSupport" class="text-sm font-normal"> 更新已存在的用户数据 </Label>
          </div>

          <div v-if="importResult" class="p-4 border rounded-lg space-y-2">
            <div class="flex gap-4 text-sm">
              <span class="text-green-600">成功: {{ importResult.success }} 条</span>
              <span class="text-red-600">失败: {{ importResult.fail }} 条</span>
            </div>
            <div v-if="importResult.errors.length > 0" class="max-h-32 overflow-y-auto">
              <p v-for="(err, idx) in importResult.errors" :key="idx" class="text-sm text-red-600">
                {{ err }}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showImportDialog = false">关闭</Button>
          <Button :disabled="importLoading || !importFile" @click="confirmImport">
            <Loader2 v-if="importLoading" class="mr-2 h-4 w-4 animate-spin" />
            开始导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Export Dialog -->
    <ExportDialog
      v-model:open="showExportDialog"
      module="user"
      module-name="用户数据"
      :query-params="queryParams"
      :selected-ids="selectedRows"
      :selected-count="selectedRows.length"
      @success="handleExportSuccess"
    />

    <!-- Export Task List -->
    <ExportTaskList v-model:open="showExportTasks" :watch-task-id="lastExportTaskId" />
  </div>
</template>

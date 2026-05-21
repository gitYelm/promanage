<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  getUser,
  delUser,
  addUser,
  updateUser,
  resetUserPwd,
  changeUserStatus,
} from '@/api/system/user'
import { listRole } from '@/api/system/role'
import { listPost } from '@/api/system/post'
import type { SysUser, SysRole, SysPost } from '@/api/system/types'
import UserDetailDialog from '@/components/business/UserDetailDialog.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ExportDialog from '@/components/common/ExportDialog.vue'
import ExportTaskList from '@/components/common/ExportTaskList.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import UserFilters from './UserFilters.vue'
import UserBatchActions from './UserBatchActions.vue'
import UserTable from './UserTable.vue'
import UserFormDialog from './UserFormDialog.vue'
import UserResetPasswordDialog from './UserResetPasswordDialog.vue'
import UserImportDialog from './UserImportDialog.vue'
import UserBatchStatusDialog from './UserBatchStatusDialog.vue'
import UserToolbar from './UserToolbar.vue'
import { useUserColumns } from './useUserColumns'
import { useUserList } from './useUserList'
import { useUserImport } from './useUserImport'

const {
  loading,
  userList,
  total,
  deptOptions,
  queryParams,
  getList,
  getDeptTree,
  handleQuery,
  resetQuery,
  handleSort,
} = useUserList()

const selectedRows = ref<string[]>([])
const selectAll = ref(false)

const { columns, toggleColumn, resetColumns } = useUserColumns()

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
const userFormDialogRef = ref<InstanceType<typeof UserFormDialog> | null>(null)

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
  if (userFormDialogRef.value && !userFormDialogRef.value.validate()) {
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

const {
  showImportDialog,
  importFile,
  importLoading,
  updateSupport,
  importResult,
  handleImport,
  handleDownloadTemplate,
  handleFileChange,
  confirmImport,
} = useUserImport(toast, getList)

// 清除选择
function _clearSelection() {
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
      <UserToolbar
        :loading="loading"
        :columns="columns"
        @refresh="getList"
        @import="handleImport"
        @export="handleExport"
        @show-export-tasks="showExportTasks = true"
        @toggle-column="toggleColumn"
        @reset-columns="resetColumns"
        @add="handleAdd"
      />
    </div>

    <UserFilters
      :query="queryParams"
      :dept-options="deptOptions"
      :role-options="roleOptions"
      @search="handleQuery"
      @reset="resetQuery"
    />

    <UserBatchActions
      :selected-count="selectedRows.length"
      @batch-status="handleBatchStatus"
      @batch-delete="handleBatchDelete"
    />

    <UserTable
      :loading="loading"
      :users="userList"
      :columns="columns"
      :selected-rows="selectedRows"
      :select-all="selectAll"
      :sort-by="queryParams.sortBy"
      :sort-order="queryParams.sortOrder"
      @add="handleAdd"
      @detail="handleDetail"
      @edit="handleUpdate"
      @reset-password="handleResetPwd"
      @delete="handleDelete"
      @toggle-row="toggleRowSelection"
      @update-select-all="(checked) => (selectAll = checked)"
      @status-updated="(user, status) => (user.status = status as '0' | '1')"
      @sort="handleSort"
    />

    <!-- Pagination -->
    <TablePagination
      v-model:page-num="queryParams.pageNum"
      v-model:page-size="queryParams.pageSize"
      :total="total"
      @change="getList"
    />

    <UserFormDialog
      ref="userFormDialogRef"
      v-model:open="showDialog"
      :form="form"
      :is-edit="isEdit"
      :submit-loading="submitLoading"
      :dept-options="deptOptions"
      :role-options="roleOptions"
      :post-options="postOptions"
      @submit="handleSubmit"
    />

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

    <UserResetPasswordDialog
      v-model:open="showResetPwdDialog"
      v-model:password="newPassword"
      :user="userToResetPwd"
      @confirm="confirmResetPwd"
    />

    <UserBatchStatusDialog
      v-model:open="showBatchStatusDialog"
      :status="batchStatusType"
      :selected-count="selectedRows.length"
      @confirm="confirmBatchStatus"
    />

    <UserImportDialog
      v-model:open="showImportDialog"
      :import-file="importFile"
      :import-loading="importLoading"
      :update-support="updateSupport"
      :import-result="importResult"
      @download-template="handleDownloadTemplate"
      @file-change="handleFileChange"
      @update-support="(value) => (updateSupport = value)"
      @confirm="confirmImport"
    />

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

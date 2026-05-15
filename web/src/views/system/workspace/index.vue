<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, Edit, Trash2, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  addWorkspaceConfig,
  delWorkspaceConfig,
  getWorkspaceConfig,
  listWorkspaceConfig,
  updateWorkspaceConfig,
  workspaceMenuOptions,
  workspaceRoleOptions,
  type WorkspaceConfig,
  type WorkspaceMenuOption,
  type WorkspaceRoleOption,
} from '@/api/system/workspace'

const { toast } = useToast()
const loading = ref(false)
const rows = ref<WorkspaceConfig[]>([])
const total = ref(0)
const dialogOpen = ref(false)
const deleteOpen = ref(false)
const submitLoading = ref(false)
const current = ref<WorkspaceConfig | null>(null)
const roles = ref<WorkspaceRoleOption[]>([])
const menus = ref<WorkspaceMenuOption[]>([])

const query = reactive({ pageNum: 1, pageSize: 20, roleKey: '', status: undefined as string | undefined })
const form = reactive({
  configId: '',
  roleKey: '',
  defaultPath: '/dashboard',
  dashboardPath: '/dashboard',
  defaultOpenMenu: '__none__',
  menuScope: 'all',
  status: '0',
  remark: '',
})

const dialogTitle = computed(() => (form.configId ? '修改工作台配置' : '新增工作台配置'))
const pathOptions = computed(() => {
  const configured = menus.value.map((item) => ({ label: `${item.menuName}（${item.path}）`, value: item.path }))
  const fixed = [
    { label: '系统仪表盘（/dashboard）', value: '/dashboard' },
    { label: '我的 Bug（/bug/my）', value: '/bug/my' },
    { label: 'Bug 看板（/bug/statistics）', value: '/bug/statistics' },
  ]
  return uniqueByValue([...fixed, ...configured].filter((item) => item.value && item.value !== '/'))
})
const menuOptions = computed(() => menus.value.filter((item) => item.menuType === 'M'))

async function loadOptions() {
  const [roleList, menuList] = await Promise.all([workspaceRoleOptions(), workspaceMenuOptions()])
  roles.value = roleList
  menus.value = menuList
}

async function getList() {
  loading.value = true
  try {
    const result = await listWorkspaceConfig(query)
    rows.value = result.rows
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.pageNum = 1
  void getList()
}

function resetQuery() {
  query.roleKey = ''
  query.status = undefined
  handleSearch()
}

function resetForm() {
  Object.assign(form, {
    configId: '',
    roleKey: '',
    defaultPath: '/dashboard',
    dashboardPath: '/dashboard',
    defaultOpenMenu: '__none__',
    menuScope: 'all',
    status: '0',
    remark: '',
  })
}

function handleAdd() {
  resetForm()
  dialogOpen.value = true
}

async function handleEdit(row: WorkspaceConfig) {
  resetForm()
  const detail = await getWorkspaceConfig(row.configId)
  Object.assign(form, {
    configId: detail.configId,
    roleKey: detail.roleKey,
    defaultPath: detail.defaultPath,
    dashboardPath: detail.dashboardPath || detail.defaultPath,
    defaultOpenMenu: detail.defaultOpenMenu || '__none__',
    menuScope: detail.menuScope,
    status: detail.status,
    remark: detail.remark || '',
  })
  dialogOpen.value = true
}

function handleDelete(row: WorkspaceConfig) {
  current.value = row
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!current.value) return
  await delWorkspaceConfig([current.value.configId])
  toast({ title: '删除成功', description: '工作台配置已删除' })
  deleteOpen.value = false
  await getList()
}

async function submit() {
  if (!form.roleKey || !form.defaultPath) {
    toast({ title: '验证失败', description: '角色和默认首页不能为空', variant: 'destructive' })
    return
  }
  submitLoading.value = true
  try {
    const payload = {
      ...form,
      dashboardPath: form.dashboardPath || form.defaultPath,
      defaultOpenMenu: form.defaultOpenMenu === '__none__' ? null : form.defaultOpenMenu,
    }
    if (form.configId) await updateWorkspaceConfig(payload)
    else await addWorkspaceConfig(payload)
    toast({ title: '保存成功', description: '工作台配置已更新' })
    dialogOpen.value = false
    await getList()
  } finally {
    submitLoading.value = false
  }
}

function roleName(roleKey: string) {
  return roles.value.find((item) => item.roleKey === roleKey)?.roleName || roleKey
}

function menuScopeLabel(value: string) {
  return value === 'business' ? '业务优先' : value === 'custom' ? '自定义' : '全部菜单'
}

function uniqueByValue<T extends { value: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.value, item])).values()]
}

onMounted(async () => {
  await loadOptions()
  await getList()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">工作台配置</h2>
        <p class="text-muted-foreground">配置不同角色登录首页、仪表盘替代页面和默认展开菜单。</p>
      </div>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getList" />
        <Button v-hasPermi="['system:workspace:add']" @click="handleAdd"><Plus class="mr-2 h-4 w-4" />新增</Button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
      <Input v-model="query.roleKey" placeholder="角色标识" class="w-48" @keyup.enter="handleSearch" />
      <Select v-model="query.status">
        <SelectTrigger class="w-32"><SelectValue placeholder="状态" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="0">启用</SelectItem>
          <SelectItem value="1">停用</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" @click="handleSearch"><Search class="mr-2 h-4 w-4" />查询</Button>
      <Button variant="ghost" @click="resetQuery">重置</Button>
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>角色</TableHead>
            <TableHead>默认首页</TableHead>
            <TableHead>仪表盘替代</TableHead>
            <TableHead>默认展开菜单</TableHead>
            <TableHead>菜单策略</TableHead>
            <TableHead>状态</TableHead>
            <TableHead class="w-32">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in rows" :key="row.configId">
            <TableCell><div class="font-medium">{{ row.roleName || roleName(row.roleKey) }}</div><div class="text-xs text-muted-foreground">{{ row.roleKey }}</div></TableCell>
            <TableCell><Badge variant="outline">{{ row.defaultPath }}</Badge></TableCell>
            <TableCell><Badge variant="secondary">{{ row.dashboardPath || row.defaultPath }}</Badge></TableCell>
            <TableCell>{{ row.defaultOpenMenu || '-' }}</TableCell>
            <TableCell>{{ menuScopeLabel(row.menuScope) }}</TableCell>
            <TableCell><Badge :variant="row.status === '0' ? 'default' : 'secondary'">{{ row.status === '0' ? '启用' : '停用' }}</Badge></TableCell>
            <TableCell>
              <div class="flex gap-2">
                <Button v-hasPermi="['system:workspace:edit']" size="sm" variant="outline" @click="handleEdit(row)"><Edit class="h-4 w-4" /></Button>
                <Button v-hasPermi="['system:workspace:remove']" size="sm" variant="destructive" @click="handleDelete(row)"><Trash2 class="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <EmptyState v-if="!loading && !rows.length" title="暂无工作台配置" />
    </div>

    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />

    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{{ dialogTitle }}</DialogTitle><DialogDescription>系统会按用户角色匹配第一条启用配置。</DialogDescription></DialogHeader>
        <div class="grid gap-4 py-2 md:grid-cols-2">
          <div class="grid gap-2"><Label>角色 *</Label><Select v-model="form.roleKey"><SelectTrigger><SelectValue placeholder="选择角色" /></SelectTrigger><SelectContent><SelectItem v-for="role in roles" :key="role.roleKey" :value="role.roleKey">{{ role.roleName }}（{{ role.roleKey }}）</SelectItem></SelectContent></Select></div>
          <div class="grid gap-2"><Label>状态</Label><Select v-model="form.status"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">启用</SelectItem><SelectItem value="1">停用</SelectItem></SelectContent></Select></div>
          <div class="grid gap-2"><Label>默认首页 *</Label><Select v-model="form.defaultPath"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="item in pathOptions" :key="item.value" :value="item.value">{{ item.label }}</SelectItem></SelectContent></Select></div>
          <div class="grid gap-2"><Label>仪表盘替代</Label><Select v-model="form.dashboardPath"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="item in pathOptions" :key="item.value" :value="item.value">{{ item.label }}</SelectItem></SelectContent></Select></div>
          <div class="grid gap-2"><Label>默认展开菜单</Label><Select v-model="form.defaultOpenMenu"><SelectTrigger><SelectValue placeholder="不指定" /></SelectTrigger><SelectContent><SelectItem value="__none__">不指定</SelectItem><SelectItem v-for="item in menuOptions" :key="item.menuId" :value="item.path">{{ item.menuName }}（{{ item.path }}）</SelectItem></SelectContent></Select></div>
          <div class="grid gap-2"><Label>菜单策略</Label><Select v-model="form.menuScope"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部菜单</SelectItem><SelectItem value="business">业务优先</SelectItem><SelectItem value="custom">自定义</SelectItem></SelectContent></Select></div>
          <div class="grid gap-2 md:col-span-2"><Label>备注</Label><Textarea v-model="form.remark" placeholder="配置说明" /></div>
        </div>
        <DialogFooter><Button variant="outline" @click="dialogOpen = false">取消</Button><Button :disabled="submitLoading" @click="submit">保存</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDialog v-model:open="deleteOpen" title="删除工作台配置" :description="`确定删除 ${current?.roleName || current?.roleKey} 的工作台配置吗？`" @confirm="confirmDelete" />
  </div>
</template>

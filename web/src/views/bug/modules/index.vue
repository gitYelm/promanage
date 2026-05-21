<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import TablePagination from '@/components/common/TablePagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import FormFieldBlock from '@/components/common/FormFieldBlock.vue'
import { TableFilterPanel } from '@/components/common/table-filter'
import { useToast } from '@/components/ui/toast/use-toast'
import { usePermission } from '@/composables/usePermission'
import { addBugModule, bugProjectOptions, bugUserOptions, deleteBugModules, listBugModules, updateBugModule } from '@/api/bug'
import type { BugModule, BugProject, BugUserRef } from '@/api/bug/types'
import { toggleTableSort } from '@/utils/table-sort'
import { ALL_OPTION_VALUE, NONE_OPTION_VALUE, normalizeAll, normalizeOptional } from '../shared/bug-options'

const { toast } = useToast()
const loading = ref(false)
const rows = ref<BugModule[]>([])
const projects = ref<BugProject[]>([])
const users = ref<BugUserRef[]>([])
const total = ref(0)
const open = ref(false)
const query = reactive({ pageNum: 1, pageSize: 20, projectId: ALL_OPTION_VALUE, keyword: '', status: ALL_OPTION_VALUE, sortBy: '', sortOrder: '' as 'asc' | 'desc' | '' })
const form = reactive<Partial<BugModule>>({ projectId: '', moduleName: '', defaultAssigneeId: NONE_OPTION_VALUE, orderNum: 0, status: '0' })
const canSave = computed(() => Boolean(form.projectId && form.moduleName))
const canShowOperationColumn = usePermission(['bug:module:edit', 'bug:module:remove'])

async function getList() {
  loading.value = true
  try {
    const res = await listBugModules({ ...query, projectId: normalizeAll(query.projectId), status: normalizeAll(query.status) })
    rows.value = res.rows
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function searchList() {
  query.pageNum = 1
  getList()
}

function handleSort(key: string) {
  toggleTableSort(query, key)
  getList()
}

function resetQuery() {
  Object.assign(query, { pageNum: 1, pageSize: query.pageSize, projectId: ALL_OPTION_VALUE, keyword: '', status: ALL_OPTION_VALUE, sortBy: '', sortOrder: '' })
  getList()
}

async function refreshAssignableUsers(projectId = form.projectId) {
  users.value = projectId ? await bugUserOptions('', { projectId, assignContext: 'moduleAssignee', assignableOnly: true }) : []
}

function add() {
  Object.assign(form, {
    moduleId: undefined,
    projectId: normalizeAll(query.projectId) || projects.value[0]?.projectId || '',
    moduleName: '',
    orderNum: 0,
    status: '0',
    defaultAssigneeId: NONE_OPTION_VALUE,
  })
  refreshAssignableUsers()
  open.value = true
}

function edit(row: BugModule) {
  Object.assign(form, row, { defaultAssigneeId: row.defaultAssigneeId || NONE_OPTION_VALUE })
  refreshAssignableUsers(row.projectId)
  open.value = true
}

async function save() {
  const payload = { ...form, defaultAssigneeId: normalizeOptional(form.defaultAssigneeId) }
  form.moduleId ? await updateBugModule(payload) : await addBugModule(payload)
  toast({ title: '保存成功' })
  open.value = false
  getList()
}

async function remove(row: BugModule) {
  await deleteBugModules([row.moduleId])
  toast({ title: '删除成功' })
  getList()
}

onMounted(async () => {
  projects.value = await bugProjectOptions()
  await getList()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">模块管理</h2>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getList" />
        <Button v-hasPermi="['bug:module:add']" @click="add">新增模块</Button>
      </div>
    </div>
    <TableFilterPanel description="默认展示所属项目和模块名称，展开后可按模块状态完整筛选。">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-1">
          <label for="bug-module-filter-project" class="text-sm font-medium">所属项目</label>
          <Select v-model="query.projectId"><SelectTrigger id="bug-module-filter-project"><SelectValue placeholder="全部项目" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select>
        </div>
        <div class="space-y-1">
          <label for="bug-module-filter-keyword" class="text-sm font-medium">模块名称</label>
          <Input id="bug-module-filter-keyword" v-model="query.keyword" placeholder="模块名称" @keyup.enter="searchList" />
        </div>
        <div class="flex items-end gap-2">
          <Button data-permission-neutral @click="searchList">搜索</Button>
          <Button variant="outline" data-permission-neutral @click="resetQuery">重置</Button>
        </div>
      </div>
      <template #expanded>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="space-y-1">
            <label for="bug-module-filter-status" class="text-sm font-medium">模块状态</label>
            <Select v-model="query.status">
              <SelectTrigger id="bug-module-filter-status"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部状态</SelectItem><SelectItem value="0">启用</SelectItem><SelectItem value="1">停用</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </template>
    </TableFilterPanel>
    <div class="rounded-md border">
      <Table><TableHeader><TableRow><SortableTableHead label="项目" sort-key="projectId" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead label="模块" sort-key="moduleName" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead label="排序" sort-key="orderNum" align="right" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead label="状态" sort-key="status" align="center" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><TableHead v-if="canShowOperationColumn" class="text-right">操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.moduleId"><TableCell>{{ row.project?.projectName }}</TableCell><TableCell>{{ row.moduleName }}</TableCell><TableCell class="text-right tabular-nums">{{ row.orderNum }}</TableCell><TableCell class="text-center"><StatusBadge domain="enabled" :value="row.status" /></TableCell><TableCell v-if="canShowOperationColumn" class="text-right"><div class="flex justify-end gap-2"><Button v-hasPermi="['bug:module:edit']" size="sm" variant="outline" @click="edit(row)">编辑</Button><Button v-hasPermi="['bug:module:remove']" size="sm" variant="destructive" @click="remove(row)">删除</Button></div></TableCell></TableRow></TableBody></Table>
      <EmptyState v-if="!rows.length" />
    </div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ form.moduleId ? '编辑模块' : '新增模块' }}</DialogTitle>
          <DialogDescription>模块用于归类 Bug 和设置默认处理人；带 * 的字段为必填。</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <FormFieldBlock label="所属项目" field-id="bug-module-project" required description="决定模块归属和默认负责人候选范围，切换项目会重置默认负责人。">
            <Select v-model="form.projectId" @update:model-value="(v) => { form.projectId = String(v); form.defaultAssigneeId = NONE_OPTION_VALUE; refreshAssignableUsers(form.projectId) }">
              <SelectTrigger id="bug-module-project"><SelectValue placeholder="请选择所属项目" /></SelectTrigger>
              <SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent>
            </Select>
          </FormFieldBlock>
          <FormFieldBlock label="模块名称" field-id="bug-module-name" required description="建议使用用户能理解的业务或功能名称，便于提交 Bug 时选择。">
            <Input id="bug-module-name" v-model="form.moduleName" placeholder="例如：权限管理、需求管理" />
          </FormFieldBlock>
          <FormFieldBlock label="默认负责人" field-id="bug-module-assignee" optional description="提交该模块 Bug 时可自动带默认处理人；暂不指定时不会自动分派。">
            <Select v-model="form.defaultAssigneeId">
              <SelectTrigger id="bug-module-assignee"><SelectValue placeholder="请选择默认负责人" /></SelectTrigger>
              <SelectContent><SelectItem :value="NONE_OPTION_VALUE">暂不指定默认负责人</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent>
            </Select>
          </FormFieldBlock>
          <FormFieldBlock label="排序" field-id="bug-module-order" optional description="数字越小越靠前，用于模块下拉列表和管理页展示顺序。">
            <Input id="bug-module-order" v-model="form.orderNum" type="number" placeholder="例如：0" />
          </FormFieldBlock>
        </div>
        <DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

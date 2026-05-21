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
import { addBugVersion, bugProjectOptions, deleteBugVersions, listBugVersions, updateBugVersion } from '@/api/bug'
import type { BugProject, BugVersion } from '@/api/bug/types'
import { toggleTableSort } from '@/utils/table-sort'
import { ALL_OPTION_VALUE, BUG_VERSION_STATUS_OPTIONS, normalizeAll } from '../shared/bug-options'

const { toast } = useToast()
const loading = ref(false)
const rows = ref<BugVersion[]>([])
const projects = ref<BugProject[]>([])
const total = ref(0)
const open = ref(false)
const query = reactive({ pageNum: 1, pageSize: 20, projectId: ALL_OPTION_VALUE, keyword: '', status: ALL_OPTION_VALUE, sortBy: '', sortOrder: '' as 'asc' | 'desc' | '' })
const form = reactive<Partial<BugVersion>>({ projectId: '', versionNo: '', versionName: '', status: 'planning' })
const canSave = computed(() => Boolean(form.projectId && form.versionNo))
const canShowOperationColumn = usePermission(['bug:version:edit', 'bug:version:remove'])

async function getList() {
  loading.value = true
  try {
    const res = await listBugVersions({ ...query, projectId: normalizeAll(query.projectId), status: normalizeAll(query.status) })
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

function add() {
  Object.assign(form, {
    versionId: undefined,
    projectId: normalizeAll(query.projectId) || projects.value[0]?.projectId || '',
    versionNo: '',
    versionName: '',
    status: 'planning',
  })
  open.value = true
}

function edit(row: BugVersion) {
  Object.assign(form, row)
  open.value = true
}

async function save() {
  form.versionId ? await updateBugVersion(form) : await addBugVersion(form)
  toast({ title: '保存成功' })
  open.value = false
  getList()
}

async function remove(row: BugVersion) {
  await deleteBugVersions([row.versionId])
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
      <h2 class="text-2xl font-bold">版本管理</h2>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getList" />
        <Button v-hasPermi="['bug:version:add']" @click="add">新增版本</Button>
      </div>
    </div>
    <TableFilterPanel description="默认展示所属项目和版本关键词，展开后可按版本状态完整筛选。">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-1">
          <label for="bug-version-filter-project" class="text-sm font-medium">所属项目</label>
          <Select v-model="query.projectId"><SelectTrigger id="bug-version-filter-project"><SelectValue placeholder="全部项目" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select>
        </div>
        <div class="space-y-1">
          <label for="bug-version-filter-keyword" class="text-sm font-medium">关键词</label>
          <Input id="bug-version-filter-keyword" v-model="query.keyword" placeholder="版本号/名称" @keyup.enter="searchList" />
        </div>
        <div class="flex items-end gap-2">
          <Button data-permission-neutral @click="searchList">搜索</Button>
          <Button variant="outline" data-permission-neutral @click="resetQuery">重置</Button>
        </div>
      </div>
      <template #expanded>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="space-y-1">
            <label for="bug-version-filter-status" class="text-sm font-medium">版本状态</label>
            <Select v-model="query.status">
              <SelectTrigger id="bug-version-filter-status"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem :value="ALL_OPTION_VALUE">全部状态</SelectItem>
                <SelectItem v-for="item in BUG_VERSION_STATUS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </template>
    </TableFilterPanel>
    <div class="rounded-md border">
      <Table><TableHeader><TableRow><SortableTableHead label="项目" sort-key="projectId" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead label="版本号" sort-key="versionNo" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead label="版本名" sort-key="versionName" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead label="状态" sort-key="status" align="center" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><TableHead v-if="canShowOperationColumn" class="text-right">操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.versionId"><TableCell>{{ row.project?.projectName }}</TableCell><TableCell>{{ row.versionNo }}</TableCell><TableCell>{{ row.versionName }}</TableCell><TableCell class="text-center"><StatusBadge domain="bugVersion" :value="row.status" /></TableCell><TableCell v-if="canShowOperationColumn" class="text-right"><div class="flex justify-end gap-2"><Button v-hasPermi="['bug:version:edit']" size="sm" variant="outline" @click="edit(row)">编辑</Button><Button v-hasPermi="['bug:version:remove']" size="sm" variant="destructive" @click="remove(row)">删除</Button></div></TableCell></TableRow></TableBody></Table>
      <EmptyState v-if="!rows.length" />
    </div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ form.versionId ? '编辑版本' : '新增版本' }}</DialogTitle>
          <DialogDescription>版本用于标记 Bug 发现或修复范围；带 * 的字段为必填。</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <FormFieldBlock label="所属项目" field-id="bug-version-project" required description="决定版本归属，提交或筛选 Bug 时将按项目展示对应版本。">
            <Select v-model="form.projectId">
              <SelectTrigger id="bug-version-project"><SelectValue placeholder="请选择所属项目" /></SelectTrigger>
              <SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent>
            </Select>
          </FormFieldBlock>
          <FormFieldBlock label="版本号" field-id="bug-version-no" required description="用于唯一识别版本，建议与发布或测试版本命名保持一致。">
            <Input id="bug-version-no" v-model="form.versionNo" placeholder="例如：v1.3.0" />
          </FormFieldBlock>
          <FormFieldBlock label="版本名称" field-id="bug-version-name" optional description="用于补充版本主题或发布目标，便于非技术用户理解。">
            <Input id="bug-version-name" v-model="form.versionName" placeholder="例如：移动端体验优化版本" />
          </FormFieldBlock>
          <FormFieldBlock label="版本状态" field-id="bug-version-status" description="规划中、测试中、已发布和归档会影响列表识别与后续版本管理。">
            <Select v-model="form.status">
              <SelectTrigger id="bug-version-status"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem v-for="item in BUG_VERSION_STATUS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</SelectItem></SelectContent>
            </Select>
          </FormFieldBlock>
        </div>
        <DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

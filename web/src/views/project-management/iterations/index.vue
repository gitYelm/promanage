<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import TableColumnSettingsButton from '@/components/common/TableColumnSettingsButton.vue'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import { FilterRangeField, TableFilterPanel } from '@/components/common/table-filter'
import EmptyState from '@/components/common/EmptyState.vue'
import ProjectBadge from '@/components/common/ProjectBadge.vue'
import ProjectSelectOption from '@/components/common/ProjectSelectOption.vue'
import ProjectSelectValue from '@/components/common/ProjectSelectValue.vue'
import SemanticActionButton from '@/components/common/SemanticActionButton.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { hasAnyPermission, usePermission } from '@/composables/usePermission'
import { addIteration, deleteIterations, listIterations, runIterationAction, updateIteration } from '@/api/project-management'
import { bugProjectOptions, bugUserOptions } from '@/api/bug'
import type { Iteration, IterationForm } from '@/api/project-management/types'
import type { BugProject, BugUserRef } from '@/api/bug/types'
import { PM_ALL_OPTION_VALUE, PM_ITERATION_ACTION_OPTIONS, PM_ITERATION_STATUS_OPTIONS, PM_NONE_OPTION_VALUE, formatDate, pmAvailableActions, pmNormalizeAll, pmNormalizeOptional, toDateInput } from '../shared/options'
import { toLocalDateBoundaryIso } from '@/utils/table-filter'
import { toggleTableSort } from '@/utils/table-sort'
import { useIterationColumns } from './iteration-columns'

const { toast } = useToast()
const { columns, visibleColumnMap, toggleColumn, resetColumns } = useIterationColumns()
const loading = ref(false); const open = ref(false); const rows = ref<Iteration[]>([]); const total = ref(0)
const projects = ref<BugProject[]>([]); const users = ref<BugUserRef[]>([])
const query = reactive({ pageNum: 1, pageSize: 20, keyword: '', projectId: PM_ALL_OPTION_VALUE, status: PM_ALL_OPTION_VALUE, ownerId: PM_ALL_OPTION_VALUE, startDateStart: '', startDateEnd: '', endDateStart: '', endDateEnd: '', sortBy: '', sortOrder: '' as 'asc' | 'desc' | '' })
const form = reactive<IterationForm>({ projectId: '', iterationName: '', status: 'planned', ownerId: PM_NONE_OPTION_VALUE })
const canSave = computed(() => Boolean(form.projectId && form.iterationName))
const canShowQuickActionColumn = usePermission(['pm:iteration:manage'])
const canShowOperationColumn = usePermission(['pm:iteration:manage'])

async function getList() {
  loading.value = true
  try {
    const res = await listIterations({ ...query, projectId: pmNormalizeAll(query.projectId), status: pmNormalizeAll(query.status), ownerId: pmNormalizeAll(query.ownerId), startDateStart: toLocalDateBoundaryIso(query.startDateStart, 'start'), startDateEnd: toLocalDateBoundaryIso(query.startDateEnd, 'end'), endDateStart: toLocalDateBoundaryIso(query.endDateStart, 'start'), endDateEnd: toLocalDateBoundaryIso(query.endDateEnd, 'end') })
    rows.value = res.rows; total.value = res.total
  } finally { loading.value = false }
}
function searchList() { query.pageNum = 1; getList() }
function resetQuery() { Object.assign(query, { pageNum: 1, pageSize: query.pageSize, keyword: '', projectId: PM_ALL_OPTION_VALUE, status: PM_ALL_OPTION_VALUE, ownerId: PM_ALL_OPTION_VALUE, startDateStart: '', startDateEnd: '', endDateStart: '', endDateEnd: '', sortBy: '', sortOrder: '' }); getList() }
function handleSort(key: string) { toggleTableSort(query, key); getList() }
function add() { Object.assign(form, { iterationId: undefined, projectId: projects.value[0]?.projectId || '', iterationName: '', goal: '', status: 'planned', ownerId: PM_NONE_OPTION_VALUE, startDate: '', endDate: '', summary: '', riskNote: '' }); refreshAssignableUsers(); open.value = true }
function edit(row: Iteration) { Object.assign(form, row, { ownerId: row.ownerId || PM_NONE_OPTION_VALUE, startDate: toDateInput(row.startDate), endDate: toDateInput(row.endDate) }); refreshAssignableUsers(row.projectId); open.value = true }
async function save() { const payload = { ...form, ownerId: pmNormalizeOptional(form.ownerId) }; form.iterationId ? await updateIteration(payload) : await addIteration(payload); toast({ title: '迭代已保存' }); open.value = false; getList() }
async function remove(row: Iteration) { await deleteIterations([row.iterationId]); toast({ title: '迭代已删除' }); getList() }
async function action(row: Iteration, act: string) { await runIterationAction(row.iterationId, act); toast({ title: '迭代状态已更新' }); getList() }
function quickActions(row: Iteration) { return pmAvailableActions(PM_ITERATION_ACTION_OPTIONS, row.status).filter((item) => !item.permissions || hasAnyPermission(item.permissions)) }
async function refreshAssignableUsers(projectId = form.projectId) { users.value = projectId ? await bugUserOptions('', { projectId, assignContext: 'iterationOwner', assignableOnly: true }) : [] }

onMounted(async () => { projects.value = await bugProjectOptions(); await getList() })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between"><div><h2 class="text-2xl font-bold">迭代计划</h2><p class="text-sm text-muted-foreground">管理项目短周期交付目标、范围、负责人和状态流转。</p></div><div class="flex gap-2"><Button v-hasPermi="['pm:iteration:manage']" @click="add">新增迭代</Button><TableColumnSettingsButton :columns="columns" @toggle="toggleColumn" @reset="resetColumns" /><TableRefreshIconButton :loading="loading" @refresh="getList" /></div></div>
    <TableFilterPanel description="默认展示迭代名称、项目和状态，展开后可按负责人和周期范围完整筛选。">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-1"><label for="iteration-filter-keyword" class="text-sm font-medium">迭代名称</label><Input id="iteration-filter-keyword" v-model="query.keyword" placeholder="迭代名称" @keyup.enter="searchList" /></div>
        <div class="space-y-1"><label for="iteration-filter-project" class="text-sm font-medium">所属项目</label><Select v-model="query.projectId"><SelectTrigger id="iteration-filter-project"><ProjectSelectValue :model-value="query.projectId" :projects="projects" :all-value="PM_ALL_OPTION_VALUE" /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId"><ProjectSelectOption :name="p.projectName" :code="p.projectKey" :stage="p.projectStage" :owner-name="p.owner?.nickName || p.owner?.userName" /></SelectItem></SelectContent></Select></div>
        <div class="space-y-1"><label for="iteration-filter-status" class="text-sm font-medium">状态</label><Select v-model="query.status"><SelectTrigger id="iteration-filter-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部状态</SelectItem><SelectItem v-for="s in PM_ITERATION_STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</SelectItem></SelectContent></Select></div>
        <div class="flex items-end gap-2"><Button data-permission-neutral @click="searchList">搜索</Button><Button variant="outline" data-permission-neutral @click="resetQuery">重置</Button></div>
      </div>
      <template #expanded>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div class="space-y-1"><label for="iteration-filter-owner" class="text-sm font-medium">负责人</label><Select v-model="query.ownerId"><SelectTrigger id="iteration-filter-owner"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部负责人</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select></div>
          <FilterRangeField v-model:start="query.startDateStart" v-model:end="query.startDateEnd" label="开始日期" />
          <FilterRangeField v-model:start="query.endDateStart" v-model:end="query.endDateEnd" label="结束日期" />
        </div>
      </template>
    </TableFilterPanel>
    <div class="rounded-md border"><Table><TableHeader><TableRow><SortableTableHead v-if="visibleColumnMap.iterationName" label="迭代" sort-key="iterationName" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead v-if="visibleColumnMap.project" label="项目" sort-key="projectId" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead v-if="visibleColumnMap.owner" label="负责人" sort-key="ownerId" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead v-if="visibleColumnMap.dateRange" label="周期" sort-key="endDate" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead v-if="visibleColumnMap.status" label="状态" sort-key="status" align="center" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><TableHead v-if="visibleColumnMap.riskNote">风险</TableHead><TableHead v-if="canShowQuickActionColumn && visibleColumnMap.quickActions" class="min-w-48 text-left">快捷操作</TableHead><TableHead v-if="canShowOperationColumn && visibleColumnMap.actions" class="w-36 text-right">操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.iterationId"><TableCell v-if="visibleColumnMap.iterationName"><div class="font-medium">{{ row.iterationName }}</div><div class="text-xs text-muted-foreground">{{ row.goal || '-' }}</div></TableCell><TableCell v-if="visibleColumnMap.project"><ProjectBadge :name="row.project?.projectName" :code="row.project?.projectKey" /></TableCell><TableCell v-if="visibleColumnMap.owner">{{ row.owner?.nickName || '-' }}</TableCell><TableCell v-if="visibleColumnMap.dateRange">{{ formatDate(row.startDate) }} - {{ formatDate(row.endDate) }}</TableCell><TableCell v-if="visibleColumnMap.status" class="text-center"><StatusBadge domain="iteration" :value="row.status" /></TableCell><TableCell v-if="visibleColumnMap.riskNote" class="max-w-48 truncate">{{ row.riskNote || '-' }}</TableCell><TableCell v-if="canShowQuickActionColumn && visibleColumnMap.quickActions"><div v-if="quickActions(row).length" class="flex flex-wrap gap-2"><SemanticActionButton v-for="item in quickActions(row)" :key="item.action" :permissions="item.permissions" :action="item.action" @click="action(row, item.action)">{{ item.label }}</SemanticActionButton></div><span v-else class="text-sm text-muted-foreground">-</span></TableCell><TableCell v-if="canShowOperationColumn && visibleColumnMap.actions" class="text-right"><div class="flex justify-end gap-2"><Button v-hasPermi="['pm:iteration:manage']" size="sm" variant="outline" @click="edit(row)">编辑</Button><Button v-hasPermi="['pm:iteration:manage']" size="sm" variant="destructive" @click="remove(row)">删除</Button></div></TableCell></TableRow></TableBody></Table><EmptyState v-if="!rows.length" /></div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ form.iterationId ? '编辑迭代' : '新增迭代' }}</DialogTitle>
          <DialogDescription>请补充迭代目标、负责人和周期；带 * 的字段为必填。</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="iteration-project">所属项目 <span class="text-destructive">*</span></Label>
            <Select v-model="form.projectId" @update:model-value="(v) => { form.projectId = String(v); form.ownerId = PM_NONE_OPTION_VALUE; refreshAssignableUsers(form.projectId) }">
              <SelectTrigger id="iteration-project"><ProjectSelectValue :model-value="form.projectId" :projects="projects" placeholder="请选择所属项目" /></SelectTrigger>
              <SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId"><ProjectSelectOption :name="p.projectName" :code="p.projectKey" :stage="p.projectStage" :owner-name="p.owner?.nickName || p.owner?.userName" /></SelectItem></SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">决定迭代归属和负责人候选范围，切换项目会重置负责人。</p>
          </div>
          <div class="space-y-2">
            <Label for="iteration-owner">迭代负责人（可选）</Label>
            <Select v-model="form.ownerId">
              <SelectTrigger id="iteration-owner"><SelectValue placeholder="请选择迭代负责人" /></SelectTrigger>
              <SelectContent><SelectItem :value="PM_NONE_OPTION_VALUE">暂不指定迭代负责人</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">负责迭代推进、范围协调和风险同步；暂不指定表示稍后补齐。</p>
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="iteration-name">迭代名称 <span class="text-destructive">*</span></Label>
            <Input id="iteration-name" v-model="form.iterationName" placeholder="例如：5 月后台管理优化迭代" />
            <p class="text-xs text-muted-foreground">建议包含时间或目标范围，方便列表和看板识别。</p>
          </div>
          <div class="space-y-2">
            <Label for="iteration-start">开始日期（可选）</Label>
            <Input id="iteration-start" v-model="form.startDate" type="date" />
            <p class="text-xs text-muted-foreground">用于迭代周期统计和进度判断；不确定时可先留空。</p>
          </div>
          <div class="space-y-2">
            <Label for="iteration-end">结束日期（可选）</Label>
            <Input id="iteration-end" v-model="form.endDate" type="date" />
            <p class="text-xs text-muted-foreground">用于判断迭代是否延期和统计交付节奏。</p>
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="iteration-goal">迭代目标（可选）</Label>
            <Textarea id="iteration-goal" v-model="form.goal" placeholder="描述本迭代要达成的业务目标" />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="iteration-summary">范围说明（可选）</Label>
            <Textarea id="iteration-summary" v-model="form.summary" placeholder="描述纳入和不纳入本迭代的范围" />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="iteration-risk">风险说明（可选）</Label>
            <Textarea id="iteration-risk" v-model="form.riskNote" placeholder="记录延期、资源、质量或依赖风险" />
          </div>
        </div>
        <DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

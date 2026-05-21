<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast/use-toast'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TableColumnSettingsButton from '@/components/common/TableColumnSettingsButton.vue'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import FormFieldBlock from '@/components/common/FormFieldBlock.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import ProjectBadge from '@/components/common/ProjectBadge.vue'
import SemanticTag from '@/components/common/SemanticTag.vue'
import SemanticActionButton from '@/components/common/SemanticActionButton.vue'
import SeverityBadge from '@/components/common/SeverityBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import { formatDate } from '@/utils/format'
import { normalizeAllOption } from '@/utils/table-filter'
import { toggleTableSort } from '@/utils/table-sort'
import { usePermission } from '@/composables/usePermission'
import { bugProjectOptions, bugUserOptions, getBugTicket, listBugModules, listBugTickets, runBugAction, updateBugTicket } from '@/api/bug'
import { BUG_LIST_STALE_EVENT, BUG_TICKET_OPEN_EVENT, dispatchBugPendingCountRefresh, type BugTicketOpenEventDetail } from '../shared/bug-events'
import type { BugActionOption, BugModule, BugProject, BugTicket, BugUserRef } from '@/api/bug/types'
import { BUG_ENVIRONMENT_OPTIONS, BUG_PRIORITY_OPTIONS, BUG_SEVERITY_OPTIONS, BUG_TYPE_OPTIONS } from '../shared/bug-options'
import BugQuickActions from './components/BugQuickActions.vue'
import BugTicketDetailDialog from './components/BugTicketDetailDialog.vue'
import BugTicketFilters from './components/BugTicketFilters.vue'
import DuplicateBugSelector from './components/DuplicateBugSelector.vue'
import { buildBugTicketListQuery, createBugTicketFilterState } from './bug-ticket-query'
import { useBugTicketColumns } from './ticket-columns'

const route = useRoute()
const { toast } = useToast()
const { columns, visibleColumnMap, toggleColumn, resetColumns } = useBugTicketColumns()
const loading = ref(false)
const total = ref(0)
const rows = ref<BugTicket[]>([])
const projects = ref<BugProject[]>([])
const modules = ref<BugModule[]>([])
const users = ref<BugUserRef[]>([])
const developerUsers = ref<BugUserRef[]>([])
const detail = ref<BugTicket | null>(null)
const showDetail = ref(false)
const showAction = ref(false)
const currentAction = ref<BugActionOption | null>(null)
const editOpen = ref(false)
const listStale = ref(false)
const isMyPage = computed(() => route.path === '/bug/my')
const canShowQuickActionColumn = usePermission([
  'bug:ticket:assign',
  'bug:ticket:changeStatus',
  'bug:ticket:confirm',
  'bug:ticket:reject',
  'bug:ticket:startFix',
  'bug:ticket:submitVerify',
  'bug:ticket:verify',
  'bug:ticket:close',
  'bug:ticket:reopen',
])
const canShowOperationColumn = usePermission(['bug:ticket:query'])
const query = reactive(createBugTicketFilterState())
const actionForm = reactive({ remark: '', assigneeId: '', dueTime: '', duplicateOfId: '' })
const editForm = reactive({ ticketId: '', title: '', type: '', severity: '', priority: '', description: '', reproduceSteps: '', expectedResult: '', actualResult: '', environment: '', deviceInfo: '' })

async function getList() {
  loading.value = true
  try {
    const res = await listBugTickets(buildBugTicketListQuery(query, { mine: isMyPage.value }))
    rows.value = res.rows
    total.value = res.total
    listStale.value = false
  } finally {
    loading.value = false
  }
}

async function loadModules() {
  const projectId = normalizeAllOption(query.projectId)
  if (!projectId) {
    modules.value = []
    query.moduleId = createBugTicketFilterState(query.pageSize).moduleId
    return
  }
  const res = await listBugModules({ projectId, pageNum: 1, pageSize: 100 })
  modules.value = res.rows
  query.moduleId = createBugTicketFilterState(query.pageSize).moduleId
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
  Object.assign(query, createBugTicketFilterState(query.pageSize))
  modules.value = []
  getList()
}

async function openDetail(row: BugTicket | string) {
  const ticketId = typeof row === 'string' ? row : row.ticketId
  detail.value = await getBugTicket(ticketId)
  showDetail.value = true
}

async function openAction(action: BugActionOption, row?: BugTicket) {
  if (row) detail.value = row.availableActions ? row : await getBugTicket(row.ticketId)
  if (!detail.value) return
  currentAction.value = action
  Object.assign(actionForm, { remark: '', assigneeId: detail.value.assigneeId || '', dueTime: '', duplicateOfId: '' })
  if (action.action === 'assign') {
    developerUsers.value = await bugUserOptions('', { projectId: detail.value.projectId, assignContext: 'bugAssignee', assignableOnly: true })
  }
  showAction.value = true
}


function openEdit() {
  if (!detail.value) return
  Object.assign(editForm, {
    ticketId: detail.value.ticketId,
    title: detail.value.title,
    type: detail.value.type,
    severity: detail.value.severity,
    priority: detail.value.priority,
    description: detail.value.description,
    reproduceSteps: detail.value.reproduceSteps,
    expectedResult: detail.value.expectedResult,
    actualResult: detail.value.actualResult,
    environment: detail.value.environment || 'testing',
    deviceInfo: detail.value.deviceInfo || '',
  })
  editOpen.value = true
}

async function submitEdit() {
  await updateBugTicket(editForm)
  toast({ title: '保存成功', description: 'Bug 信息已更新' })
  editOpen.value = false
  detail.value = await getBugTicket(editForm.ticketId)
  getList()
}

async function submitAction() {
  if (!detail.value || !currentAction.value) return
  if (currentAction.value.action === 'assign' && !actionForm.assigneeId) {
    toast({ title: '请选择开发负责人', description: '分派 Bug 前需要选择当前项目的开发人员', variant: 'destructive' })
    return
  }
  if (currentAction.value.action === 'duplicate' && !actionForm.duplicateOfId) {
    toast({ title: '请选择原 Bug', description: '标记重复前需要先搜索并选择重复的原 Bug', variant: 'destructive' })
    return
  }
  const payload = { ...actionForm }
  if (payload.dueTime) payload.dueTime = new Date(payload.dueTime).toISOString()
  await runBugAction(detail.value.ticketId, currentAction.value.action, payload)
  toast({ title: '操作成功', description: '状态已更新' })
  showAction.value = false
  detail.value = await getBugTicket(detail.value.ticketId)
  getList()
  dispatchBugPendingCountRefresh()
}

function handleListStale() {
  listStale.value = true
}

function handleTicketOpen(event: Event) {
  const detailEvent = event as CustomEvent<BugTicketOpenEventDetail>
  if (detailEvent.detail?.ticketId) void openDetail(detailEvent.detail.ticketId)
}

watch(() => route.path, () => getList())

onMounted(async () => {
  projects.value = await bugProjectOptions()
  users.value = await bugUserOptions()
  window.addEventListener(BUG_LIST_STALE_EVENT, handleListStale)
  window.addEventListener(BUG_TICKET_OPEN_EVENT, handleTicketOpen)
  getList()
  if (typeof route.query.ticketId === 'string') void openDetail(route.query.ticketId)
})

onBeforeUnmount(() => {
  window.removeEventListener(BUG_LIST_STALE_EVENT, handleListStale)
  window.removeEventListener(BUG_TICKET_OPEN_EVENT, handleTicketOpen)
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <div><h2 class="text-2xl font-bold">{{ isMyPage ? '我的缺陷' : '缺陷列表' }}</h2><p class="text-muted-foreground">跟踪缺陷确认、分派、修复和验证闭环。</p></div>
      <div class="flex items-center gap-2">
        <Button permission="bug:ticket:add" as-child><router-link to="/bug/create">提交缺陷</router-link></Button>
        <TableColumnSettingsButton
          :columns="columns"
          @toggle="toggleColumn"
          @reset="resetColumns"
        />
        <TableRefreshIconButton :loading="loading" @refresh="getList" />
      </div>
    </div>
    <Alert v-if="listStale" class="border-primary/30 bg-primary/5">
      <AlertTitle>有新的缺陷动态</AlertTitle>
      <AlertDescription class="flex items-center justify-between gap-3">
        <span>收到新的缺陷通知，点击刷新列表查看最新内容。</span>
        <Button size="sm" @click="getList">刷新列表</Button>
      </AlertDescription>
    </Alert>
    <BugTicketFilters
      :query="query"
      :projects="projects"
      :modules="modules"
      :users="users"
      @project-change="loadModules"
      @search="searchList"
      @reset="resetQuery"
    />
    <TableSkeleton v-if="loading" :rows="5" :columns="10" />
    <div v-else class="rounded-md border"><Table><TableHeader><TableRow><SortableTableHead v-if="visibleColumnMap.ticketNo" label="编号" sort-key="ticketNo" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><TableHead v-if="visibleColumnMap.title">标题</TableHead><SortableTableHead v-if="visibleColumnMap.project" label="项目" sort-key="projectId" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead v-if="visibleColumnMap.module" label="模块" sort-key="moduleId" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead v-if="visibleColumnMap.status" label="状态" sort-key="status" align="center" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead v-if="visibleColumnMap.severity" label="严重" sort-key="severity" align="center" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead v-if="visibleColumnMap.priority" label="优先级" sort-key="priority" align="center" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead v-if="visibleColumnMap.assignee" label="负责人" sort-key="assigneeId" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><SortableTableHead v-if="visibleColumnMap.createTime" label="创建时间" sort-key="createTime" :sort-by="query.sortBy" :sort-order="query.sortOrder" @sort="handleSort" /><TableHead v-if="canShowQuickActionColumn && visibleColumnMap.quickActions" class="min-w-48 text-left">快捷操作</TableHead><TableHead v-if="canShowOperationColumn && visibleColumnMap.actions" class="w-24 text-right">操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.ticketId" :class="{ 'cursor-pointer': canShowOperationColumn }" @click="canShowOperationColumn && openDetail(row)"><TableCell v-if="visibleColumnMap.ticketNo">{{ row.ticketNo }}</TableCell><TableCell v-if="visibleColumnMap.title">{{ row.title }}</TableCell><TableCell v-if="visibleColumnMap.project"><ProjectBadge :name="row.project?.projectName" :code="row.project?.projectKey" /></TableCell><TableCell v-if="visibleColumnMap.module">{{ row.module?.moduleName || '-' }}</TableCell><TableCell v-if="visibleColumnMap.status" class="text-center"><StatusBadge domain="bug" :value="row.status" /></TableCell><TableCell v-if="visibleColumnMap.severity" class="text-center"><SeverityBadge :value="row.severity" /></TableCell><TableCell v-if="visibleColumnMap.priority" class="text-center"><PriorityBadge :value="row.priority" /></TableCell><TableCell v-if="visibleColumnMap.assignee">{{ row.assignee?.nickName || '-' }}</TableCell><TableCell v-if="visibleColumnMap.createTime">{{ formatDate(row.createTime) }}</TableCell><TableCell v-if="canShowQuickActionColumn && visibleColumnMap.quickActions"><BugQuickActions :ticket="row" @run="openAction" /></TableCell><TableCell v-if="canShowOperationColumn && visibleColumnMap.actions" class="text-right"><div class="flex justify-end"><Button size="sm" variant="outline" @click.stop="openDetail(row)">详情</Button></div></TableCell></TableRow></TableBody></Table><EmptyState v-if="!rows.length" title="暂无 Bug" /></div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <BugTicketDetailDialog v-model:open="showDetail" :detail="detail" />
    <Dialog v-model:open="editOpen">
      <DialogContent class="grid max-h-[90vh] max-w-3xl grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0">
        <DialogHeader class="border-b bg-background px-6 py-4 pr-14">
          <DialogTitle>编辑 Bug</DialogTitle>
          <DialogDescription>请更新缺陷基础信息和复现材料，清晰字段有助于后续确认、分派和修复。</DialogDescription>
        </DialogHeader>
        <div class="min-h-0 overflow-y-auto overscroll-contain px-6 py-4"><div class="grid gap-4 md:grid-cols-2">
          <FormFieldBlock label="标题" field-id="bug-edit-title" required class="md:col-span-2" description="用一句话描述问题现象，便于列表中快速识别。">
            <Input id="bug-edit-title" v-model="editForm.title" placeholder="例如：需求管理新增弹窗无法保存" />
          </FormFieldBlock>
          <FormFieldBlock label="类型" field-id="bug-edit-type" description="用于统计缺陷来源和分类处理。">
            <Select v-model="editForm.type"><SelectTrigger id="bug-edit-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select>
          </FormFieldBlock>
          <FormFieldBlock label="运行环境" field-id="bug-edit-environment" description="说明问题出现在哪类环境，便于复现和定位。">
            <Select v-model="editForm.environment"><SelectTrigger id="bug-edit-environment"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_ENVIRONMENT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select>
          </FormFieldBlock>
          <FormFieldBlock label="严重程度" field-id="bug-edit-severity" description="表示对业务和用户的影响程度，会影响处理关注度。">
            <Select v-model="editForm.severity"><SelectTrigger id="bug-edit-severity"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_SEVERITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select>
          </FormFieldBlock>
          <FormFieldBlock label="优先级" field-id="bug-edit-priority" description="表示建议排期顺序，高优先级需要优先关注。">
            <Select v-model="editForm.priority"><SelectTrigger id="bug-edit-priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_PRIORITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select>
          </FormFieldBlock>
          <FormFieldBlock label="问题描述" field-id="bug-edit-description" optional class="md:col-span-2" description="说明问题现象、影响范围和发生频率。">
            <Textarea id="bug-edit-description" v-model="editForm.description" placeholder="例如：点击保存后没有响应，控制台出现接口错误" />
          </FormFieldBlock>
          <FormFieldBlock label="复现步骤" field-id="bug-edit-steps" optional class="md:col-span-2" description="按步骤描述如何稳定复现，便于开发和测试验证。">
            <Textarea id="bug-edit-steps" v-model="editForm.reproduceSteps" placeholder="1. 打开...&#10;2. 点击...&#10;3. 出现..." />
          </FormFieldBlock>
          <FormFieldBlock label="期望结果" field-id="bug-edit-expected" optional description="描述正确情况下用户应该看到或得到的结果。">
            <Textarea id="bug-edit-expected" v-model="editForm.expectedResult" placeholder="例如：保存成功并刷新列表" />
          </FormFieldBlock>
          <FormFieldBlock label="实际结果" field-id="bug-edit-actual" optional description="描述当前真实发生的错误结果，用于和期望结果对比。">
            <Textarea id="bug-edit-actual" v-model="editForm.actualResult" placeholder="例如：弹窗未关闭且数据未保存" />
          </FormFieldBlock>
          <FormFieldBlock label="设备信息" field-id="bug-edit-device" optional class="md:col-span-2" description="记录浏览器、系统、设备或网络信息，便于排查环境相关问题。">
            <Textarea id="bug-edit-device" v-model="editForm.deviceInfo" placeholder="例如：Chrome 版本、macOS、屏幕尺寸或接口环境" />
          </FormFieldBlock>
        </div></div>
        <DialogFooter class="border-t bg-background px-6 py-4"><Button permission="bug:ticket:edit" @click="submitEdit">保存</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="showAction">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>执行操作：{{ currentAction?.label }}</DialogTitle>
          <DialogDescription>操作会推进 Bug 状态流转，请根据当前动作补充必要信息。</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <FormFieldBlock v-if="currentAction?.action === 'assign'" label="开发负责人" field-id="bug-action-assignee" required description="负责当前 Bug 的修复承接，只能选择当前项目可分派的开发人员。">
            <Select v-model="actionForm.assigneeId"><SelectTrigger id="bug-action-assignee"><SelectValue placeholder="请选择开发负责人" /></SelectTrigger><SelectContent><SelectItem v-for="u in developerUsers" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select>
          </FormFieldBlock>
          <FormFieldBlock v-if="currentAction?.action === 'duplicate'" label="重复的原 Bug" required description="选择已存在的原始 Bug，当前 Bug 将作为重复问题关联到它。">
            <DuplicateBugSelector v-model="actionForm.duplicateOfId" :current-ticket-id="detail?.ticketId" />
          </FormFieldBlock>
          <FormFieldBlock v-if="currentAction?.action === 'assign'" label="预计完成时间" field-id="bug-action-due-time" optional description="用于提醒和超期判断；不确定时可先留空，后续再补充。">
            <Input id="bug-action-due-time" v-model="actionForm.dueTime" type="datetime-local" />
          </FormFieldBlock>
          <FormFieldBlock label="操作说明" field-id="bug-action-remark" optional description="建议记录分派原因、修复说明、验证结论或退回原因，便于后续追溯。">
            <Textarea id="bug-action-remark" v-model="actionForm.remark" placeholder="例如：已确认复现，指派给对应模块负责人处理" />
          </FormFieldBlock>
        </div>
        <DialogFooter><Button :permission="currentAction?.permissions" @click="submitAction">确认</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast/use-toast'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import { formatDate } from '@/utils/format'
import { addBugComment, bugProjectOptions, bugUserOptions, getBugTicket, listBugModules, listBugTickets, runBugAction, updateBugTicket } from '@/api/bug'
import { dispatchBugPendingCountRefresh } from '../shared/bug-events'
import type { BugActionOption, BugModule, BugProject, BugTicket, BugUserRef } from '@/api/bug/types'
import { ALL_OPTION_VALUE, BUG_ACTION_LABELS, BUG_ENVIRONMENT_OPTIONS, BUG_PRIORITY_OPTIONS, BUG_SEVERITY_OPTIONS, BUG_STATUS_OPTIONS, BUG_TYPE_OPTIONS, actionLabel, normalizeAll, optionLabel } from '../shared/bug-options'
import AttachmentList from './components/AttachmentList.vue'
import BugQuickActions from './components/BugQuickActions.vue'
import DuplicateBugSelector from './components/DuplicateBugSelector.vue'

const route = useRoute()
const { toast } = useToast()
const loading = ref(false)
const total = ref(0)
const rows = ref<BugTicket[]>([])
const projects = ref<BugProject[]>([])
const modules = ref<BugModule[]>([])
const users = ref<BugUserRef[]>([])
const detail = ref<BugTicket | null>(null)
const showDetail = ref(false)
const showAction = ref(false)
const currentAction = ref<BugActionOption | null>(null)
const editOpen = ref(false)
const isMyPage = computed(() => route.path === '/bug/my')
const query = reactive({ pageNum: 1, pageSize: 20, keyword: '', projectId: ALL_OPTION_VALUE, moduleId: ALL_OPTION_VALUE, status: ALL_OPTION_VALUE, severity: ALL_OPTION_VALUE, priority: ALL_OPTION_VALUE, assigneeId: ALL_OPTION_VALUE, submitterId: ALL_OPTION_VALUE, beginTime: '', endTime: '' })
const actionForm = reactive({ remark: '', assigneeId: '', dueTime: '', duplicateOfId: '' })
const commentText = ref('')
const editForm = reactive({ ticketId: '', title: '', type: '', severity: '', priority: '', description: '', reproduceSteps: '', expectedResult: '', actualResult: '', environment: '', deviceInfo: '' })

async function getList() {
  loading.value = true
  try {
    const res = await listBugTickets({ ...query, projectId: normalizeAll(query.projectId), moduleId: normalizeAll(query.moduleId), status: normalizeAll(query.status), severity: normalizeAll(query.severity), priority: normalizeAll(query.priority), assigneeId: normalizeAll(query.assigneeId), submitterId: normalizeAll(query.submitterId), beginTime: query.beginTime ? new Date(query.beginTime).toISOString() : undefined, endTime: query.endTime ? new Date(query.endTime).toISOString() : undefined, mine: isMyPage.value ? 'true' : undefined })
    rows.value = res.rows
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function loadModules() {
  const projectId = normalizeAll(query.projectId)
  if (!projectId) {
    modules.value = []
    query.moduleId = ALL_OPTION_VALUE
    return
  }
  const res = await listBugModules({ projectId, pageNum: 1, pageSize: 100 })
  modules.value = res.rows
  query.moduleId = ALL_OPTION_VALUE
}

function resetQuery() {
  Object.assign(query, { pageNum: 1, keyword: '', projectId: ALL_OPTION_VALUE, moduleId: ALL_OPTION_VALUE, status: ALL_OPTION_VALUE, severity: ALL_OPTION_VALUE, priority: ALL_OPTION_VALUE, assigneeId: ALL_OPTION_VALUE, submitterId: ALL_OPTION_VALUE, beginTime: '', endTime: '' })
  modules.value = []
  getList()
}

async function openDetail(row: BugTicket) {
  detail.value = await getBugTicket(row.ticketId)
  showDetail.value = true
}

async function openAction(action: BugActionOption, row?: BugTicket) {
  if (row) detail.value = row.availableActions ? row : await getBugTicket(row.ticketId)
  if (!detail.value) return
  currentAction.value = action
  Object.assign(actionForm, { remark: '', assigneeId: detail.value.assigneeId || '', dueTime: '', duplicateOfId: '' })
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

async function comment() {
  if (!detail.value || !commentText.value.trim()) return
  await addBugComment(detail.value.ticketId, { content: commentText.value })
  commentText.value = ''
  detail.value = await getBugTicket(detail.value.ticketId)
}

watch(() => route.path, () => getList())

onMounted(async () => {
  projects.value = await bugProjectOptions()
  users.value = await bugUserOptions()
  getList()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <div><h2 class="text-2xl font-bold">{{ isMyPage ? '我的 Bug' : 'Bug 列表' }}</h2><p class="text-muted-foreground">跟踪 Bug 确认、分派、修复和验证闭环。</p></div>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getList" />
        <Button v-hasPermi="['bug:ticket:add']" as-child><router-link to="/bug/create">提交 Bug</router-link></Button>
      </div>
    </div>
    <div class="flex flex-wrap gap-3 rounded-lg border bg-background p-4">
      <Input v-model="query.keyword" placeholder="标题/编号" class="w-48" @keyup.enter="getList" />
      <Select v-model="query.projectId" @update:model-value="loadModules"><SelectTrigger class="w-44"><SelectValue placeholder="项目" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select>
      <Select v-model="query.moduleId"><SelectTrigger class="w-40"><SelectValue placeholder="模块" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部模块</SelectItem><SelectItem v-for="m in modules" :key="m.moduleId" :value="m.moduleId">{{ m.moduleName }}</SelectItem></SelectContent></Select>
      <Select v-model="query.status"><SelectTrigger class="w-40"><SelectValue placeholder="状态" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部状态</SelectItem><SelectItem v-for="o in BUG_STATUS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select>
      <Select v-model="query.severity"><SelectTrigger class="w-36"><SelectValue placeholder="严重" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部严重</SelectItem><SelectItem v-for="o in BUG_SEVERITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select>
      <Select v-model="query.priority"><SelectTrigger class="w-36"><SelectValue placeholder="优先级" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部优先级</SelectItem><SelectItem v-for="o in BUG_PRIORITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select>
      <Select v-model="query.assigneeId"><SelectTrigger class="w-40"><SelectValue placeholder="负责人" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部负责人</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select>
      <Select v-model="query.submitterId"><SelectTrigger class="w-40"><SelectValue placeholder="提交人" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部提交人</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select>
      <Input v-model="query.beginTime" type="datetime-local" class="w-48" />
      <Input v-model="query.endTime" type="datetime-local" class="w-48" />
      <Button @click="getList">搜索</Button><Button variant="outline" @click="resetQuery">重置</Button>
    </div>
    <TableSkeleton v-if="loading" :rows="5" :columns="9" />
    <div v-else class="rounded-md border"><Table><TableHeader><TableRow><TableHead>编号</TableHead><TableHead>标题</TableHead><TableHead>项目</TableHead><TableHead>模块</TableHead><TableHead>状态</TableHead><TableHead>严重</TableHead><TableHead>优先级</TableHead><TableHead>负责人</TableHead><TableHead>创建时间</TableHead><TableHead>快捷操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.ticketId" class="cursor-pointer" @click="openDetail(row)"><TableCell>{{ row.ticketNo }}</TableCell><TableCell>{{ row.title }}</TableCell><TableCell>{{ row.project?.projectName }}</TableCell><TableCell>{{ row.module?.moduleName || '-' }}</TableCell><TableCell><Badge>{{ optionLabel(BUG_STATUS_OPTIONS, row.status) }}</Badge></TableCell><TableCell>{{ optionLabel(BUG_SEVERITY_OPTIONS, row.severity) }}</TableCell><TableCell>{{ optionLabel(BUG_PRIORITY_OPTIONS, row.priority) }}</TableCell><TableCell>{{ row.assignee?.nickName || '-' }}</TableCell><TableCell>{{ formatDate(row.createTime) }}</TableCell><TableCell><BugQuickActions :ticket="row" @detail="openDetail" @run="openAction" /></TableCell></TableRow></TableBody></Table><EmptyState v-if="!rows.length" title="暂无 Bug" /></div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="showDetail"><DialogContent class="max-h-[90vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>{{ detail?.ticketNo }} {{ detail?.title }}</DialogTitle></DialogHeader><div v-if="detail" class="space-y-4"><div class="flex flex-wrap gap-2"><Badge>{{ optionLabel(BUG_STATUS_OPTIONS, detail.status) }}</Badge><Badge variant="outline">{{ optionLabel(BUG_PRIORITY_OPTIONS, detail.priority) }}</Badge><Badge variant="outline">{{ optionLabel(BUG_SEVERITY_OPTIONS, detail.severity) }}</Badge><Badge variant="outline">{{ detail.project?.projectName }} / {{ detail.module?.moduleName || '-' }}</Badge></div><div class="grid gap-4 md:grid-cols-2"><div><h4 class="font-medium">问题描述</h4><p class="whitespace-pre-wrap text-sm">{{ detail.description }}</p></div><div><h4 class="font-medium">复现步骤</h4><p class="whitespace-pre-wrap text-sm">{{ detail.reproduceSteps }}</p></div><div><h4 class="font-medium">期望结果</h4><p class="whitespace-pre-wrap text-sm">{{ detail.expectedResult }}</p></div><div><h4 class="font-medium">实际结果</h4><p class="whitespace-pre-wrap text-sm">{{ detail.actualResult }}</p></div></div><div><h4 class="mb-2 font-medium">附件</h4><AttachmentList :attachments="detail.attachments || []" empty-text="暂无附件" /></div><div><h4 class="font-medium">评论</h4><div v-for="c in detail.comments" :key="c.commentId" class="border-b py-2 text-sm"><b>{{ c.user?.nickName }}</b>：{{ c.content }} <span class="text-muted-foreground">{{ formatDate(c.createTime) }}</span></div><div class="mt-2 flex gap-2"><Textarea v-model="commentText" placeholder="补充评论" /><Button v-hasPermi="['bug:comment:add']" @click="comment">评论</Button></div></div><div><h4 class="font-medium">操作历史</h4><div v-for="h in detail.histories" :key="h.historyId" class="text-sm text-muted-foreground">{{ formatDate(h.createTime) }} {{ h.operator?.nickName }} {{ actionLabel(h.action) }} {{ h.fromValue }} → {{ h.toValue }} {{ h.remark }}</div></div></div><DialogFooter class="flex flex-wrap gap-2"><Button v-hasPermi="['bug:ticket:edit']" variant="outline" @click="openEdit">编辑</Button><Button v-for="a in detail?.availableActions" :key="a.action" variant="outline" @click="openAction(a)">{{ a.label || BUG_ACTION_LABELS[a.action] || a.action }}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog v-model:open="editOpen"><DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>编辑 Bug</DialogTitle></DialogHeader><div class="grid gap-3 md:grid-cols-2"><Input v-model="editForm.title" class="md:col-span-2" placeholder="标题" /><Select v-model="editForm.type"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select><Select v-model="editForm.environment"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_ENVIRONMENT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select><Select v-model="editForm.severity"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_SEVERITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select><Select v-model="editForm.priority"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_PRIORITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select><Textarea v-model="editForm.description" class="md:col-span-2" placeholder="问题描述" /><Textarea v-model="editForm.reproduceSteps" class="md:col-span-2" placeholder="复现步骤" /><Textarea v-model="editForm.expectedResult" placeholder="期望结果" /><Textarea v-model="editForm.actualResult" placeholder="实际结果" /><Textarea v-model="editForm.deviceInfo" class="md:col-span-2" placeholder="设备信息" /></div><DialogFooter><Button @click="submitEdit">保存</Button></DialogFooter></DialogContent></Dialog>
    <Dialog v-model:open="showAction"><DialogContent><DialogHeader><DialogTitle>执行操作：{{ currentAction?.label }}</DialogTitle></DialogHeader><div class="space-y-3"><Select v-if="currentAction?.action === 'assign'" v-model="actionForm.assigneeId"><SelectTrigger><SelectValue placeholder="选择负责人" /></SelectTrigger><SelectContent><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select><DuplicateBugSelector v-if="currentAction?.action === 'duplicate'" v-model="actionForm.duplicateOfId" :current-ticket-id="detail?.ticketId" /><Input v-if="currentAction?.action === 'assign'" v-model="actionForm.dueTime" type="datetime-local" placeholder="预计完成时间" /><Textarea v-model="actionForm.remark" placeholder="操作说明（选填）" /></div><DialogFooter><Button @click="submitAction">确认</Button></DialogFooter></DialogContent></Dialog>
  </div>
</template>

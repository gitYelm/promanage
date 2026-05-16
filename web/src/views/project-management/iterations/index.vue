<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { addIteration, deleteIterations, listIterations, runIterationAction, updateIteration } from '@/api/project-management'
import { bugProjectOptions, bugUserOptions } from '@/api/bug'
import type { Iteration, IterationForm } from '@/api/project-management/types'
import type { BugProject, BugUserRef } from '@/api/bug/types'
import { PM_ALL_OPTION_VALUE, PM_ITERATION_ACTION_OPTIONS, PM_ITERATION_STATUS_OPTIONS, PM_NONE_OPTION_VALUE, formatDate, pmAvailableActions, pmLabel, pmNormalizeAll, pmNormalizeOptional, toDateInput } from '../shared/options'

const { toast } = useToast()
const loading = ref(false); const open = ref(false); const rows = ref<Iteration[]>([]); const total = ref(0)
const projects = ref<BugProject[]>([]); const users = ref<BugUserRef[]>([])
const query = reactive({ pageNum: 1, pageSize: 20, keyword: '', projectId: PM_ALL_OPTION_VALUE, status: PM_ALL_OPTION_VALUE })
const form = reactive<IterationForm>({ projectId: '', iterationName: '', status: 'planned', ownerId: PM_NONE_OPTION_VALUE })
const canSave = computed(() => Boolean(form.projectId && form.iterationName))

async function getList() {
  loading.value = true
  try {
    const res = await listIterations({ ...query, projectId: pmNormalizeAll(query.projectId), status: pmNormalizeAll(query.status) })
    rows.value = res.rows; total.value = res.total
  } finally { loading.value = false }
}
function add() { Object.assign(form, { iterationId: undefined, projectId: projects.value[0]?.projectId || '', iterationName: '', goal: '', status: 'planned', ownerId: PM_NONE_OPTION_VALUE, startDate: '', endDate: '', summary: '', riskNote: '' }); open.value = true }
function edit(row: Iteration) { Object.assign(form, row, { ownerId: row.ownerId || PM_NONE_OPTION_VALUE, startDate: toDateInput(row.startDate), endDate: toDateInput(row.endDate) }); open.value = true }
async function save() { const payload = { ...form, ownerId: pmNormalizeOptional(form.ownerId) }; form.iterationId ? await updateIteration(payload) : await addIteration(payload); toast({ title: '迭代已保存' }); open.value = false; getList() }
async function remove(row: Iteration) { await deleteIterations([row.iterationId]); toast({ title: '迭代已删除' }); getList() }
async function action(row: Iteration, act: string) { await runIterationAction(row.iterationId, act); toast({ title: '迭代状态已更新' }); getList() }

onMounted(async () => { [projects.value, users.value] = await Promise.all([bugProjectOptions(), bugUserOptions()]); await getList() })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between"><div><h2 class="text-2xl font-bold">迭代计划</h2><p class="text-sm text-muted-foreground">管理项目短周期交付目标、范围、负责人和状态流转。</p></div><div class="flex gap-2"><DataRefreshButton :loading="loading" @refresh="getList" /><Button v-hasPermi="['pm:iteration:manage']" @click="add">新增迭代</Button></div></div>
    <div class="flex flex-wrap gap-2"><Input v-model="query.keyword" class="w-56" placeholder="迭代名称" @keyup.enter="getList" /><Select v-model="query.projectId"><SelectTrigger class="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select><Select v-model="query.status"><SelectTrigger class="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部状态</SelectItem><SelectItem v-for="s in PM_ITERATION_STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</SelectItem></SelectContent></Select><Button @click="getList">搜索</Button></div>
    <div class="rounded-md border"><Table><TableHeader><TableRow><TableHead>迭代</TableHead><TableHead>项目</TableHead><TableHead>负责人</TableHead><TableHead>周期</TableHead><TableHead>状态</TableHead><TableHead>风险</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.iterationId"><TableCell><div class="font-medium">{{ row.iterationName }}</div><div class="text-xs text-muted-foreground">{{ row.goal || '-' }}</div></TableCell><TableCell>{{ row.project?.projectName }}</TableCell><TableCell>{{ row.owner?.nickName || '-' }}</TableCell><TableCell>{{ formatDate(row.startDate) }} - {{ formatDate(row.endDate) }}</TableCell><TableCell><Badge variant="outline">{{ pmLabel(PM_ITERATION_STATUS_OPTIONS, row.status) }}</Badge></TableCell><TableCell class="max-w-48 truncate">{{ row.riskNote || '-' }}</TableCell><TableCell class="space-x-2"><Button v-hasPermi="['pm:iteration:manage']" size="sm" variant="outline" @click="edit(row)">编辑</Button><Button v-for="item in pmAvailableActions(PM_ITERATION_ACTION_OPTIONS, row.status)" :key="item.action" v-hasPermi="['pm:iteration:manage']" size="sm" variant="outline" @click="action(row, item.action)">{{ item.label }}</Button><Button v-hasPermi="['pm:iteration:manage']" size="sm" variant="destructive" @click="remove(row)">删除</Button></TableCell></TableRow></TableBody></Table><EmptyState v-if="!rows.length" /></div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open"><DialogContent class="max-w-2xl"><DialogHeader><DialogTitle>迭代</DialogTitle></DialogHeader><div class="grid gap-3 md:grid-cols-2"><div class="space-y-2"><Label>项目</Label><Select v-model="form.projectId"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select></div><div class="space-y-2"><Label>负责人</Label><Select v-model="form.ownerId"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_NONE_OPTION_VALUE">暂不指定</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select></div><div class="space-y-2 md:col-span-2"><Label>迭代名称</Label><Input v-model="form.iterationName" /></div><div class="space-y-2"><Label>开始日期</Label><Input v-model="form.startDate" type="date" /></div><div class="space-y-2"><Label>结束日期</Label><Input v-model="form.endDate" type="date" /></div><div class="space-y-2 md:col-span-2"><Label>迭代目标</Label><Textarea v-model="form.goal" /></div><div class="space-y-2 md:col-span-2"><Label>范围说明</Label><Textarea v-model="form.summary" /></div><div class="space-y-2 md:col-span-2"><Label>风险说明</Label><Textarea v-model="form.riskNote" /></div></div><DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter></DialogContent></Dialog>
  </div>
</template>

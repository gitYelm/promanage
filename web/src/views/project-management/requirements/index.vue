<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { addRequirement, deleteRequirements, listRequirements, runRequirementAction, updateRequirement } from '@/api/project-management'
import type { Requirement, RequirementForm } from '@/api/project-management/types'
import type { BugProject, BugUserRef } from '@/api/bug/types'
import { PM_ALL_OPTION_VALUE, PM_NONE_OPTION_VALUE, PM_PRIORITY_OPTIONS, PM_REQUIREMENT_ACTION_OPTIONS, PM_REQUIREMENT_STATUS_OPTIONS, PM_REQUIREMENT_TYPE_OPTIONS, formatDate, pmAvailableActions, pmLabel, pmNormalizeAll, pmNormalizeOptional, toDateInput } from '../shared/options'
import { loadPmBasicResources } from '../shared/resource-loader'

const { toast } = useToast()
const loading = ref(false); const open = ref(false); const rows = ref<Requirement[]>([]); const total = ref(0)
const projects = ref<BugProject[]>([]); const users = ref<BugUserRef[]>([])
const query = reactive({ pageNum: 1, pageSize: 20, keyword: '', projectId: PM_ALL_OPTION_VALUE, status: PM_ALL_OPTION_VALUE })
const form = reactive<RequirementForm>({ title: '', projectId: '', type: 'feature', priority: 'medium', status: 'draft', ownerId: PM_NONE_OPTION_VALUE, developerId: PM_NONE_OPTION_VALUE })
const canSave = computed(() => Boolean(form.title && form.projectId))

async function getList() { loading.value = true; try { const res = await listRequirements({ ...query, projectId: pmNormalizeAll(query.projectId), status: pmNormalizeAll(query.status) }); rows.value = res.rows; total.value = res.total } finally { loading.value = false } }
function add() { Object.assign(form, { requirementId: undefined, title: '', projectId: projects.value[0]?.projectId || '', type: 'feature', priority: 'medium', description: '', acceptanceCriteria: '', ownerId: PM_NONE_OPTION_VALUE, developerId: PM_NONE_OPTION_VALUE, plannedStartTime: '', plannedEndTime: '', status: 'draft' }); open.value = true }
function edit(row: Requirement) { Object.assign(form, row, { ownerId: row.ownerId || PM_NONE_OPTION_VALUE, developerId: row.developerId || PM_NONE_OPTION_VALUE, plannedStartTime: toDateInput(row.plannedStartTime), plannedEndTime: toDateInput(row.plannedEndTime) }); open.value = true }
async function save() { const payload = { ...form, ownerId: pmNormalizeOptional(form.ownerId), developerId: pmNormalizeOptional(form.developerId) }; form.requirementId ? await updateRequirement(payload) : await addRequirement(payload); toast({ title: '保存成功' }); open.value = false; getList() }
async function remove(row: Requirement) { await deleteRequirements([row.requirementId]); toast({ title: '删除成功' }); getList() }
async function action(row: Requirement, act: string) { await runRequirementAction(row.requirementId, act); toast({ title: '状态已更新' }); getList() }

onMounted(async () => { const res = await loadPmBasicResources(); projects.value = res.projects; users.value = res.users; await getList() })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between"><h2 class="text-2xl font-bold">需求管理</h2><div class="flex gap-2"><DataRefreshButton :loading="loading" @refresh="getList" /><Button v-hasPermi="['pm:requirement:create']" @click="add">新增需求</Button></div></div>
    <div class="flex flex-wrap gap-2"><Input v-model="query.keyword" class="w-56" placeholder="需求标题/编号" @keyup.enter="getList" /><Select v-model="query.projectId"><SelectTrigger class="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select><Select v-model="query.status"><SelectTrigger class="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部状态</SelectItem><SelectItem v-for="s in PM_REQUIREMENT_STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</SelectItem></SelectContent></Select><Button @click="getList">搜索</Button></div>
    <div class="rounded-md border"><Table><TableHeader><TableRow><TableHead>编号</TableHead><TableHead>标题</TableHead><TableHead>项目</TableHead><TableHead>负责人</TableHead><TableHead>状态</TableHead><TableHead>计划完成</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.requirementId"><TableCell>{{ row.requirementNo }}</TableCell><TableCell>{{ row.title }}</TableCell><TableCell>{{ row.project?.projectName }}</TableCell><TableCell>{{ row.owner?.nickName || row.developer?.nickName || '-' }}</TableCell><TableCell>{{ pmLabel(PM_REQUIREMENT_STATUS_OPTIONS, row.status) }}</TableCell><TableCell>{{ formatDate(row.plannedEndTime) }}</TableCell><TableCell class="space-x-2"><Button v-hasPermi="['pm:requirement:update']" size="sm" variant="outline" @click="edit(row)">编辑</Button><Button v-for="item in pmAvailableActions(PM_REQUIREMENT_ACTION_OPTIONS, row.status)" :key="item.action" v-hasPermi="['pm:requirement:status']" size="sm" variant="outline" @click="action(row, item.action)">{{ item.label }}</Button><Button v-hasPermi="['pm:requirement:update']" size="sm" variant="destructive" @click="remove(row)">删除</Button></TableCell></TableRow></TableBody></Table><EmptyState v-if="!rows.length" /></div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open"><DialogContent class="max-w-2xl"><DialogHeader><DialogTitle>需求</DialogTitle></DialogHeader><div class="grid gap-3 md:grid-cols-2"><Input v-model="form.title" class="md:col-span-2" placeholder="需求标题" /><Select v-model="form.projectId"><SelectTrigger><SelectValue placeholder="项目" /></SelectTrigger><SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select><Select v-model="form.type"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="t in PM_REQUIREMENT_TYPE_OPTIONS" :key="t.value" :value="t.value">{{ t.label }}</SelectItem></SelectContent></Select><Select v-model="form.priority"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="p in PM_PRIORITY_OPTIONS" :key="p.value" :value="p.value">{{ p.label }}</SelectItem></SelectContent></Select><Select v-model="form.ownerId"><SelectTrigger><SelectValue placeholder="需求负责人" /></SelectTrigger><SelectContent><SelectItem :value="PM_NONE_OPTION_VALUE">暂不指定</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select><Select v-model="form.developerId"><SelectTrigger><SelectValue placeholder="开发负责人" /></SelectTrigger><SelectContent><SelectItem :value="PM_NONE_OPTION_VALUE">暂不指定</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select><Input v-model="form.plannedStartTime" type="date" /><Input v-model="form.plannedEndTime" type="date" /><Textarea v-model="form.description" class="md:col-span-2" placeholder="需求描述" /><Textarea v-model="form.acceptanceCriteria" class="md:col-span-2" placeholder="验收标准" /></div><DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter></DialogContent></Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import SemanticActionButton from '@/components/common/SemanticActionButton.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { hasAnyPermission, usePermission } from '@/composables/usePermission'
import { addMilestone, deleteMilestones, listMilestones, runMilestoneAction, updateMilestone } from '@/api/project-management'
import { bugProjectOptions, bugUserOptions } from '@/api/bug'
import type { Milestone, MilestoneForm } from '@/api/project-management/types'
import type { BugProject, BugUserRef } from '@/api/bug/types'
import { PM_ALL_OPTION_VALUE, PM_MILESTONE_ACTION_OPTIONS, PM_MILESTONE_STATUS_OPTIONS, PM_NONE_OPTION_VALUE, PM_PROJECT_STAGE_OPTIONS, formatDate, pmAvailableActions, pmNormalizeAll, pmNormalizeOptional, toDateInput } from '../shared/options'

const { toast } = useToast()
const loading = ref(false); const open = ref(false); const rows = ref<Milestone[]>([]); const total = ref(0)
const projects = ref<BugProject[]>([]); const users = ref<BugUserRef[]>([])
const query = reactive({ pageNum: 1, pageSize: 20, keyword: '', projectId: PM_ALL_OPTION_VALUE, status: PM_ALL_OPTION_VALUE })
const form = reactive<MilestoneForm>({ projectId: '', milestoneName: '', stage: 'development', status: 'pending', ownerId: PM_NONE_OPTION_VALUE })
const canSave = computed(() => Boolean(form.projectId && form.milestoneName && form.stage))
const canShowQuickActionColumn = usePermission(['pm:milestone:manage'])
const canShowOperationColumn = usePermission(['pm:milestone:manage'])

async function getList() {
  loading.value = true
  try {
    const res = await listMilestones({ ...query, projectId: pmNormalizeAll(query.projectId), status: pmNormalizeAll(query.status) })
    rows.value = res.rows; total.value = res.total
  } finally { loading.value = false }
}
function add() { Object.assign(form, { milestoneId: undefined, projectId: projects.value[0]?.projectId || '', milestoneName: '', stage: 'development', status: 'pending', ownerId: PM_NONE_OPTION_VALUE, targetDate: '', completionCriteria: '', remark: '' }); refreshAssignableUsers(); open.value = true }
function edit(row: Milestone) { Object.assign(form, row, { ownerId: row.ownerId || PM_NONE_OPTION_VALUE, targetDate: toDateInput(row.targetDate) }); refreshAssignableUsers(row.projectId); open.value = true }
async function save() { const payload = { ...form, ownerId: pmNormalizeOptional(form.ownerId) }; form.milestoneId ? await updateMilestone(payload) : await addMilestone(payload); toast({ title: '里程碑已保存' }); open.value = false; getList() }
async function remove(row: Milestone) { await deleteMilestones([row.milestoneId]); toast({ title: '里程碑已删除' }); getList() }
async function action(row: Milestone, act: string) { await runMilestoneAction(row.milestoneId, act); toast({ title: '里程碑状态已更新' }); getList() }
function quickActions(row: Milestone) { return pmAvailableActions(PM_MILESTONE_ACTION_OPTIONS, row.status).filter((item) => !item.permissions || hasAnyPermission(item.permissions)) }
async function refreshAssignableUsers(projectId = form.projectId) { users.value = projectId ? await bugUserOptions('', { projectId, assignContext: 'milestoneOwner', assignableOnly: true }) : [] }

onMounted(async () => { projects.value = await bugProjectOptions(); await getList() })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between"><div><h2 class="text-2xl font-bold">里程碑</h2><p class="text-sm text-muted-foreground">管理开发完成、内测开始、发布上线等关键节点。</p></div><div class="flex gap-2"><DataRefreshButton :loading="loading" @refresh="getList" /><Button v-hasPermi="['pm:milestone:manage']" @click="add">新增里程碑</Button></div></div>
    <div class="flex flex-wrap gap-2"><Input v-model="query.keyword" class="w-56" placeholder="里程碑名称" @keyup.enter="getList" /><Select v-model="query.projectId"><SelectTrigger class="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select><Select v-model="query.status"><SelectTrigger class="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部状态</SelectItem><SelectItem v-for="s in PM_MILESTONE_STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</SelectItem></SelectContent></Select><Button @click="getList">搜索</Button></div>
    <div class="rounded-md border"><Table><TableHeader><TableRow><TableHead>里程碑</TableHead><TableHead>项目</TableHead><TableHead class="text-center">阶段</TableHead><TableHead>负责人</TableHead><TableHead>目标日期</TableHead><TableHead class="text-center">状态</TableHead><TableHead v-if="canShowQuickActionColumn" class="min-w-48 text-left">快捷操作</TableHead><TableHead v-if="canShowOperationColumn" class="w-36 text-right">操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.milestoneId"><TableCell><div class="font-medium">{{ row.milestoneName }}</div><div class="text-xs text-muted-foreground">{{ row.completionCriteria || '-' }}</div></TableCell><TableCell>{{ row.project?.projectName }}</TableCell><TableCell class="text-center"><StatusBadge domain="projectStage" :value="row.stage" /></TableCell><TableCell>{{ row.owner?.nickName || '-' }}</TableCell><TableCell>{{ formatDate(row.targetDate) }}</TableCell><TableCell class="text-center"><StatusBadge domain="milestone" :value="row.status" /></TableCell><TableCell v-if="canShowQuickActionColumn"><div v-if="quickActions(row).length" class="flex flex-wrap gap-2"><SemanticActionButton v-for="item in quickActions(row)" :key="item.action" :permissions="item.permissions" :action="item.action" @click="action(row, item.action)">{{ item.label }}</SemanticActionButton></div><span v-else class="text-sm text-muted-foreground">-</span></TableCell><TableCell v-if="canShowOperationColumn" class="text-right"><div class="flex justify-end gap-2"><Button v-hasPermi="['pm:milestone:manage']" size="sm" variant="outline" @click="edit(row)">编辑</Button><Button v-hasPermi="['pm:milestone:manage']" size="sm" variant="destructive" @click="remove(row)">删除</Button></div></TableCell></TableRow></TableBody></Table><EmptyState v-if="!rows.length" /></div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ form.milestoneId ? '编辑里程碑' : '新增里程碑' }}</DialogTitle>
          <DialogDescription>请补充关键节点、目标日期和完成条件；带 * 的字段为必填。</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="milestone-project">所属项目 <span class="text-destructive">*</span></Label>
            <Select v-model="form.projectId" @update:model-value="(v) => { form.projectId = String(v); form.ownerId = PM_NONE_OPTION_VALUE; refreshAssignableUsers(form.projectId) }">
              <SelectTrigger id="milestone-project"><SelectValue placeholder="请选择所属项目" /></SelectTrigger>
              <SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">决定里程碑归属和负责人候选范围，切换项目会重置负责人。</p>
          </div>
          <div class="space-y-2">
            <Label for="milestone-owner">里程碑负责人（可选）</Label>
            <Select v-model="form.ownerId">
              <SelectTrigger id="milestone-owner"><SelectValue placeholder="请选择里程碑负责人" /></SelectTrigger>
              <SelectContent><SelectItem :value="PM_NONE_OPTION_VALUE">暂不指定里程碑负责人</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">负责推动该节点达成；暂不指定表示后续再明确责任人。</p>
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="milestone-name">里程碑名称 <span class="text-destructive">*</span></Label>
            <Input id="milestone-name" v-model="form.milestoneName" placeholder="例如：内测开始、发布上线" />
            <p class="text-xs text-muted-foreground">建议使用可验收的节点名称，便于管理层追踪关键进展。</p>
          </div>
          <div class="space-y-2">
            <Label for="milestone-stage">对应阶段 <span class="text-destructive">*</span></Label>
            <Select v-model="form.stage">
              <SelectTrigger id="milestone-stage"><SelectValue placeholder="请选择项目阶段" /></SelectTrigger>
              <SelectContent><SelectItem v-for="s in PM_PROJECT_STAGE_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</SelectItem></SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">用于项目看板和阶段统计，需与实际交付阶段一致。</p>
          </div>
          <div class="space-y-2">
            <Label for="milestone-target">目标日期（可选）</Label>
            <Input id="milestone-target" v-model="form.targetDate" type="date" />
            <p class="text-xs text-muted-foreground">用于节点提醒和延期判断；不确定时可先留空。</p>
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="milestone-criteria">完成条件（可选）</Label>
            <Textarea id="milestone-criteria" v-model="form.completionCriteria" placeholder="描述达到什么标准才算该节点完成" />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="milestone-remark">备注（可选）</Label>
            <Textarea id="milestone-remark" v-model="form.remark" placeholder="补充依赖、风险或特别说明" />
          </div>
        </div>
        <DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import SemanticActionButton from '@/components/common/SemanticActionButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { bugProjectOptions, bugUserOptions } from '@/api/bug'
import { addRequirement, deleteRequirements, listRequirements, runRequirementAction, updateRequirement } from '@/api/project-management'
import type { Requirement, RequirementForm } from '@/api/project-management/types'
import type { BugProject, BugUserRef } from '@/api/bug/types'
import { PM_ALL_OPTION_VALUE, PM_NONE_OPTION_VALUE, PM_PRIORITY_OPTIONS, PM_REQUIREMENT_ACTION_OPTIONS, PM_REQUIREMENT_STATUS_OPTIONS, PM_REQUIREMENT_TYPE_OPTIONS, formatDate, pmAvailableActions, pmNormalizeAll, pmNormalizeOptional, toDateInput } from '../shared/options'

const { toast } = useToast()
const loading = ref(false); const open = ref(false); const rows = ref<Requirement[]>([]); const total = ref(0)
const projects = ref<BugProject[]>([]); const ownerUsers = ref<BugUserRef[]>([]); const developerUsers = ref<BugUserRef[]>([])
const query = reactive({ pageNum: 1, pageSize: 20, keyword: '', projectId: PM_ALL_OPTION_VALUE, status: PM_ALL_OPTION_VALUE })
const form = reactive<RequirementForm>({ title: '', projectId: '', type: 'feature', priority: 'medium', status: 'draft', ownerId: PM_NONE_OPTION_VALUE, developerId: PM_NONE_OPTION_VALUE })
const canSave = computed(() => Boolean(form.title && form.projectId))

async function getList() { loading.value = true; try { const res = await listRequirements({ ...query, projectId: pmNormalizeAll(query.projectId), status: pmNormalizeAll(query.status) }); rows.value = res.rows; total.value = res.total } finally { loading.value = false } }
async function refreshAssignableUsers(projectId = form.projectId) { if (!projectId) return; [ownerUsers.value, developerUsers.value] = await Promise.all([loadUsers(projectId, 'requirementOwner'), loadUsers(projectId, 'requirementDeveloper')]) }
function loadUsers(projectId: string, assignContext: string) { return bugUserOptions('', { projectId, assignContext, assignableOnly: true }) }
function add() { Object.assign(form, { requirementId: undefined, title: '', projectId: projects.value[0]?.projectId || '', type: 'feature', priority: 'medium', description: '', acceptanceCriteria: '', ownerId: PM_NONE_OPTION_VALUE, developerId: PM_NONE_OPTION_VALUE, plannedStartTime: '', plannedEndTime: '', status: 'draft' }); refreshAssignableUsers(); open.value = true }
function edit(row: Requirement) { Object.assign(form, row, { ownerId: row.ownerId || PM_NONE_OPTION_VALUE, developerId: row.developerId || PM_NONE_OPTION_VALUE, plannedStartTime: toDateInput(row.plannedStartTime), plannedEndTime: toDateInput(row.plannedEndTime) }); refreshAssignableUsers(row.projectId); open.value = true }
async function save() { const payload = { ...form, ownerId: pmNormalizeOptional(form.ownerId), developerId: pmNormalizeOptional(form.developerId) }; form.requirementId ? await updateRequirement(payload) : await addRequirement(payload); toast({ title: '保存成功' }); open.value = false; getList() }
async function remove(row: Requirement) { await deleteRequirements([row.requirementId]); toast({ title: '删除成功' }); getList() }
async function action(row: Requirement, act: string) { await runRequirementAction(row.requirementId, act); toast({ title: '状态已更新' }); getList() }
function quickActions(row: Requirement) { return pmAvailableActions(PM_REQUIREMENT_ACTION_OPTIONS, row.status) }

onMounted(async () => { projects.value = await bugProjectOptions(); await getList() })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between"><h2 class="text-2xl font-bold">需求管理</h2><div class="flex gap-2"><DataRefreshButton :loading="loading" @refresh="getList" /><Button v-hasPermi="['pm:requirement:create']" @click="add">新增需求</Button></div></div>
    <div class="flex flex-wrap gap-2"><Input v-model="query.keyword" class="w-56" placeholder="需求标题/编号" @keyup.enter="getList" /><Select v-model="query.projectId"><SelectTrigger class="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select><Select v-model="query.status"><SelectTrigger class="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem :value="PM_ALL_OPTION_VALUE">全部状态</SelectItem><SelectItem v-for="s in PM_REQUIREMENT_STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</SelectItem></SelectContent></Select><Button @click="getList">搜索</Button></div>
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>编号</TableHead>
            <TableHead>标题</TableHead>
            <TableHead>项目</TableHead>
            <TableHead>负责人</TableHead>
            <TableHead class="text-center">状态</TableHead>
            <TableHead class="text-center">优先级</TableHead>
            <TableHead class="text-left">计划完成</TableHead>
            <TableHead class="min-w-48 text-left">快捷操作</TableHead>
            <TableHead class="w-36 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in rows" :key="row.requirementId">
            <TableCell>{{ row.requirementNo }}</TableCell>
            <TableCell>{{ row.title }}</TableCell>
            <TableCell>{{ row.project?.projectName }}</TableCell>
            <TableCell>{{ row.owner?.nickName || row.developer?.nickName || '-' }}</TableCell>
            <TableCell class="text-center"><StatusBadge domain="requirement" :value="row.status" /></TableCell>
            <TableCell class="text-center"><PriorityBadge :value="row.priority" /></TableCell>
            <TableCell class="text-left">{{ formatDate(row.plannedEndTime) }}</TableCell>
            <TableCell class="text-left">
              <div v-if="quickActions(row).length" class="flex flex-wrap gap-2">
                <SemanticActionButton
                  v-for="item in quickActions(row)"
                  :key="item.action"
                  v-hasPermi="['pm:requirement:status']"
                  :action="item.action"
                  @click="action(row, item.action)"
                >
                  {{ item.label }}
                </SemanticActionButton>
              </div>
              <span v-else class="text-sm text-muted-foreground">-</span>
            </TableCell>
            <TableCell class="text-right">
              <div class="flex justify-end gap-2">
                <Button v-hasPermi="['pm:requirement:update']" size="sm" variant="outline" @click="edit(row)">编辑</Button>
                <Button v-hasPermi="['pm:requirement:update']" size="sm" variant="destructive" @click="remove(row)">删除</Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <EmptyState v-if="!rows.length" />
    </div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ form.requirementId ? '编辑需求' : '新增需求' }}</DialogTitle>
          <DialogDescription>请补充需求基础信息、人员分工和计划时间；带 * 的字段为必填。</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2 md:col-span-2">
            <Label for="requirement-title">需求标题 <span class="text-destructive">*</span></Label>
            <Input id="requirement-title" v-model="form.title" placeholder="例如：后台管理系统新增数据导出能力" />
            <p class="text-xs text-muted-foreground">用一句话说明要交付的功能或问题，保存后会作为列表主标题。</p>
          </div>
          <div class="space-y-2">
            <Label for="requirement-project">所属项目 <span class="text-destructive">*</span></Label>
            <Select v-model="form.projectId" @update:model-value="(v) => { form.projectId = String(v); form.ownerId = PM_NONE_OPTION_VALUE; form.developerId = PM_NONE_OPTION_VALUE; refreshAssignableUsers(form.projectId) }">
              <SelectTrigger id="requirement-project"><SelectValue placeholder="请选择所属项目" /></SelectTrigger>
              <SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">决定需求归属和可选择的负责人范围，切换项目会重置人员分工。</p>
          </div>
          <div class="space-y-2">
            <Label for="requirement-type">需求分类</Label>
            <Select v-model="form.type">
              <SelectTrigger id="requirement-type"><SelectValue placeholder="请选择需求分类" /></SelectTrigger>
              <SelectContent><SelectItem v-for="t in PM_REQUIREMENT_TYPE_OPTIONS" :key="t.value" :value="t.value">{{ t.label }}</SelectItem></SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">用于统计和后续筛选，不影响优先级或负责人。</p>
          </div>
          <div class="space-y-2">
            <Label for="requirement-priority">优先级</Label>
            <Select v-model="form.priority">
              <SelectTrigger id="requirement-priority"><SelectValue placeholder="请选择优先级" /></SelectTrigger>
              <SelectContent><SelectItem v-for="p in PM_PRIORITY_OPTIONS" :key="p.value" :value="p.value">{{ p.label }}</SelectItem></SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">表示排期和处理紧急程度，默认“中”适用于常规需求。</p>
          </div>
          <div class="space-y-2">
            <Label for="requirement-owner">需求负责人（可选）</Label>
            <Select v-model="form.ownerId">
              <SelectTrigger id="requirement-owner"><SelectValue placeholder="请选择需求负责人" /></SelectTrigger>
              <SelectContent><SelectItem :value="PM_NONE_OPTION_VALUE">暂不指定需求负责人</SelectItem><SelectItem v-for="u in ownerUsers" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">负责需求澄清、范围确认和验收；暂不指定表示稍后再补充，不会自动分派。</p>
          </div>
          <div class="space-y-2">
            <Label for="requirement-developer">开发负责人（可选）</Label>
            <Select v-model="form.developerId">
              <SelectTrigger id="requirement-developer"><SelectValue placeholder="请选择开发负责人" /></SelectTrigger>
              <SelectContent><SelectItem :value="PM_NONE_OPTION_VALUE">暂不指定开发负责人</SelectItem><SelectItem v-for="u in developerUsers" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">负责排期后的开发承接；暂不指定时需求仍可保存，但后续需补齐承接人。</p>
          </div>
          <div class="space-y-2">
            <Label for="requirement-start">计划开始（可选）</Label>
            <Input id="requirement-start" v-model="form.plannedStartTime" type="date" />
            <p class="text-xs text-muted-foreground">用于排期和进度统计；不确定时可先留空。</p>
          </div>
          <div class="space-y-2">
            <Label for="requirement-end">计划完成（可选）</Label>
            <Input id="requirement-end" v-model="form.plannedEndTime" type="date" />
            <p class="text-xs text-muted-foreground">用于判断延期和统计交付计划；不确定时可先留空。</p>
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="requirement-description">需求描述（可选）</Label>
            <Textarea id="requirement-description" v-model="form.description" placeholder="描述用户场景、业务价值或问题背景" />
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="requirement-acceptance">验收标准（可选）</Label>
            <Textarea id="requirement-acceptance" v-model="form.acceptanceCriteria" placeholder="描述完成后如何判断需求已达成" />
          </div>
        </div>
        <DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

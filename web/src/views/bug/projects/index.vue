<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast/use-toast'
import TablePagination from '@/components/common/TablePagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import {
  addBugProject,
  bugUserOptions,
  deleteBugMember,
  deleteBugProjects,
  listBugMembers,
  listBugProjects,
  updateBugProject,
  upsertBugMember,
} from '@/api/bug'
import type { BugMember, BugProject, BugUserRef } from '@/api/bug/types'
import { BUG_MEMBER_ROLE_OPTIONS, NONE_OPTION_VALUE, normalizeOptional, optionLabel } from '../shared/bug-options'

const { toast } = useToast()
const rows = ref<BugProject[]>([])
const users = ref<BugUserRef[]>([])
const members = ref<BugMember[]>([])
const total = ref(0)
const open = ref(false)
const memberOpen = ref(false)
const currentProject = ref<BugProject | null>(null)
const query = reactive({ pageNum: 1, pageSize: 20, keyword: '' })
const form = reactive<Partial<BugProject>>({ projectName: '', projectKey: '', description: '', status: '0' })
const memberForm = reactive({ userId: '', memberRole: 'developer', isDefault: false, status: '0' })
const canSave = computed(() => Boolean(form.projectName && form.projectKey))
const canSaveMember = computed(() => Boolean(currentProject.value && memberForm.userId && memberForm.memberRole))

async function getList() {
  const res = await listBugProjects(query)
  rows.value = res.rows
  total.value = res.total
}

function add() {
  Object.assign(form, { projectId: undefined, projectName: '', projectKey: '', ownerId: NONE_OPTION_VALUE, description: '', status: '0' })
  open.value = true
}

function edit(row: BugProject) {
  Object.assign(form, row, { ownerId: row.ownerId || NONE_OPTION_VALUE })
  open.value = true
}

async function save() {
  if (!canSave.value) return
  const payload = { ...form, ownerId: normalizeOptional(form.ownerId) }
  form.projectId ? await updateBugProject(payload) : await addBugProject(payload)
  toast({ title: '保存成功' })
  open.value = false
  getList()
}

async function remove(row: BugProject) {
  await deleteBugProjects([row.projectId])
  toast({ title: '删除成功' })
  getList()
}

async function openMembers(row: BugProject) {
  currentProject.value = row
  await refreshMembers()
  Object.assign(memberForm, { userId: '', memberRole: 'developer', isDefault: false, status: '0' })
  memberOpen.value = true
}

async function refreshMembers() {
  if (!currentProject.value) return
  members.value = await listBugMembers(currentProject.value.projectId)
}

async function saveMember() {
  if (!canSaveMember.value || !currentProject.value) return
  await upsertBugMember(currentProject.value.projectId, memberForm)
  toast({ title: '成员已保存' })
  Object.assign(memberForm, { userId: '', memberRole: 'developer', isDefault: false, status: '0' })
  refreshMembers()
}

async function removeMember(row: BugMember) {
  await deleteBugMember(row.memberId)
  toast({ title: '成员已移除' })
  refreshMembers()
}

onMounted(async () => {
  users.value = await bugUserOptions()
  await getList()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">项目管理</h2>
      <Button v-hasPermi="['bug:project:add']" @click="add">新增项目</Button>
    </div>
    <div class="flex gap-2"><Input v-model="query.keyword" class="w-60" placeholder="项目名称/标识" @keyup.enter="getList" /><Button @click="getList">搜索</Button></div>
    <div class="rounded-md border">
      <Table><TableHeader><TableRow><TableHead>名称</TableHead><TableHead>标识</TableHead><TableHead>负责人</TableHead><TableHead>状态</TableHead><TableHead>描述</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.projectId"><TableCell>{{ row.projectName }}</TableCell><TableCell>{{ row.projectKey }}</TableCell><TableCell>{{ row.owner?.nickName || '-' }}</TableCell><TableCell>{{ row.status === '1' ? '停用' : '启用' }}</TableCell><TableCell>{{ row.description }}</TableCell><TableCell class="space-x-2"><Button v-hasPermi="['bug:project:member']" size="sm" variant="outline" @click="openMembers(row)">成员</Button><Button v-hasPermi="['bug:project:edit']" size="sm" variant="outline" @click="edit(row)">编辑</Button><Button v-hasPermi="['bug:project:remove']" size="sm" variant="destructive" @click="remove(row)">删除</Button></TableCell></TableRow></TableBody></Table>
      <EmptyState v-if="!rows.length" />
    </div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open"><DialogContent><DialogHeader><DialogTitle>项目</DialogTitle></DialogHeader><div class="space-y-3"><Input v-model="form.projectName" placeholder="项目名称" /><Input v-model="form.projectKey" placeholder="项目标识，如 ADMIN" /><Select v-model="form.ownerId"><SelectTrigger><SelectValue placeholder="项目负责人" /></SelectTrigger><SelectContent><SelectItem :value="NONE_OPTION_VALUE">暂不指定</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select><Select v-model="form.status"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">启用</SelectItem><SelectItem value="1">停用</SelectItem></SelectContent></Select><Input v-model="form.description" placeholder="项目描述" /></div><DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter></DialogContent></Dialog>
    <Dialog v-model:open="memberOpen"><DialogContent class="max-w-3xl"><DialogHeader><DialogTitle>{{ currentProject?.projectName }} 成员</DialogTitle></DialogHeader><div class="grid gap-3 md:grid-cols-4"><Select v-model="memberForm.userId"><SelectTrigger><SelectValue placeholder="成员" /></SelectTrigger><SelectContent><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select><Select v-model="memberForm.memberRole"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="r in BUG_MEMBER_ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</SelectItem></SelectContent></Select><label class="flex items-center gap-2 text-sm"><Checkbox :model-value="memberForm.isDefault" @update:model-value="(v) => memberForm.isDefault = !!v" />默认负责人</label><Button :disabled="!canSaveMember" @click="saveMember">添加/更新</Button></div><div class="rounded-md border"><Table><TableHeader><TableRow><TableHead>成员</TableHead><TableHead>角色</TableHead><TableHead>默认</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="m in members" :key="m.memberId"><TableCell>{{ m.user?.nickName || m.user?.userName }}</TableCell><TableCell>{{ optionLabel(BUG_MEMBER_ROLE_OPTIONS, m.memberRole) }}</TableCell><TableCell>{{ m.isDefault ? '是' : '否' }}</TableCell><TableCell>{{ m.status === '1' ? '停用' : '启用' }}</TableCell><TableCell><Button size="sm" variant="destructive" @click="removeMember(m)">移除</Button></TableCell></TableRow></TableBody></Table><EmptyState v-if="!members.length" /></div></DialogContent></Dialog>
  </div>
</template>

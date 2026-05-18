<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast/use-toast'
import TablePagination from '@/components/common/TablePagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import FormFieldBlock from '@/components/common/FormFieldBlock.vue'
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
const loading = ref(false)
const rows = ref<BugProject[]>([])
const users = ref<BugUserRef[]>([])
const memberUsers = ref<BugUserRef[]>([])
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
  loading.value = true
  try {
    const res = await listBugProjects(query)
    rows.value = res.rows
    total.value = res.total
  } finally {
    loading.value = false
  }
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
  Object.assign(memberForm, { userId: '', memberRole: 'developer', isDefault: false, status: '0' })
  await Promise.all([refreshMembers(), refreshMemberUsers(row.projectId, memberForm.memberRole)])
  memberOpen.value = true
}

async function refreshMemberUsers(projectId = currentProject.value?.projectId, memberRole = memberForm.memberRole) {
  if (!projectId) return
  memberUsers.value = await bugUserOptions('', { projectId, memberRole, assignableOnly: true })
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
  await Promise.all([refreshMembers(), refreshMemberUsers()])
}

async function removeMember(row: BugMember) {
  await deleteBugMember(row.memberId)
  toast({ title: '成员已移除' })
  await Promise.all([refreshMembers(), refreshMemberUsers()])
}

onMounted(async () => {
  users.value = await bugUserOptions('', { assignContext: 'projectOwner', assignableOnly: true })
  await getList()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">项目管理</h2>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getList" />
        <Button v-hasPermi="['bug:project:add']" @click="add">新增项目</Button>
      </div>
    </div>
    <div class="flex gap-2"><Input v-model="query.keyword" class="w-60" placeholder="项目名称/标识" @keyup.enter="getList" /><Button @click="getList">搜索</Button></div>
    <div class="rounded-md border">
      <Table><TableHeader><TableRow><TableHead>名称</TableHead><TableHead>标识</TableHead><TableHead>负责人</TableHead><TableHead class="text-center">状态</TableHead><TableHead>描述</TableHead><TableHead class="text-right">操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.projectId"><TableCell>{{ row.projectName }}</TableCell><TableCell>{{ row.projectKey }}</TableCell><TableCell>{{ row.owner?.nickName || '-' }}</TableCell><TableCell class="text-center"><StatusBadge domain="enabled" :value="row.status" /></TableCell><TableCell>{{ row.description }}</TableCell><TableCell class="text-right"><div class="flex justify-end gap-2"><Button v-hasPermi="['bug:project:member']" size="sm" variant="outline" @click="openMembers(row)">成员</Button><Button v-hasPermi="['bug:project:edit']" size="sm" variant="outline" @click="edit(row)">编辑</Button><Button v-hasPermi="['bug:project:remove']" size="sm" variant="destructive" @click="remove(row)">删除</Button></div></TableCell></TableRow></TableBody></Table>
      <EmptyState v-if="!rows.length" />
    </div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ form.projectId ? '编辑项目' : '新增项目' }}</DialogTitle>
          <DialogDescription>请填写项目基础信息；带 * 的字段为必填。</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <FormFieldBlock label="项目名称" field-id="bug-project-name" required description="展示给使用者选择和识别的项目名称。">
            <Input id="bug-project-name" v-model="form.projectName" placeholder="例如：后台管理系统" />
          </FormFieldBlock>
          <FormFieldBlock label="项目标识" field-id="bug-project-key" required description="用于接口、权限和唯一识别，保存后应避免频繁变更。">
            <Input id="bug-project-key" v-model="form.projectKey" placeholder="例如：ADMIN" />
          </FormFieldBlock>
          <FormFieldBlock label="项目负责人" field-id="bug-project-owner" optional description="负责项目维护和进度跟进；暂不指定时后续需补齐负责人。">
            <Select v-model="form.ownerId">
              <SelectTrigger id="bug-project-owner"><SelectValue placeholder="请选择项目负责人" /></SelectTrigger>
              <SelectContent><SelectItem :value="NONE_OPTION_VALUE">暂不指定项目负责人</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent>
            </Select>
          </FormFieldBlock>
          <FormFieldBlock label="项目状态" field-id="bug-project-status" description="停用后该项目不再作为新增 Bug、模块或版本的默认可选项目。">
            <Select v-model="form.status">
              <SelectTrigger id="bug-project-status"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="0">启用</SelectItem><SelectItem value="1">停用</SelectItem></SelectContent>
            </Select>
          </FormFieldBlock>
          <FormFieldBlock label="项目描述" field-id="bug-project-description" optional description="补充项目范围、业务背景或维护说明，便于成员理解项目边界。">
            <Input id="bug-project-description" v-model="form.description" placeholder="例如：后台权限、菜单和配置管理" />
          </FormFieldBlock>
        </div>
        <DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog v-model:open="memberOpen">
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{{ currentProject?.projectName }} 成员</DialogTitle>
          <DialogDescription>配置项目成员角色和默认负责人；带 * 的字段为必填。</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 md:grid-cols-2">
          <FormFieldBlock label="成员" field-id="bug-member-user" required description="只能选择当前角色可分派的项目成员。">
            <Select v-model="memberForm.userId">
              <SelectTrigger id="bug-member-user"><SelectValue placeholder="请选择成员" /></SelectTrigger>
              <SelectContent><SelectItem v-for="u in memberUsers" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent>
            </Select>
          </FormFieldBlock>
          <FormFieldBlock label="成员角色" field-id="bug-member-role" required description="角色决定该成员在 Bug 分派、处理或审核中的可选范围。">
            <Select v-model="memberForm.memberRole" @update:model-value="(v) => { memberForm.memberRole = String(v); memberForm.userId = ''; refreshMemberUsers(currentProject?.projectId, memberForm.memberRole) }">
              <SelectTrigger id="bug-member-role"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem v-for="r in BUG_MEMBER_ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</SelectItem></SelectContent>
            </Select>
          </FormFieldBlock>
          <FormFieldBlock label="默认负责人" field-id="bug-member-default" optional description="同角色默认承接自动分派或默认候选；一个角色建议只保留必要的默认负责人。">
            <label class="flex items-center gap-2 text-sm"><Checkbox id="bug-member-default" :model-value="memberForm.isDefault" @update:model-value="(v) => memberForm.isDefault = !!v" />设为默认负责人</label>
          </FormFieldBlock>
          <div class="flex items-end">
            <Button :disabled="!canSaveMember" @click="saveMember">添加/更新成员</Button>
          </div>
        </div>
        <div class="rounded-md border"><Table><TableHeader><TableRow><TableHead>成员</TableHead><TableHead>角色</TableHead><TableHead class="text-center">默认</TableHead><TableHead class="text-center">状态</TableHead><TableHead class="text-right">操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="m in members" :key="m.memberId"><TableCell>{{ m.user?.nickName || m.user?.userName }}</TableCell><TableCell>{{ optionLabel(BUG_MEMBER_ROLE_OPTIONS, m.memberRole) }}</TableCell><TableCell class="text-center">{{ m.isDefault ? '是' : '否' }}</TableCell><TableCell class="text-center"><StatusBadge domain="enabled" :value="m.status" /></TableCell><TableCell class="text-right"><div class="flex justify-end"><Button size="sm" variant="destructive" @click="removeMember(m)">移除</Button></div></TableCell></TableRow></TableBody></Table><EmptyState v-if="!members.length" /></div>
      </DialogContent>
    </Dialog>
  </div>
</template>

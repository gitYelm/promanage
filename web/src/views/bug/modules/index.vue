<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import TablePagination from '@/components/common/TablePagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { addBugModule, bugProjectOptions, bugUserOptions, deleteBugModules, listBugModules, updateBugModule } from '@/api/bug'
import type { BugModule, BugProject, BugUserRef } from '@/api/bug/types'
import { ALL_OPTION_VALUE, NONE_OPTION_VALUE, normalizeAll, normalizeOptional } from '../shared/bug-options'

const { toast } = useToast()
const rows = ref<BugModule[]>([])
const projects = ref<BugProject[]>([])
const users = ref<BugUserRef[]>([])
const total = ref(0)
const open = ref(false)
const query = reactive({ pageNum: 1, pageSize: 20, projectId: ALL_OPTION_VALUE, keyword: '' })
const form = reactive<Partial<BugModule>>({ projectId: '', moduleName: '', defaultAssigneeId: NONE_OPTION_VALUE, orderNum: 0, status: '0' })
const canSave = computed(() => Boolean(form.projectId && form.moduleName))

async function getList() {
  const res = await listBugModules({ ...query, projectId: normalizeAll(query.projectId) })
  rows.value = res.rows
  total.value = res.total
}

function add() {
  Object.assign(form, {
    moduleId: undefined,
    projectId: normalizeAll(query.projectId) || projects.value[0]?.projectId || '',
    moduleName: '',
    orderNum: 0,
    status: '0',
    defaultAssigneeId: NONE_OPTION_VALUE,
  })
  open.value = true
}

function edit(row: BugModule) {
  Object.assign(form, row, { defaultAssigneeId: row.defaultAssigneeId || NONE_OPTION_VALUE })
  open.value = true
}

async function save() {
  const payload = { ...form, defaultAssigneeId: normalizeOptional(form.defaultAssigneeId) }
  form.moduleId ? await updateBugModule(payload) : await addBugModule(payload)
  toast({ title: '保存成功' })
  open.value = false
  getList()
}

async function remove(row: BugModule) {
  await deleteBugModules([row.moduleId])
  toast({ title: '删除成功' })
  getList()
}

onMounted(async () => {
  projects.value = await bugProjectOptions()
  users.value = await bugUserOptions()
  await getList()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">模块管理</h2>
      <Button v-hasPermi="['bug:module:add']" @click="add">新增模块</Button>
    </div>
    <div class="flex gap-2">
      <Select v-model="query.projectId"><SelectTrigger class="w-48"><SelectValue placeholder="全部项目" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select>
      <Input v-model="query.keyword" class="w-48" placeholder="模块名称" @keyup.enter="getList" />
      <Button @click="getList">搜索</Button>
    </div>
    <div class="rounded-md border">
      <Table><TableHeader><TableRow><TableHead>项目</TableHead><TableHead>模块</TableHead><TableHead>排序</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.moduleId"><TableCell>{{ row.project?.projectName }}</TableCell><TableCell>{{ row.moduleName }}</TableCell><TableCell>{{ row.orderNum }}</TableCell><TableCell><Button v-hasPermi="['bug:module:edit']" size="sm" variant="outline" @click="edit(row)">编辑</Button><Button v-hasPermi="['bug:module:remove']" size="sm" variant="destructive" class="ml-2" @click="remove(row)">删除</Button></TableCell></TableRow></TableBody></Table>
      <EmptyState v-if="!rows.length" />
    </div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open"><DialogContent><DialogHeader><DialogTitle>模块</DialogTitle></DialogHeader><div class="space-y-3"><Select v-model="form.projectId"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select><Input v-model="form.moduleName" placeholder="模块名称" /><Select v-model="form.defaultAssigneeId"><SelectTrigger><SelectValue placeholder="默认负责人" /></SelectTrigger><SelectContent><SelectItem :value="NONE_OPTION_VALUE">暂不指定</SelectItem><SelectItem v-for="u in users" :key="u.userId" :value="u.userId">{{ u.nickName || u.userName }}</SelectItem></SelectContent></Select><Input v-model="form.orderNum" type="number" placeholder="排序" /></div><DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter></DialogContent></Dialog>
  </div>
</template>

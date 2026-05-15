<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import TablePagination from '@/components/common/TablePagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { addBugVersion, bugProjectOptions, deleteBugVersions, listBugVersions, updateBugVersion } from '@/api/bug'
import type { BugProject, BugVersion } from '@/api/bug/types'
import { ALL_OPTION_VALUE, BUG_VERSION_STATUS_OPTIONS, normalizeAll, optionLabel } from '../shared/bug-options'

const { toast } = useToast()
const loading = ref(false)
const rows = ref<BugVersion[]>([])
const projects = ref<BugProject[]>([])
const total = ref(0)
const open = ref(false)
const query = reactive({ pageNum: 1, pageSize: 20, projectId: ALL_OPTION_VALUE, keyword: '' })
const form = reactive<Partial<BugVersion>>({ projectId: '', versionNo: '', versionName: '', status: 'planning' })
const canSave = computed(() => Boolean(form.projectId && form.versionNo))

async function getList() {
  loading.value = true
  try {
    const res = await listBugVersions({ ...query, projectId: normalizeAll(query.projectId) })
    rows.value = res.rows
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function add() {
  Object.assign(form, {
    versionId: undefined,
    projectId: normalizeAll(query.projectId) || projects.value[0]?.projectId || '',
    versionNo: '',
    versionName: '',
    status: 'planning',
  })
  open.value = true
}

function edit(row: BugVersion) {
  Object.assign(form, row)
  open.value = true
}

async function save() {
  form.versionId ? await updateBugVersion(form) : await addBugVersion(form)
  toast({ title: '保存成功' })
  open.value = false
  getList()
}

async function remove(row: BugVersion) {
  await deleteBugVersions([row.versionId])
  toast({ title: '删除成功' })
  getList()
}

onMounted(async () => {
  projects.value = await bugProjectOptions()
  await getList()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">版本管理</h2>
      <div class="flex items-center gap-2">
        <DataRefreshButton :loading="loading" @refresh="getList" />
        <Button v-hasPermi="['bug:version:add']" @click="add">新增版本</Button>
      </div>
    </div>
    <div class="flex gap-2">
      <Select v-model="query.projectId"><SelectTrigger class="w-48"><SelectValue placeholder="全部项目" /></SelectTrigger><SelectContent><SelectItem :value="ALL_OPTION_VALUE">全部项目</SelectItem><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select>
      <Input v-model="query.keyword" class="w-48" placeholder="版本号/名称" @keyup.enter="getList" />
      <Button @click="getList">搜索</Button>
    </div>
    <div class="rounded-md border">
      <Table><TableHeader><TableRow><TableHead>项目</TableHead><TableHead>版本号</TableHead><TableHead>版本名</TableHead><TableHead>状态</TableHead><TableHead>操作</TableHead></TableRow></TableHeader><TableBody><TableRow v-for="row in rows" :key="row.versionId"><TableCell>{{ row.project?.projectName }}</TableCell><TableCell>{{ row.versionNo }}</TableCell><TableCell>{{ row.versionName }}</TableCell><TableCell>{{ optionLabel(BUG_VERSION_STATUS_OPTIONS, row.status) }}</TableCell><TableCell><Button v-hasPermi="['bug:version:edit']" size="sm" variant="outline" @click="edit(row)">编辑</Button><Button v-hasPermi="['bug:version:remove']" size="sm" variant="destructive" class="ml-2" @click="remove(row)">删除</Button></TableCell></TableRow></TableBody></Table>
      <EmptyState v-if="!rows.length" />
    </div>
    <TablePagination v-model:page-num="query.pageNum" v-model:page-size="query.pageSize" :total="total" @change="getList" />
    <Dialog v-model:open="open"><DialogContent><DialogHeader><DialogTitle>版本</DialogTitle></DialogHeader><div class="space-y-3"><Select v-model="form.projectId"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select><Input v-model="form.versionNo" placeholder="版本号" /><Input v-model="form.versionName" placeholder="版本名称" /><Select v-model="form.status"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="item in BUG_VERSION_STATUS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</SelectItem></SelectContent></Select></div><DialogFooter><Button :disabled="!canSave" @click="save">保存</Button></DialogFooter></DialogContent></Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ExportDialog from '@/components/common/ExportDialog.vue'
import ExportTaskList from '@/components/common/ExportTaskList.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import RequirementBatchBar from './components/RequirementBatchBar.vue'
import RequirementDetailDialog from './components/RequirementDetailDialog.vue'
import RequirementImportDialog from '@/views/system/user/UserImportDialog.vue'
import RequirementBatchAssignDialog from './components/RequirementBatchAssignDialog.vue'
import RequirementFormDialog from './components/RequirementFormDialog.vue'
import {
  REQUIREMENT_BATCH_CLEAR_VALUE,
  REQUIREMENT_BATCH_KEEP_VALUE,
  type RequirementBatchAssignFormState,
} from './components/requirement-batch-assign.constants'
import RequirementFilters from './components/RequirementFilters.vue'
import RequirementPageToolbar from './components/RequirementPageToolbar.vue'
import RequirementTable from './components/RequirementTable.vue'
import { useRequirementColumns } from './requirement-columns'
import {
  buildRequirementListQuery,
  createRequirementFilterState,
} from './requirement-query'
import { toggleTableSort } from '@/utils/table-sort'
import { useToast } from '@/components/ui/toast/use-toast'
import { hasAnyPermission, usePermission } from '@/composables/usePermission'
import { bugProjectOptions, bugUserOptions } from '@/api/bug'
import {
  addRequirement,
  batchAssignRequirements,
  deleteRequirements,
  downloadRequirementTemplate,
  getRequirement,
  importRequirementExcel,
  listRequirements,
  runRequirementAction,
  updateRequirement,
} from '@/api/project-management'
import type {
  Requirement,
  RequirementBatchAssignPayload,
  RequirementForm,
} from '@/api/project-management/types'
import type { BugProject, BugUserRef } from '@/api/bug/types'
import {
  PM_NONE_OPTION_VALUE,
  PM_REQUIREMENT_ACTION_OPTIONS,
  pmAvailableActions,
  pmNormalizeOptional,
  toDateInput,
} from '../shared/options'

const { toast } = useToast()
const { columns, visibleColumnMap, toggleColumn, resetColumns } = useRequirementColumns()
const loading = ref(false)
const open = ref(false)
const detailOpen = ref(false)
const batchAssignOpen = ref(false)
const importOpen = ref(false)
const exportOpen = ref(false)
const exportTasksOpen = ref(false)
const importFile = ref<File | null>(null)
const importLoading = ref(false)
const importResult = ref<{ success: number; fail: number; errors: string[] } | null>(null)
const lastExportTaskId = ref<string | null>(null)
const rows = ref<Requirement[]>([])
const total = ref(0)
const detail = ref<Requirement | null>(null)
const projects = ref<BugProject[]>([])
const filterUsers = ref<BugUserRef[]>([])
const ownerUsers = ref<BugUserRef[]>([])
const developerUsers = ref<BugUserRef[]>([])
const testerUsers = ref<BugUserRef[]>([])
const selectedIds = ref<string[]>([])
const query = reactive(createRequirementFilterState())
const form = reactive<RequirementForm>({
  title: '',
  projectId: '',
  type: 'feature',
  priority: 'medium',
  status: 'draft',
  ownerId: PM_NONE_OPTION_VALUE,
  developerId: PM_NONE_OPTION_VALUE,
})
const canShowQuickActionColumn = usePermission(['pm:requirement:status', 'pm:requirement:review'])
const canShowOperationColumn = usePermission(['pm:requirement:view', 'pm:requirement:update'])
const canBatchAssign = usePermission(['pm:requirement:update'])
const hasSelectedRows = computed(() => selectedIds.value.length > 0)
const selectAll = computed({
  get: () => rows.value.length > 0 && rows.value.every((row) => selectedIds.value.includes(row.requirementId)),
  set: (checked: boolean) => {
    selectedIds.value = checked ? rows.value.map((row) => row.requirementId) : []
  },
})
const selectedRows = computed(() =>
  rows.value.filter((row) => selectedIds.value.includes(row.requirementId)),
)
const selectedProjectIds = computed(() => [...new Set(selectedRows.value.map((row) => row.projectId))])
const selectedProjectId = computed(() => (selectedProjectIds.value.length === 1 ? selectedProjectIds.value[0] : ''))
const selectedProjectName = computed(() =>
  selectedProjectIds.value.length === 1 ? selectedRows.value[0]?.project?.projectName || '-' : '多个项目',
)
const batchAssignForm = reactive<RequirementBatchAssignFormState>({
  ownerId: REQUIREMENT_BATCH_KEEP_VALUE,
  developerId: REQUIREMENT_BATCH_KEEP_VALUE,
  testerId: REQUIREMENT_BATCH_KEEP_VALUE,
})

async function getList() {
  loading.value = true
  try {
    const res = await listRequirements(buildRequirementListQuery(query))
    rows.value = res.rows
    total.value = res.total
    selectedIds.value = selectedIds.value.filter((id) =>
      rows.value.some((row) => row.requirementId === id),
    )
  } finally {
    loading.value = false
  }
}
function searchList() {
  query.pageNum = 1
  getList()
}
function resetQuery() {
  Object.assign(query, createRequirementFilterState(query.pageSize))
  getList()
}
function handleSort(key: string) {
  toggleTableSort(query, key)
  getList()
}
async function refreshAssignableUsers(projectId = form.projectId) {
  if (!projectId) return
  ;[ownerUsers.value, developerUsers.value, testerUsers.value] = await Promise.all([
    loadUsers(projectId, 'requirementOwner'),
    loadUsers(projectId, 'requirementDeveloper'),
    loadUsers(projectId, 'requirementTester'),
  ])
}
function loadUsers(projectId: string, assignContext: string) {
  return bugUserOptions('', { projectId, assignContext, assignableOnly: true })
}
function add() {
  Object.assign(form, {
    requirementId: undefined,
    title: '',
    projectId: projects.value[0]?.projectId || '',
    type: 'feature',
    priority: 'medium',
    description: '',
    acceptanceCriteria: '',
    ownerId: PM_NONE_OPTION_VALUE,
    developerId: PM_NONE_OPTION_VALUE,
    plannedStartTime: '',
    plannedEndTime: '',
    status: 'draft',
  })
  refreshAssignableUsers()
  open.value = true
}
function edit(row: Requirement) {
  Object.assign(form, row, {
    ownerId: row.ownerId || PM_NONE_OPTION_VALUE,
    developerId: row.developerId || PM_NONE_OPTION_VALUE,
    plannedStartTime: toDateInput(row.plannedStartTime),
    plannedEndTime: toDateInput(row.plannedEndTime),
  })
  refreshAssignableUsers(row.projectId)
  open.value = true
}
async function openDetail(row: Requirement) {
  try {
    detail.value = await getRequirement(row.requirementId)
    detailOpen.value = true
  } catch {
    toast({ title: '需求详情加载失败', description: '请刷新列表后重试', variant: 'destructive' })
  }
}
async function save() {
  const payload = {
    ...form,
    ownerId: pmNormalizeOptional(form.ownerId),
    developerId: pmNormalizeOptional(form.developerId),
  }
  form.requirementId ? await updateRequirement(payload) : await addRequirement(payload)
  toast({ title: '保存成功' })
  open.value = false
  getList()
}
async function remove(row: Requirement) {
  await deleteRequirements([row.requirementId])
  toast({ title: '删除成功' })
  getList()
}
async function action(row: Requirement, act: string) {
  await runRequirementAction(row.requirementId, act)
  toast({ title: '状态已更新' })
  getList()
}
function quickActions(row: Requirement) {
  return pmAvailableActions(PM_REQUIREMENT_ACTION_OPTIONS, row.status).filter(
    (item) => !item.permissions || hasAnyPermission(item.permissions),
  )
}
function toggleSelect(requirementId: string) {
  const idx = selectedIds.value.indexOf(requirementId)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(requirementId)
}
function resetBatchAssignForm() {
  Object.assign(batchAssignForm, {
    ownerId: REQUIREMENT_BATCH_KEEP_VALUE,
    developerId: REQUIREMENT_BATCH_KEEP_VALUE,
    testerId: REQUIREMENT_BATCH_KEEP_VALUE,
  })
}
async function openBatchAssign() {
  if (!selectedIds.value.length) {
    toast({ title: '请先选择需求', description: '至少选择一条需求后再进行批量修改。', variant: 'destructive' })
    return
  }
  if (selectedProjectIds.value.length !== 1 || !selectedProjectId.value) {
    toast({
      title: '仅支持同一项目批量修改',
      description: '请先按项目筛选，或只勾选同一项目的需求后，再重新指定负责人/开发/测试人员。',
      variant: 'destructive',
    })
    return
  }
  resetBatchAssignForm()
  await refreshAssignableUsers(selectedProjectId.value)
  batchAssignOpen.value = true
}
async function saveBatchAssign() {
  const payload: RequirementBatchAssignPayload = { ids: [...selectedIds.value] }
  ;(['ownerId', 'developerId', 'testerId'] as const).forEach((field) => {
    const value = batchAssignForm[field]
    if (value === REQUIREMENT_BATCH_KEEP_VALUE) return
    payload[field] = value === REQUIREMENT_BATCH_CLEAR_VALUE ? null : value
  })
  await batchAssignRequirements(payload)
  toast({ title: '批量修改成功', description: `已更新 ${selectedIds.value.length} 条需求的人员分工。` })
  batchAssignOpen.value = false
  selectedIds.value = []
  getList()
}
function openImport() {
  importFile.value = null
  importResult.value = null
  importOpen.value = true
}
async function downloadTemplate() {
  try {
    const res = await downloadRequirementTemplate()
    const blob = new Blob([res as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '需求导入模板.xlsx'
    link.click()
    URL.revokeObjectURL(link.href)
  } catch {
    toast({ title: '下载失败', variant: 'destructive' })
  }
}
function handleImportFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  importFile.value = target.files?.[0] || null
}
async function confirmImport() {
  if (!importFile.value) {
    toast({ title: '请选择文件', variant: 'destructive' })
    return
  }
  importLoading.value = true
  try {
    const result = await importRequirementExcel(importFile.value)
    importResult.value = result
    toast({ title: '导入完成', description: `成功 ${result.success} 条，失败 ${result.fail} 条` })
    if (result.success > 0) getList()
  } catch {
    toast({ title: '导入失败', variant: 'destructive' })
  } finally {
    importLoading.value = false
  }
}
function handleExportSuccess(taskId: string) {
  lastExportTaskId.value = taskId
  exportTasksOpen.value = true
}

onMounted(async () => {
  ;[projects.value, filterUsers.value] = await Promise.all([
    bugProjectOptions(),
    bugUserOptions('', { assignableOnly: 'true' }),
  ])
  await getList()
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <RequirementPageToolbar
      :loading="loading"
      :can-batch-assign="canBatchAssign"
      :columns="columns"
      @refresh="getList"
      @batch-assign="openBatchAssign"
      @import="openImport"
      @export="exportOpen = true"
      @show-export-tasks="exportTasksOpen = true"
      @add="add"
      @toggle-column="toggleColumn"
      @reset-columns="resetColumns"
    />
    <RequirementBatchBar
      :visible="hasSelectedRows && canBatchAssign"
      :selected-count="selectedIds.length"
      @batch-assign="openBatchAssign"
      @clear="selectedIds = []"
    />
    <RequirementFilters
      :query="query"
      :projects="projects"
      :users="filterUsers"
      @search="searchList"
      @reset="resetQuery"
    />
    <RequirementTable
      :rows="rows"
      :selected-ids="selectedIds"
      :select-all="selectAll"
      :can-select-rows="canBatchAssign"
      :can-show-quick-action-column="canShowQuickActionColumn"
      :can-show-operation-column="canShowOperationColumn"
      :quick-actions="quickActions"
      :sort-by="query.sortBy"
      :sort-order="query.sortOrder"
      :visible-columns="visibleColumnMap"
      @toggle-select-all="(checked) => (selectAll = checked)"
      @toggle-select="toggleSelect"
      @open-detail="openDetail"
      @edit="edit"
      @remove="remove"
      @action="action"
      @sort="handleSort"
    />
    <TablePagination
      v-model:page-num="query.pageNum"
      v-model:page-size="query.pageSize"
      :total="total"
      @change="getList"
    />
    <RequirementDetailDialog v-model:open="detailOpen" :detail="detail" />
    <RequirementBatchAssignDialog
      v-model:open="batchAssignOpen"
      :selected-count="selectedIds.length"
      :project-name="selectedProjectName"
      :owner-users="ownerUsers"
      :developer-users="developerUsers"
      :tester-users="testerUsers"
      :form="batchAssignForm"
      @save="saveBatchAssign"
    />
    <RequirementFormDialog
      v-model:open="open"
      :form="form"
      :projects="projects"
      :owner-users="ownerUsers"
      :developer-users="developerUsers"
      @project-change="refreshAssignableUsers"
      @save="save"
    />
    <RequirementImportDialog
      v-model:open="importOpen"
      title="导入需求"
      description="上传 Excel 文件批量导入需求数据"
      template-title="下载需求导入模板"
      template-description="请先下载模板，按项目名称、人员账号等规则填写"
      :show-update-support="false"
      :import-file="importFile"
      :import-loading="importLoading"
      :update-support="false"
      :import-result="importResult"
      @download-template="downloadTemplate"
      @file-change="handleImportFileChange"
      @update-support="() => undefined"
      @confirm="confirmImport"
    />
    <ExportDialog
      v-model:open="exportOpen"
      module="pm-requirement"
      module-name="需求数据"
      permission="pm:requirement:view"
      :query-params="buildRequirementListQuery(query)"
      :selected-ids="selectedIds"
      :selected-count="selectedIds.length"
      @success="handleExportSuccess"
    />
    <ExportTaskList v-model:open="exportTasksOpen" permission="pm:requirement:view" :watch-task-id="lastExportTaskId" />
  </div>
</template>

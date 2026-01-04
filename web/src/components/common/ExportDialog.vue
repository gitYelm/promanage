<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2Icon, FileSpreadsheetIcon, FileTextIcon, FileJsonIcon } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import {
  createExportTask,
  getModuleColumns,
  type ExportFormat,
  type ExportScope,
  type ExportColumn,
} from '@/api/common/export'

const props = defineProps<{
  open: boolean
  module: string
  moduleName: string
  queryParams?: Record<string, any>
  selectedIds?: string[]
  selectedCount?: number
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success', taskId: string): void
}>()

const { toast } = useToast()

// 状态
const loading = ref(false)
const columnsLoading = ref(false)
const availableColumns = ref<ExportColumn[]>([])
const selectedColumnKeys = ref<string[]>([])

// 表单
const format = ref<ExportFormat>('xlsx')
const scope = ref<ExportScope>('all')

// 格式选项
const formatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheetIcon, desc: '支持样式，适合查看' },
  { value: 'csv', label: 'CSV (.csv)', icon: FileTextIcon, desc: '体积小，导出快' },
  { value: 'json', label: 'JSON (.json)', icon: FileJsonIcon, desc: '适合开发调试' },
] as const

// 范围选项
const scopeOptions = computed(() => [
  { value: 'all', label: '全部数据' },
  { value: 'selected', label: `选中数据 (${props.selectedCount || 0} 条)`, disabled: !props.selectedCount },
])

// 加载可导出列
async function loadColumns() {
  columnsLoading.value = true
  try {
    const columns = await getModuleColumns(props.module)
    availableColumns.value = columns
    // 默认全选
    selectedColumnKeys.value = columns.map((c: ExportColumn) => c.key)
  } catch {
    toast({ title: '加载列配置失败', variant: 'destructive' })
  } finally {
    columnsLoading.value = false
  }
}

// 监听打开
watch(() => props.open, (val) => {
  if (val) {
    loadColumns()
    format.value = 'xlsx'
    scope.value = props.selectedCount ? 'selected' : 'all'
  }
})

// 全选/取消全选
const allSelected = computed(() => 
  selectedColumnKeys.value.length === availableColumns.value.length
)
function toggleSelectAll() {
  if (allSelected.value) {
    selectedColumnKeys.value = []
  } else {
    selectedColumnKeys.value = availableColumns.value.map((c: ExportColumn) => c.key)
  }
}

// 切换列选择 - 使用计算属性方式
function isColumnSelected(key: string): boolean {
  return selectedColumnKeys.value.includes(key)
}

function setColumnSelected(key: string, checked: boolean) {
  if (checked) {
    if (!selectedColumnKeys.value.includes(key)) {
      selectedColumnKeys.value.push(key)
    }
  } else {
    const idx = selectedColumnKeys.value.indexOf(key)
    if (idx > -1) {
      selectedColumnKeys.value.splice(idx, 1)
    }
  }
}

// 提交导出
async function handleExport() {
  if (selectedColumnKeys.value.length === 0) {
    toast({ title: '请至少选择一列', variant: 'destructive' })
    return
  }

  loading.value = true
  try {
    const columns = availableColumns.value.filter(c => selectedColumnKeys.value.includes(c.key))
    
    const result = await createExportTask({
      module: props.module,
      format: format.value,
      scope: scope.value,
      columns,
      queryParams: props.queryParams,
      selectedIds: scope.value === 'selected' ? props.selectedIds : undefined,
    })

    toast({ title: '导出任务已创建', description: result.taskName })
    emit('update:open', false)
    emit('success', result.taskId)
  } catch {
    toast({ title: '创建导出任务失败', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>导出{{ moduleName }}</DialogTitle>
        <DialogDescription>选择导出格式、范围和列</DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <!-- 导出格式 -->
        <div class="space-y-3">
          <Label>导出格式</Label>
          <RadioGroup v-model="format" class="grid grid-cols-3 gap-3">
            <div
              v-for="opt in formatOptions"
              :key="opt.value"
              class="relative"
            >
              <RadioGroupItem
                :value="opt.value"
                :id="`format-${opt.value}`"
                class="peer sr-only"
              />
              <Label
                :for="`format-${opt.value}`"
                class="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
              >
                <component :is="opt.icon" class="mb-2 h-5 w-5" />
                <span class="text-xs font-medium">{{ opt.label }}</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <!-- 导出范围 -->
        <div class="space-y-3">
          <Label>导出范围</Label>
          <RadioGroup v-model="scope" class="space-y-2">
            <div
              v-for="opt in scopeOptions"
              :key="opt.value"
              class="flex items-center space-x-2"
            >
              <RadioGroupItem
                :value="opt.value"
                :id="`scope-${opt.value}`"
                :disabled="opt.disabled"
              />
              <Label
                :for="`scope-${opt.value}`"
                :class="{ 'text-muted-foreground': opt.disabled }"
              >
                {{ opt.label }}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <!-- 导出列 -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label>导出列 ({{ selectedColumnKeys.length }}/{{ availableColumns.length }})</Label>
            <Button variant="ghost" size="sm" @click="toggleSelectAll">
              {{ allSelected ? '取消全选' : '全选' }}
            </Button>
          </div>
          
          <ScrollArea class="h-[200px] rounded-md border p-3">
            <div v-if="columnsLoading" class="flex items-center justify-center h-full">
              <Loader2Icon class="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
            <div v-else class="grid grid-cols-2 gap-2">
              <div
                v-for="col in availableColumns"
                :key="col.key"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="`col-${col.key}`"
                  :model-value="isColumnSelected(col.key)"
                  @update:model-value="(val) => setColumnSelected(col.key, !!val)"
                />
                <Label :for="`col-${col.key}`" class="text-sm cursor-pointer">
                  {{ col.header }}
                </Label>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">取消</Button>
        <Button @click="handleExport" :disabled="loading || selectedColumnKeys.length === 0">
          <Loader2Icon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          开始导出
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

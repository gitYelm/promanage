<script setup lang="ts">
import { Button } from '@/components/ui/button'
import TableColumnSettingsButton from '@/components/common/TableColumnSettingsButton.vue'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileClock, FileDown, FileUp, MoreHorizontal } from 'lucide-vue-next'
import { usePermission } from '@/composables/usePermission'
import type { TableColumnConfig } from '@/composables/useTableColumns'

defineProps<{
  loading: boolean
  canBatchAssign: boolean
  columns: TableColumnConfig[]
}>()

const emit = defineEmits<{
  refresh: []
  batchAssign: []
  import: []
  export: []
  showExportTasks: []
  add: []
  toggleColumn: [key: string]
  resetColumns: []
}>()

const canShowDataActions = usePermission(['pm:requirement:create', 'pm:requirement:view'])
</script>

<template>
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold">需求管理</h2>
    <div class="flex gap-2">
      <Button v-if="canBatchAssign" variant="outline" @click="emit('batchAssign')">批量修改人员</Button>
      <Button v-hasPermi="['pm:requirement:create']" @click="emit('add')">新增需求</Button>
      <DropdownMenu v-if="canShowDataActions">
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="icon" class="h-9 w-9" title="数据操作" aria-label="数据操作" data-permission-neutral>
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-40">
          <DropdownMenuLabel>数据操作</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem permission="pm:requirement:create" @click="emit('import')">
            <FileUp class="h-4 w-4" />
            导入需求
          </DropdownMenuItem>
          <DropdownMenuItem permission="pm:requirement:view" @click="emit('export')">
            <FileDown class="h-4 w-4" />
            导出数据
          </DropdownMenuItem>
          <DropdownMenuItem permission="pm:requirement:view" @click="emit('showExportTasks')">
            <FileClock class="h-4 w-4" />
            导出任务
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TableColumnSettingsButton
        :columns="columns"
        @toggle="emit('toggleColumn', $event)"
        @reset="emit('resetColumns')"
      />
      <TableRefreshIconButton :loading="loading" @refresh="emit('refresh')" />
    </div>
  </div>
</template>

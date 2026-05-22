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
import { FileClock, FileDown, FileUp, MoreHorizontal, Plus } from 'lucide-vue-next'
import { usePermission } from '@/composables/usePermission'
import type { ColumnConfig } from './UserTable.vue'

defineProps<{
  loading: boolean
  columns: ColumnConfig[]
}>()
const emit = defineEmits<{
  refresh: []
  import: []
  export: []
  showExportTasks: []
  toggleColumn: [key: string]
  resetColumns: []
  add: []
}>()

const canShowDataActions = usePermission(['system:user:import', 'system:user:export'])
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Button size="sm" @click="emit('add')">
      <Plus class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">新增用户</span>
    </Button>
    <DropdownMenu v-if="canShowDataActions">
      <DropdownMenuTrigger as-child>
        <Button
          variant="outline"
          size="icon"
          class="h-9 w-9"
          title="数据操作"
          aria-label="数据操作"
          data-permission-neutral
        >
          <MoreHorizontal class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-40">
        <DropdownMenuLabel>数据操作</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem permission="system:user:import" @click="emit('import')">
          <FileUp class="h-4 w-4" />
          导入用户
        </DropdownMenuItem>
        <DropdownMenuItem permission="system:user:export" @click="emit('export')">
          <FileDown class="h-4 w-4" />
          导出数据
        </DropdownMenuItem>
        <DropdownMenuItem permission="system:user:export" @click="emit('showExportTasks')">
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
</template>

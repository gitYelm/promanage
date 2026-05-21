<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import DataRefreshButton from '@/components/common/DataRefreshButton.vue'
import ExportButton from '@/components/common/ExportButton.vue'
import { Plus, FileDown, FileUp, Settings2 } from 'lucide-vue-next'
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
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <DataRefreshButton :loading="loading" @refresh="emit('refresh')" />
    <Button variant="outline" size="sm" @click="emit('import')">
      <FileUp class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">导入</span>
    </Button>
    <ExportButton size="sm" @export="emit('export')" />
    <Button variant="outline" size="sm" title="导出任务" @click="emit('showExportTasks')">
      <FileDown class="h-4 w-4" />
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="icon" class="h-8 w-8 sm:h-9 sm:w-9">
          <Settings2 class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuLabel>显示列</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          v-for="col in columns"
          :key="col.key"
          :checked="col.visible"
          :disabled="col.fixed"
          @select="
            (event: Event) => {
              event.preventDefault()
              emit('toggleColumn', col.key)
            }
          "
        >
          {{ col.label }}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem @select="emit('resetColumns')">重置默认</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Button size="sm" @click="emit('add')">
      <Plus class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">新增用户</span>
    </Button>
  </div>
</template>

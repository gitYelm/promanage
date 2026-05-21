<script setup lang="ts">
import { Button } from '@/components/ui/button'
import TableColumnSettingsButton from '@/components/common/TableColumnSettingsButton.vue'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import ExportButton from '@/components/common/ExportButton.vue'
import { Plus, FileDown, FileUp } from 'lucide-vue-next'
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
    <Button variant="outline" size="sm" @click="emit('import')">
      <FileUp class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">导入</span>
    </Button>
    <ExportButton size="sm" @export="emit('export')" />
    <Button variant="outline" size="sm" title="导出任务" @click="emit('showExportTasks')">
      <FileDown class="h-4 w-4" />
    </Button>
    <Button size="sm" @click="emit('add')">
      <Plus class="h-4 w-4 sm:mr-2" />
      <span class="hidden sm:inline">新增用户</span>
    </Button>
    <TableColumnSettingsButton
      :columns="columns"
      @toggle="emit('toggleColumn', $event)"
      @reset="emit('resetColumns')"
    />
    <TableRefreshIconButton :loading="loading" @refresh="emit('refresh')" />
  </div>
</template>

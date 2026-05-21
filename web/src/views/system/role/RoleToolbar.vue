<script setup lang="ts">
import { Button } from '@/components/ui/button'
import TableColumnSettingsButton from '@/components/common/TableColumnSettingsButton.vue'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import type { TableColumnConfig } from '@/composables/useTableColumns'

defineProps<{
  loading: boolean
  columns: TableColumnConfig[]
}>()

const emit = defineEmits<{
  refresh: []
  toggleColumn: [key: string]
  resetColumns: []
  add: []
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <Button @click="emit('add')">新增角色</Button>
    <TableColumnSettingsButton
      :columns="columns"
      @toggle="emit('toggleColumn', $event)"
      @reset="emit('resetColumns')"
    />
    <TableRefreshIconButton :loading="loading" @refresh="emit('refresh')" />
  </div>
</template>

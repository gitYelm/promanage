<script setup lang="ts">
import { Button } from '@/components/ui/button'
import TableColumnSettingsButton from '@/components/common/TableColumnSettingsButton.vue'
import TableRefreshIconButton from '@/components/common/TableRefreshIconButton.vue'
import type { TableColumnConfig } from '@/composables/useTableColumns'

defineProps<{
  loading: boolean
  canBatchAssign: boolean
  columns: TableColumnConfig[]
}>()

const emit = defineEmits<{
  refresh: []
  batchAssign: []
  add: []
  toggleColumn: [key: string]
  resetColumns: []
}>()
</script>

<template>
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold">需求管理</h2>
    <div class="flex gap-2">
      <Button v-if="canBatchAssign" variant="outline" @click="emit('batchAssign')">批量修改人员</Button>
      <Button v-hasPermi="['pm:requirement:create']" @click="emit('add')">新增需求</Button>
      <TableColumnSettingsButton
        :columns="columns"
        @toggle="emit('toggleColumn', $event)"
        @reset="emit('resetColumns')"
      />
      <TableRefreshIconButton :loading="loading" @refresh="emit('refresh')" />
    </div>
  </div>
</template>

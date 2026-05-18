<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { SysRole } from '@/api/system/types'

const deleteOpen = defineModel<boolean>('deleteOpen', { required: true })
const batchDeleteOpen = defineModel<boolean>('batchDeleteOpen', { required: true })
const batchStatusOpen = defineModel<boolean>('batchStatusOpen', { required: true })

defineProps<{
  roleToDelete: SysRole | null
  selectedCount: number
  batchStatusType: '0' | '1'
}>()

const emit = defineEmits<{
  confirmDelete: []
  confirmBatchDelete: []
  confirmBatchStatus: []
}>()
</script>

<template>
  <ConfirmDialog
    v-model:open="deleteOpen"
    title="确认删除"
    :description="`您确定要删除角色 &quot;${roleToDelete?.roleName}&quot; 吗？此操作无法撤销。`"
    confirm-text="删除"
    destructive
    @confirm="emit('confirmDelete')"
  />

  <ConfirmDialog
    v-model:open="batchDeleteOpen"
    title="确认批量删除"
    :description="`您确定要删除选中的 ${selectedCount} 个角色吗？此操作无法撤销。`"
    confirm-text="删除"
    destructive
    @confirm="emit('confirmBatchDelete')"
  />

  <ConfirmDialog
    v-model:open="batchStatusOpen"
    :title="`确认批量${batchStatusType === '0' ? '启用' : '停用'}`"
    :description="`您确定要${batchStatusType === '0' ? '启用' : '停用'}选中的 ${selectedCount} 个角色吗？`"
    confirm-text="确定"
    @confirm="emit('confirmBatchStatus')"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUpdated, ref } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import {
  actionColumnPermissionsForLabel,
  hasTextAlignClass,
  inferTableCellAlignClass,
  isActionColumnLabel,
  updateEmptyActionColumnVisibility,
} from './table-align'
import { usePermission } from '@/composables/usePermission'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const cellRef = ref<HTMLTableCellElement | null>(null)
const inferredAlignClass = ref<string>()
const effectiveAlignClass = computed(() =>
  hasTextAlignClass(props.class) ? undefined : inferredAlignClass.value,
)
const routeActionPermissions = computed(() => {
  const cell = cellRef.value
  const header = cell?.closest('table')?.tHead?.rows?.[0]?.cells?.[cell.cellIndex]
  return actionColumnPermissionsForLabel(header?.textContent || '')
})
const canShowRouteActionColumn = usePermission(routeActionPermissions)
const routeActionColumnHidden = computed(() => {
  const cell = cellRef.value
  const header = cell?.closest('table')?.tHead?.rows?.[0]?.cells?.[cell.cellIndex]
  return (
    routeActionPermissions.value.length > 0 &&
    isActionColumnLabel(header?.textContent || '') &&
    !canShowRouteActionColumn.value
  )
})

function updateAlignClass() {
  const cell = cellRef.value
  inferredAlignClass.value = inferTableCellAlignClass(cell)
  const header = cell?.closest('table')?.tHead?.rows?.[0]?.cells?.[cell.cellIndex]
  void nextTick(() => updateEmptyActionColumnVisibility(header))
}

onMounted(updateAlignClass)
onUpdated(updateAlignClass)
</script>

<template>
  <td
    ref="cellRef"
    :class="
      cn(
        'p-2 align-middle data-[empty-action-column]:hidden [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5',
        effectiveAlignClass,
        routeActionColumnHidden && 'hidden',
        props.class,
      )
    "
  >
    <slot />
  </td>
</template>

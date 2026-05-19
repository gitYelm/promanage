<script setup lang="ts">
import { computed, nextTick, onMounted, onUpdated, ref, useSlots } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import {
  actionColumnPermissionsForLabel,
  inferTableAlignClass,
  isActionColumnLabel,
  slotTextFromNodes,
  updateEmptyActionColumnVisibility,
} from './table-align'
import { usePermission } from '@/composables/usePermission'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const slots = useSlots()
const headRef = ref<HTMLTableCellElement | null>(null)
const headerLabel = computed(() => slotTextFromNodes(slots.default?.()))
const inferredAlignClass = computed(() => inferTableAlignClass(headerLabel.value))
const routeActionPermissions = computed(() => actionColumnPermissionsForLabel(headerLabel.value))
const canShowRouteActionColumn = usePermission(routeActionPermissions)
const routeActionColumnHidden = computed(
  () =>
    routeActionPermissions.value.length > 0 &&
    isActionColumnLabel(headerLabel.value) &&
    !canShowRouteActionColumn.value,
)

function updateColumnVisibility() {
  void nextTick(() => updateEmptyActionColumnVisibility(headRef.value))
}

onMounted(updateColumnVisibility)
onUpdated(updateColumnVisibility)
</script>

<template>
  <th
    ref="headRef"
    :class="
      cn(
        'h-10 px-2 text-left align-middle font-medium text-muted-foreground data-[empty-action-column]:hidden [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5',
        inferredAlignClass,
        routeActionColumnHidden && 'hidden',
        props.class,
      )
    "
  >
    <slot />
  </th>
</template>

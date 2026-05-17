<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { hasTextAlignClass, inferTableCellAlignClass } from './table-align'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const cellRef = ref<HTMLTableCellElement | null>(null)
const inferredAlignClass = ref<string>()
const effectiveAlignClass = computed(() => (hasTextAlignClass(props.class) ? undefined : inferredAlignClass.value))

function updateAlignClass() {
  inferredAlignClass.value = inferTableCellAlignClass(cellRef.value)
}

onMounted(updateAlignClass)
onUpdated(updateAlignClass)
</script>

<template>
  <td
    ref="cellRef"
    :class="
      cn(
        'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5',
        effectiveAlignClass,
        props.class,
      )
    "
  >
    <slot />
  </td>
</template>

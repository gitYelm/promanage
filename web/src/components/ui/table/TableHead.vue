<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { inferTableAlignClass, slotTextFromNodes } from './table-align'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const slots = useSlots()
const inferredAlignClass = computed(() => inferTableAlignClass(slotTextFromNodes(slots.default?.())))
</script>

<template>
  <th
    :class="
      cn(
        'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5',
        inferredAlignClass,
        props.class,
      )
    "
  >
    <slot />
  </th>
</template>

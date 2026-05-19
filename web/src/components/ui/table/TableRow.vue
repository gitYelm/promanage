<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

defineOptions({
  inheritAttrs: false,
})
</script>

<template>
  <tr
    v-bind="$attrs"
    :class="
      cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', props.class)
    "
  >
    <slot />
  </tr>
</template>

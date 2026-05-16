<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getPriorityLabel, getPriorityStyle } from '@/utils/semantic-styles'

const props = withDefaults(
  defineProps<{
    value?: string
    label?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    value: undefined,
    label: undefined,
  },
)
</script>

<template>
  <Badge variant="outline" :class="cn(getPriorityStyle(value).badgeClass, props.class)">
    {{ label || getPriorityLabel(value) }}
  </Badge>
</template>

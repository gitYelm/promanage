<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getRiskLabel, getRiskStyle } from '@/utils/semantic-styles'

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
  <Badge variant="outline" :class="cn(getRiskStyle(value).tagClass, props.class)">
    {{ label || getRiskLabel(value) }}
  </Badge>
</template>

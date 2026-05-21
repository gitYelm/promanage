<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getSemanticStyle, type SemanticTone } from '@/utils/semantic-styles'

const props = withDefaults(
  defineProps<{
    tone?: SemanticTone
    label?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    tone: 'neutral',
    label: undefined,
  },
)
</script>

<template>
  <Badge variant="outline" :class="cn(getSemanticStyle(tone).tagClass, props.class)">
    <slot>{{ label }}</slot>
  </Badge>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getSemanticStyle, type SemanticTone } from '@/utils/semantic-styles'

const props = withDefaults(
  defineProps<{
    title: string
    value?: string | number
    tone?: SemanticTone
    description?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    value: 0,
    tone: 'neutral',
    description: '',
  },
)
</script>

<template>
  <Card :class="cn(getSemanticStyle(tone).cardClass, props.class)">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm text-muted-foreground">{{ title }}</CardTitle>
    </CardHeader>
    <CardContent>
      <div :class="cn('text-3xl font-bold tabular-nums', getSemanticStyle(tone).textClass)">
        {{ value ?? 0 }}
      </div>
      <p v-if="description" class="mt-1 text-xs text-muted-foreground">{{ description }}</p>
    </CardContent>
  </Card>
</template>

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
    interactive?: boolean
  }>(),
  {
    value: 0,
    tone: 'neutral',
    description: '',
    interactive: false,
  },
)
const emit = defineEmits<{
  activate: []
}>()

function activate() {
  if (props.interactive) emit('activate')
}
</script>

<template>
  <Card
    :class="
      cn(
        getSemanticStyle(tone).cardClass,
        interactive &&
          'cursor-pointer select-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        props.class,
      )
    "
    :tabindex="interactive ? 0 : undefined"
    :role="interactive ? 'button' : undefined"
    :title="interactive ? '双击查看关联列表' : undefined"
    @keyup.enter="activate"
    @dblclick="activate"
  >
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

<script setup lang="ts">
import type { ProgressRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import { cn } from '@/lib/utils'
import { getSemanticStyle, type SemanticTone } from '@/utils/semantic-styles'

const props = withDefaults(
  defineProps<ProgressRootProps & { tone?: SemanticTone; class?: HTMLAttributes['class'] }>(),
  {
    modelValue: 0,
    tone: 'neutral',
  },
)

const delegatedProps = reactiveOmit(props, 'class', 'tone')
</script>

<template>
  <ProgressRoot
    v-bind="delegatedProps"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full', getSemanticStyle(tone).progressTrackClass, props.class)"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 transition-all"
      :class="getSemanticStyle(tone).progressClass"
      :style="`transform: translateX(-${100 - (props.modelValue ?? 0)}%);`"
    />
  </ProgressRoot>
</template>

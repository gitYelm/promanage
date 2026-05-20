<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    title: string
    count?: number | string | null
    badgeClass?: HTMLAttributes['class']
    cardClass?: HTMLAttributes['class']
    contentClass?: HTMLAttributes['class']
    scrollable?: boolean
  }>(),
  {
    count: null,
    badgeClass: undefined,
    cardClass: undefined,
    contentClass: undefined,
    scrollable: true,
  },
)
</script>

<template>
  <Card :class="cn('flex flex-col h-[36rem]', props.cardClass)">
    <CardHeader class="border-b border-border/60 pb-3">
      <CardTitle class="flex items-center justify-between gap-3 text-sm">
        <span>{{ props.title }}</span>
        <Badge v-if="props.count !== null" variant="outline" :class="props.badgeClass">
          {{ props.count }}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent class="flex-1 min-h-0 pt-4">
      <div
        :class="
          cn(
            props.scrollable && 'h-full overflow-y-auto overscroll-contain pr-3 pb-3',
            props.contentClass,
          )
        "
      >
        <slot />
      </div>
    </CardContent>
  </Card>
</template>

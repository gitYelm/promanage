<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Button } from '@/components/ui/button'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { cn } from '@/lib/utils'
import type { Requirement } from '@/api/project-management/types'

const props = withDefaults(
  defineProps<{
    row: Requirement
    metaText?: string
    secondaryText?: string
    interactive?: boolean
    showPriority?: boolean
    cardClass?: HTMLAttributes['class']
  }>(),
  {
    metaText: '',
    secondaryText: '',
    interactive: false,
    showPriority: true,
    cardClass: undefined,
  },
)

const emit = defineEmits<{
  detail: [row: Requirement]
}>()

function openDetail() {
  if (!props.interactive) return
  emit('detail', props.row)
}
</script>

<template>
  <div
    :class="
      cn(
        'rounded-md border bg-background p-3 text-sm shadow-sm transition hover:shadow-md',
        props.cardClass,
      )
    "
    :title="props.interactive ? '双击查看需求详情' : undefined"
    @dblclick="openDetail"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="line-clamp-2 font-medium">
        {{ props.row.title }}
      </div>
      <Button
        v-if="props.interactive"
        permission="pm:requirement:view"
        size="xs"
        variant="outline"
        @click.stop="openDetail"
      >
        详情
      </Button>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2">
      <StatusBadge domain="requirement" :value="props.row.status" />
      <PriorityBadge v-if="props.showPriority" :value="props.row.priority" />
    </div>
    <div v-if="props.metaText" class="mt-2 text-xs text-muted-foreground">
      {{ props.metaText }}
    </div>
    <div v-if="props.secondaryText" class="mt-1 text-xs text-muted-foreground">
      {{ props.secondaryText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { Button } from '@/components/ui/button'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    expandText?: string
    collapseText?: string
  }>(),
  {
    title: '搜索条件',
    description: '默认展示常用条件，展开后可使用完整筛选。',
    expandText: '展开筛选',
    collapseText: '收起筛选',
  },
)

const expanded = ref(false)
const slots = useSlots()
const hasExpandedFilters = computed(() => Boolean(slots.expanded))
</script>

<template>
  <div class="space-y-4 rounded-lg border bg-background p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-medium">{{ title }}</h3>
        <p v-if="description" class="text-xs text-muted-foreground">{{ description }}</p>
      </div>
      <Button
        v-if="hasExpandedFilters"
        variant="outline"
        size="sm"
        data-permission-neutral
        @click="expanded = !expanded"
      >
        {{ expanded ? collapseText : expandText }}
      </Button>
    </div>

    <slot />

    <div v-if="expanded && hasExpandedFilters" class="space-y-4 border-t pt-4">
      <slot name="expanded" />
    </div>
  </div>
</template>

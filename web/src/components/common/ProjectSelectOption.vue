<script setup lang="ts">
import { computed } from 'vue'
import ProjectBadge from '@/components/common/ProjectBadge.vue'

const props = withDefaults(
  defineProps<{
    name?: string
    code?: string
    stage?: string
    ownerName?: string
  }>(),
  {
    name: undefined,
    code: undefined,
    stage: undefined,
    ownerName: undefined,
  },
)

const metaText = computed(() => {
  const items = [props.stage, props.ownerName ? `负责人：${props.ownerName}` : ''].filter(Boolean)
  return items.join(' · ')
})
</script>

<template>
  <span class="flex min-w-0 flex-col gap-1">
    <ProjectBadge :name="name" :code="code" class="w-fit max-w-full" />
    <span v-if="metaText" class="truncate text-xs font-normal text-muted-foreground">{{ metaText }}</span>
  </span>
</template>

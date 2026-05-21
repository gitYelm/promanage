<script setup lang="ts">
import { computed } from 'vue'
import ProjectBadge from '@/components/common/ProjectBadge.vue'
import { getStatusLabel } from '@/utils/semantic-styles'

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

function formatProjectStage(stage?: string) {
  const value = stage?.trim()
  if (!value) return ''

  const label = getStatusLabel('projectStage', value, '')
  if (label && label !== value) return label

  // 避免把 internal_test / release_ready 这类后端枚举值直接暴露给业务用户。
  return /^[a-z][a-z0-9_-]*$/i.test(value) ? '' : value
}

const displayStage = computed(() => formatProjectStage(props.stage))
const metaText = computed(() => {
  const items = [displayStage.value, props.ownerName ? `负责人：${props.ownerName}` : ''].filter(Boolean)
  return items.join(' · ')
})
</script>

<template>
  <span class="flex min-w-0 flex-col gap-1">
    <ProjectBadge :name="name" :code="code" class="w-fit max-w-full" />
    <span v-if="metaText" class="truncate text-xs font-normal text-muted-foreground">{{ metaText }}</span>
  </span>
</template>

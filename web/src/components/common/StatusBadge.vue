<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getStatusLabel, getStatusStyle, type StatusDomain } from '@/utils/semantic-styles'

const props = withDefaults(
  defineProps<{
    domain: StatusDomain
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
  <Badge variant="outline" :class="cn(getStatusStyle(domain, value).badgeClass, props.class)">
    {{ label || getStatusLabel(domain, value) }}
  </Badge>
</template>

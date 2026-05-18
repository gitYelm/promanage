<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    label: string
    fieldId?: string
    description?: string
    required?: boolean
    optional?: boolean
    class?: HTMLAttributes['class']
  }>(),
  {
    fieldId: undefined,
    description: undefined,
    required: false,
    optional: false,
    class: undefined,
  },
)
</script>

<template>
  <div :class="cn('space-y-2', props.class)">
    <Label :for="fieldId">
      {{ label }}
      <span v-if="required" class="text-destructive">*</span>
      <span v-else-if="optional" class="text-muted-foreground">（可选）</span>
    </Label>
    <slot />
    <p v-if="description" class="text-xs leading-relaxed text-muted-foreground">
      {{ description }}
    </p>
  </div>
</template>

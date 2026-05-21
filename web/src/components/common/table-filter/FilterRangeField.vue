<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const start = defineModel<string | number | undefined>('start', { required: true })
const end = defineModel<string | number | undefined>('end', { required: true })

const props = withDefaults(
  defineProps<{
    label: string
    type?: 'number' | 'date' | 'datetime-local'
    min?: string | number
    max?: string | number
    startPlaceholder?: string
    endPlaceholder?: string
  }>(),
  {
    type: 'date',
    min: undefined,
    max: undefined,
    startPlaceholder: '开始值',
    endPlaceholder: '结束值',
  },
)
</script>

<template>
  <div class="space-y-1">
    <Label>{{ props.label }}</Label>
    <div class="flex items-center gap-2">
      <Input
        v-model="start"
        :type="props.type"
        :min="props.min"
        :max="props.max"
        :placeholder="props.startPlaceholder"
      />
      <span class="text-xs text-muted-foreground">至</span>
      <Input
        v-model="end"
        :type="props.type"
        :min="props.min"
        :max="props.max"
        :placeholder="props.endPlaceholder"
      />
    </div>
  </div>
</template>

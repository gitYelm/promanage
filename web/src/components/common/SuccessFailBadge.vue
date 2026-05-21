<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import SemanticTag from '@/components/common/SemanticTag.vue'

type SuccessFailValue = string | number | boolean | null | undefined

const props = withDefaults(
  defineProps<{
    value?: SuccessFailValue
    successValues?: SuccessFailValue[]
    successLabel?: string
    failLabel?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    value: undefined,
    successValues: () => [0, '0', 'success', true],
    successLabel: '成功',
    failLabel: '失败',
  },
)

const isSuccess = computed(() =>
  props.successValues.some((item) => String(item) === String(props.value)),
)
</script>

<template>
  <SemanticTag :tone="isSuccess ? 'success' : 'danger'" :class="props.class">
    {{ isSuccess ? successLabel : failLabel }}
  </SemanticTag>
</template>

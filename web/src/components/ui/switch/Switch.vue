<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { cn } from '@/lib/utils'

// 扩展 props 支持 checked 作为 modelValue 的别名
interface ExtendedSwitchProps extends Omit<SwitchRootProps, 'modelValue'> {
  class?: HTMLAttributes['class']
  checked?: boolean
  modelValue?: boolean
}

const props = defineProps<ExtendedSwitchProps>()

const emits = defineEmits<
  SwitchRootEmits & {
    'update:checked': [value: boolean]
  }
>()

// 计算实际的 modelValue
const internalValue = computed(() => {
  // checked 优先级高于 modelValue
  if (props.checked !== undefined) return props.checked
  if (props.modelValue !== undefined) return props.modelValue
  return false
})

// 监听变化，同时触发两个事件
function handleUpdate(value: boolean) {
  emits('update:modelValue', value)
  emits('update:checked', value)
}
</script>

<template>
  <SwitchRoot
    :model-value="internalValue"
    :disabled="props.disabled"
    :required="props.required"
    :name="props.name"
    :class="
      cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        props.class
      )
    "
    @update:model-value="handleUpdate"
  >
    <SwitchThumb
      :class="
        cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
        )
      "
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>

<script setup lang="ts">
import type { DialogTitleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, inject, useSlots, watchEffect } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogTitle, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { slotTextFromNodes } from '@/utils/permission-visibility'
import { DIALOG_CONTEXT_KEY } from './context'

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes['class'] }>()
const slots = useSlots()
const dialogContext = inject(DIALOG_CONTEXT_KEY, null)

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
const titleText = computed(() => slotTextFromNodes(slots.default?.()).trim())

watchEffect(() => {
  if (dialogContext) {
    dialogContext.titleText.value = titleText.value
  }
})
</script>

<template>
  <DialogTitle
    v-bind="forwardedProps"
    :class="cn('text-lg font-semibold leading-none tracking-tight', props.class)"
  >
    <slot />
  </DialogTitle>
</template>

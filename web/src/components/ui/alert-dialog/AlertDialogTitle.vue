<script setup lang="ts">
import type { AlertDialogTitleProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, inject, useSlots, watchEffect } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogTitle } from 'reka-ui'
import { cn } from '@/lib/utils'
import { slotTextFromNodes } from '@/utils/permission-visibility'
import { ALERT_DIALOG_CONTEXT_KEY } from './context'

const props = defineProps<AlertDialogTitleProps & { class?: HTMLAttributes['class'] }>()
const slots = useSlots()
const dialogContext = inject(ALERT_DIALOG_CONTEXT_KEY, null)

const delegatedProps = reactiveOmit(props, 'class')
const titleText = computed(() => slotTextFromNodes(slots.default?.()).trim())

watchEffect(() => {
  if (dialogContext) {
    dialogContext.titleText.value = titleText.value
  }
})
</script>

<template>
  <AlertDialogTitle v-bind="delegatedProps" :class="cn('text-lg font-semibold', props.class)">
    <slot />
  </AlertDialogTitle>
</template>

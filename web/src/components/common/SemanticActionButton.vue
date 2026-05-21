<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getSemanticStyle, type SemanticTone } from '@/utils/semantic-styles'
import type { PermissionFlagInput } from '@/utils/permission-visibility'

const ACTION_TONE_MAP: Record<string, SemanticTone> = {
  submit: 'info',
  review: 'warning',
  approve: 'success',
  plan: 'info',
  start: 'info',
  start_dev: 'info',
  test: 'warning',
  submit_test: 'warning',
  accept: 'success',
  release: 'success',
  complete: 'success',
  achieve: 'success',
  close: 'neutral',
  pause: 'warning',
  delay: 'overdue',
  cancel: 'danger',
  reject: 'danger',
  reopen: 'danger',
  confirm: 'success',
  cannot_reproduce: 'danger',
  duplicate: 'neutral',
  suspend: 'danger',
  restore: 'info',
  assign: 'info',
  start_fix: 'info',
  submit_verify: 'warning',
  verify_pass: 'success',
  verify_fail: 'danger',
}

const props = withDefaults(
  defineProps<{
    action?: string
    tone?: SemanticTone
    permissions?: PermissionFlagInput
    class?: HTMLAttributes['class']
  }>(),
  {
    action: undefined,
    tone: undefined,
  },
)

function actionTone(action?: string, tone?: SemanticTone) {
  return tone || (action ? ACTION_TONE_MAP[action] : undefined) || 'neutral'
}
</script>

<template>
  <Button
    variant="outline"
    size="sm"
    :permission="permissions"
    :class="cn(getSemanticStyle(actionTone(action, tone)).actionButtonClass, 'whitespace-nowrap font-semibold', props.class)"
  >
    <slot />
  </Button>
</template>

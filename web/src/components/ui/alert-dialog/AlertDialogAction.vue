<script setup lang="ts">
import type { AlertDialogActionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, inject, useAttrs, useSlots } from 'vue'
import { useRoute } from 'vue-router'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogAction } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { hasAnyPermission } from '@/composables/usePermission'
import {
  buttonPermissionsForRoute,
  normalizePermissionFlags,
  slotIconKeysFromNodes,
  slotTextFromNodes,
  stringAttr,
  type PermissionFlagInput,
} from '@/utils/permission-visibility'
import { ALERT_DIALOG_CONTEXT_KEY } from './context'

const props = withDefaults(
  defineProps<
    AlertDialogActionProps & {
      class?: HTMLAttributes['class']
      permission?: PermissionFlagInput
      hideWhenNoPermission?: boolean
    }
  >(),
  {
    hideWhenNoPermission: true,
  },
)

const attrs = useAttrs()
const slots = useSlots()
const route = useRoute()
const dialogContext = inject(ALERT_DIALOG_CONTEXT_KEY, null)

const delegatedProps = reactiveOmit(props, 'class', 'permission', 'hideWhenNoPermission')
const permissionFlags = computed(() => {
  const explicitPermissions = normalizePermissionFlags(props.permission)
  if (explicitPermissions.length) return explicitPermissions
  if (attrs['data-permission-neutral'] !== undefined) return []

  // 确认弹窗的按钮常写成“确定/确认”，优先按弹窗标题识别业务动作。
  const dialogTitlePermissions = buttonPermissionsForRoute(route.path, {
    text: dialogContext?.titleText.value,
  })
  if (dialogTitlePermissions.length) return dialogTitlePermissions

  return buttonPermissionsForRoute(route.path, {
    text: slotTextFromNodes(slots.default?.()),
    title: stringAttr(attrs.title),
    ariaLabel: stringAttr(attrs['aria-label']),
    iconKeys: slotIconKeysFromNodes(slots.default?.()),
  })
})
const canRender = computed(
  () =>
    !props.hideWhenNoPermission ||
    permissionFlags.value.length === 0 ||
    hasAnyPermission(permissionFlags.value),
)
</script>

<template>
  <AlertDialogAction
    v-if="canRender"
    v-bind="delegatedProps"
    :class="cn(buttonVariants(), props.class)"
  >
    <slot />
  </AlertDialogAction>
</template>

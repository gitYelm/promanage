<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, inject, useAttrs, useSlots } from 'vue'
import { useRoute } from 'vue-router'
import type { ButtonVariants } from '.'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '.'
import { hasAnyPermission } from '@/composables/usePermission'
import {
  attrHasKey,
  buttonPermissionsForRoute,
  normalizePermissionFlags,
  slotIconKeysFromNodes,
  slotTextFromNodes,
  stringAttr,
  type PermissionFlagInput,
} from '@/utils/permission-visibility'
import { DIALOG_CONTEXT_KEY } from '@/components/ui/dialog/context'

const EVENT_HANDLER_KEYS = ['onClick', 'onMousedown', 'onMouseup', 'onPointerdown', 'onPointerup']
const defaultNeutralButtonTypes = new Set(['button', 'reset'])

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  permission?: PermissionFlagInput
  hideWhenNoPermission?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  hideWhenNoPermission: true,
})

const attrs = useAttrs()
const slots = useSlots()
const route = useRoute()
const dialogContext = inject(DIALOG_CONTEXT_KEY, null)
const submitActionKeys = ['确定', '确认', '保存', '提交', '开始导入', '添加/更新成员']
const isNativeButton = computed(() => !props.asChild && (!props.as || props.as === 'button'))
const hasEventHandler = computed(() => EVENT_HANDLER_KEYS.some((key) => attrs[key] !== undefined))
const shouldTreatAsPermissionNeutral = computed(
  () =>
    attrHasKey(attrs, 'data-permission-neutral') ||
    (
      isNativeButton.value &&
      !hasEventHandler.value &&
      defaultNeutralButtonTypes.has(String(attrs.type || 'button'))
    ),
)
const permissionFlags = computed(() => {
  const explicitPermissions = normalizePermissionFlags(props.permission)
  if (explicitPermissions.length) return explicitPermissions
  if (shouldTreatAsPermissionNeutral.value) return []
  const text = slotTextFromNodes(slots.default?.()).trim()
  if (submitActionKeys.some((key) => text.includes(key))) {
    const dialogTitlePermissions = buttonPermissionsForRoute(route.path, {
      text: dialogContext?.titleText.value,
    })
    if (dialogTitlePermissions.length) return dialogTitlePermissions
  }
  return buttonPermissionsForRoute(route.path, {
    text,
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
  <span
    v-if="!canRender"
    class="hidden"
    aria-hidden="true"
    data-permission-hidden-placeholder
  />
  <Primitive
    v-else-if="canRender"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>

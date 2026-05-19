<script setup lang="ts">
import type { DropdownMenuItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, useAttrs, useSlots } from 'vue'
import { useRoute } from 'vue-router'
import { reactiveOmit } from '@vueuse/core'
import { DropdownMenuItem, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
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

const props = withDefaults(
  defineProps<
    DropdownMenuItemProps & {
      class?: HTMLAttributes['class']
      inset?: boolean
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
const delegatedProps = reactiveOmit(props, 'class', 'permission', 'hideWhenNoPermission')

const forwardedProps = useForwardProps(delegatedProps)
const permissionFlags = computed(() => {
  const explicitPermissions = normalizePermissionFlags(props.permission)
  if (explicitPermissions.length) return explicitPermissions
  if (attrHasKey(attrs, 'data-permission-neutral')) return []

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
  <DropdownMenuItem
    v-if="canRender"
    v-bind="forwardedProps"
    :class="
      cn(
        'relative flex cursor-default select-none items-center rounded-sm gap-2 px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0',
        inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuItem>
</template>

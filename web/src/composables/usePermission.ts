import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useUserStore } from '@/stores/modules/user'

const ALL_PERMISSION = '*:*:*'

function matchesPermission(userPermission: string, requiredPermission: string) {
  if (userPermission === ALL_PERMISSION || userPermission === requiredPermission) return true
  if (userPermission.endsWith(':*')) return requiredPermission.startsWith(userPermission.slice(0, -1))

  const userParts = userPermission.split(':')
  const requiredParts = requiredPermission.split(':')
  return (
    userParts.length === requiredParts.length &&
    userParts.every((part, index) => part === '*' || part === requiredParts[index])
  )
}

export function hasAnyPermission(permissionFlags: string[]) {
  const userStore = useUserStore()
  const permissions = userStore.permissions || []
  return permissionFlags.some((flag) =>
    permissions.some((permission) => matchesPermission(permission, flag)),
  )
}

export function usePermission(permissionFlags: MaybeRefOrGetter<string[]>) {
  return computed(() => hasAnyPermission(toValue(permissionFlags)))
}

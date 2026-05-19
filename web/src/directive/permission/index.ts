import { useUserStore } from '@/stores/modules/user'
import { hasAnyPermission } from '@/composables/usePermission'
import type { Directive, DirectiveBinding } from 'vue'

/**
 * 操作权限处理
 * v-hasPermi="['system:user:add','system:user:edit']"
 */
export const hasPermi: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    if (Array.isArray(value) && value.length > 0) {
      const hasPermissions = hasAnyPermission(value)

      if (!hasPermissions) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(`请设置操作权限标签值`)
    }
  },
}

/**
 * 角色权限处理
 * v-hasRole="['admin','editor']"
 */
export const hasRole: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const super_admin = 'admin'
    const userStore = useUserStore()
    const roles = userStore.roles || []

    if (Array.isArray(value) && value.length > 0) {
      const roleFlag = value
      const hasRole = roles.some((role) => {
        return super_admin === role || roleFlag.includes(role)
      })

      if (!hasRole) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(`请设置角色权限标签值`)
    }
  },
}

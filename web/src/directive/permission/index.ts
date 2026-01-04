import { useUserStore } from '@/stores/modules/user'
import type { Directive, DirectiveBinding } from 'vue'

/**
 * 操作权限处理
 * v-hasPermi="['system:user:add','system:user:edit']"
 */
export const hasPermi: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const all_permission = '*:*:*'
    const userStore = useUserStore()
    // 模拟：userStore 需要有 permissions 属性
    // 目前 userStore.ts 中还没有 permissions，我们需要去添加
    // 暂时假设 roles 中包含了 permissions，或者我们在 userStore 中添加一个 getter
    // 为了兼容现有 mock 数据，我们假设 permissions 就是 roles (实际项目中是分开的)
    // 但通常 permissions 是具体的操作点，roles 是角色

    // 我们先在 userStore 中添加 permissions state
    const permissions = userStore.permissions || []

    if (value && value instanceof Array && value.length > 0) {
      const permissionFlag = value
      const hasPermissions = permissions.some((permission) => {
        return all_permission === permission || permissionFlag.includes(permission)
      })

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

    if (value && value instanceof Array && value.length > 0) {
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

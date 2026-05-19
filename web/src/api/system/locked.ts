import request from '@/utils/request'
import { hasAnyPermission } from '@/composables/usePermission'

export interface LockedAccount {
  username: string
  lockUntil: number
  remainingSeconds: number
}

/**
 * 获取被锁定的账户列表
 */
export function getLockedAccounts() {
  if (!hasAnyPermission(['system:setting:edit'])) {
    return Promise.resolve({ rows: [], total: 0 })
  }
  return request<{ rows: LockedAccount[]; total: number }>({
    url: '/auth/locked',
    method: 'get',
  })
}

/**
 * 解锁账户
 */
export function unlockAccount(username: string) {
  if (!hasAnyPermission(['system:setting:edit'])) return Promise.resolve(null)
  return request({
    url: `/auth/locked/${username}`,
    method: 'delete',
  })
}

import { SetMetadata } from '@nestjs/common'

export const PERMISSION_KEY = 'permissions'

/**
 * 权限校验装饰器
 * @param permissions 需要的权限标识，如 'system:user:add'
 * @example @RequirePermission('system:user:add')
 * @example @RequirePermission('system:user:add', 'system:user:edit') // 满足其一即可
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions)

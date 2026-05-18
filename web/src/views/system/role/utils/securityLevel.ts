export const MAX_ROLE_SECURITY_LEVEL = 1000
export const DEFAULT_ROLE_SECURITY_LEVEL = 100

type RoleLevelInfo = {
  securityLevel?: number | null
}

/**
 * 为什么前端也要计算上限：后端是最终安全边界，前端提前拦截可以避免操作者误以为
 * 自己能创建/编辑高于自身等级的角色，减少越权尝试和错误提交。
 */
export function getCurrentMaxSecurityLevel(roleKeys: string[], roleList: RoleLevelInfo[]) {
  if (roleKeys.includes('admin')) return MAX_ROLE_SECURITY_LEVEL
  return Math.max(0, ...roleList.map((role) => role.securityLevel ?? 0))
}

export function defaultEditableSecurityLevel(maxSecurityLevel: number) {
  return Math.min(DEFAULT_ROLE_SECURITY_LEVEL, maxSecurityLevel)
}

export function validateEditableSecurityLevel(value: unknown, maxSecurityLevel: number) {
  const level = Number(value)
  if (value === undefined || value === '' || !Number.isInteger(level) || level < 0) {
    return '安全等级必须是 0 以上的整数'
  }
  if (level > maxSecurityLevel) {
    return `安全等级不能超过你当前的最高安全等级 ${maxSecurityLevel}`
  }
  return ''
}

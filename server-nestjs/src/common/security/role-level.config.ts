export const ROLE_SECURITY_LEVEL: Record<string, number> = {
  admin: 1000,
  system_admin: 900,
  monitor_admin: 800,
  pm_executive: 700,
  bug_project_owner: 600,
  project_owner: 600,
  bug_product_owner: 550,
  product_owner: 550,
  bug_reviewer: 520,
  reviewer: 520,
  bug_developer: 400,
  developer: 400,
  bug_tester: 350,
  tester: 350,
  common_user: 200,
  bug_submitter: 100,
  submitter: 100,
}

export const LEGACY_BUSINESS_ROLE_KEY_MAP: Record<string, string> = {
  project_owner: 'bug_project_owner',
  product_owner: 'bug_product_owner',
  reviewer: 'bug_reviewer',
  developer: 'bug_developer',
  tester: 'bug_tester',
  submitter: 'bug_submitter',
}

export const LEGACY_BUSINESS_ROLE_KEYS = Object.keys(LEGACY_BUSINESS_ROLE_KEY_MAP)
export const STANDARD_BUSINESS_ROLE_KEYS = Object.values(LEGACY_BUSINESS_ROLE_KEY_MAP)

export function isLegacyBusinessRole(roleKey: string) {
  // 历史别名（如 developer）如果仍是数据库中的启用角色，必须尊重后台配置。
  // 只有显式重命名为 *_deprecated_* 的角色才视为已废弃，不参与运行时权限。
  return roleKey.includes('_deprecated_')
}

export function expandEquivalentRoleKeys(roleKeys: string[]) {
  const result = new Set<string>()
  for (const roleKey of roleKeys) {
    result.add(roleKey)
    const standardRoleKey = LEGACY_BUSINESS_ROLE_KEY_MAP[roleKey]
    if (standardRoleKey) result.add(standardRoleKey)
    for (const [legacyRoleKey, mappedStandardRoleKey] of Object.entries(LEGACY_BUSINESS_ROLE_KEY_MAP)) {
      if (mappedStandardRoleKey === roleKey) result.add(legacyRoleKey)
    }
  }
  return [...result]
}

export function defaultRoleSecurityLevel(roleKey: string) {
  return ROLE_SECURITY_LEVEL[roleKey] ?? 100
}

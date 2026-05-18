export const ROLE_SECURITY_LEVEL: Record<string, number> = {
  admin: 1000,
  system_admin: 900,
  monitor_admin: 800,
  pm_executive: 700,
  bug_project_owner: 600,
  bug_product_owner: 550,
  bug_reviewer: 520,
  bug_developer: 400,
  bug_tester: 350,
  common_user: 200,
  bug_submitter: 100,
}

export function defaultRoleSecurityLevel(roleKey: string) {
  return ROLE_SECURITY_LEVEL[roleKey] ?? 100
}

import { BUG_MEMBER_ROLE, type BugMemberRole } from '../constants/bug.constants'

export const PROJECT_MEMBER_ROLE_KEYS: Partial<Record<BugMemberRole, string[]>> = {
  [BUG_MEMBER_ROLE.OWNER]: ['bug_project_owner', 'project_owner'],
  [BUG_MEMBER_ROLE.PRODUCT]: ['bug_product_owner', 'product_owner'],
  [BUG_MEMBER_ROLE.REVIEWER]: ['bug_reviewer', 'reviewer'],
  [BUG_MEMBER_ROLE.DEVELOPER]: ['bug_developer', 'developer'],
  [BUG_MEMBER_ROLE.TESTER]: ['bug_tester', 'tester'],
  [BUG_MEMBER_ROLE.VIEWER]: [],
}

export const ASSIGN_CONTEXT_MEMBER_ROLES: Record<string, BugMemberRole[]> = {
  bugAssignee: [BUG_MEMBER_ROLE.DEVELOPER],
  requirementOwner: [BUG_MEMBER_ROLE.OWNER, BUG_MEMBER_ROLE.PRODUCT, BUG_MEMBER_ROLE.REVIEWER],
  requirementDeveloper: [BUG_MEMBER_ROLE.DEVELOPER],
  requirementTester: [BUG_MEMBER_ROLE.TESTER],
  iterationOwner: Object.values(BUG_MEMBER_ROLE),
  milestoneOwner: Object.values(BUG_MEMBER_ROLE),
  moduleAssignee: [BUG_MEMBER_ROLE.DEVELOPER],
}

export const PROJECT_MEMBERSHIP_CONTEXTS = new Set([
  'bugAssignee',
  'requirementOwner',
  'requirementDeveloper',
  'requirementTester',
  'iterationOwner',
  'milestoneOwner',
  'moduleAssignee',
])

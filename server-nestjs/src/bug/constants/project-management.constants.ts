import { BUG_STATUS } from './bug.constants'

export const PROJECT_STAGE = {
  REQUIREMENT: 'requirement',
  PLANNING: 'planning',
  DESIGN: 'design',
  DEVELOPMENT: 'development',
  SELF_TEST: 'self_test',
  INTERNAL_TEST: 'internal_test',
  RELEASE_READY: 'release_ready',
  RELEASED: 'released',
  MAINTENANCE: 'maintenance',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
} as const

export const REQUIREMENT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DEFERRED: 'deferred',
  PLANNED: 'planned',
  DEVELOPING: 'developing',
  TESTING: 'testing',
  ACCEPTED: 'accepted',
  RELEASED: 'released',
  CLOSED: 'closed',
  CHANGED: 'changed',
} as const

export const ITERATION_STATUS = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  TESTING: 'testing',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const

export const MILESTONE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  ACHIEVED: 'achieved',
  DELAYED: 'delayed',
  CANCELLED: 'cancelled',
} as const

export const PM_RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  DELAYED: 'delayed',
} as const

export const PM_ACTIVITY_TARGET = {
  PROJECT: 'project',
  REQUIREMENT: 'requirement',
  ITERATION: 'iteration',
  MILESTONE: 'milestone',
} as const

export const PM_ACTIVITY_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  STATUS: 'status',
  STAGE: 'stage',
  DELETE: 'delete',
} as const

export const PM_DASHBOARD_GROUPS = {
  requirementCurrent: [REQUIREMENT_STATUS.DEVELOPING, REQUIREMENT_STATUS.TESTING],
  requirementCompleted: [
    REQUIREMENT_STATUS.ACCEPTED,
    REQUIREMENT_STATUS.RELEASED,
    REQUIREMENT_STATUS.CLOSED,
  ],
  requirementPending: [
    REQUIREMENT_STATUS.SUBMITTED,
    REQUIREMENT_STATUS.REVIEWING,
    REQUIREMENT_STATUS.APPROVED,
    REQUIREMENT_STATUS.PLANNED,
    REQUIREMENT_STATUS.CHANGED,
  ],
  bugCurrent: [BUG_STATUS.ASSIGNED, BUG_STATUS.FIXING, BUG_STATUS.PENDING_VERIFY],
  bugCompleted: [BUG_STATUS.CLOSED],
  bugPending: [BUG_STATUS.PENDING_CONFIRM, BUG_STATUS.CONFIRMED, BUG_STATUS.REOPENED],
} as const

export type ProjectStage = (typeof PROJECT_STAGE)[keyof typeof PROJECT_STAGE]
export type RequirementStatus = (typeof REQUIREMENT_STATUS)[keyof typeof REQUIREMENT_STATUS]
export type IterationStatus = (typeof ITERATION_STATUS)[keyof typeof ITERATION_STATUS]
export type MilestoneStatus = (typeof MILESTONE_STATUS)[keyof typeof MILESTONE_STATUS]

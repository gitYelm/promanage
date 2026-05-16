import {
  ITERATION_STATUS,
  MILESTONE_STATUS,
  PROJECT_STAGE,
  REQUIREMENT_STATUS,
  type IterationStatus,
  type MilestoneStatus,
  type ProjectStage,
  type RequirementStatus,
} from './project-management.constants'

export interface PmTransitionConfig<T extends string> {
  action: string
  from: T[]
  to: T
  label: string
  permissions: string[]
}

export const PROJECT_STAGE_TRANSITIONS: PmTransitionConfig<ProjectStage>[] = [
  { action: 'to_planning', from: [PROJECT_STAGE.REQUIREMENT], to: PROJECT_STAGE.PLANNING, label: '进入规划', permissions: ['pm:project:update'] },
  { action: 'to_design', from: [PROJECT_STAGE.PLANNING], to: PROJECT_STAGE.DESIGN, label: '进入设计', permissions: ['pm:project:update'] },
  { action: 'to_development', from: [PROJECT_STAGE.PLANNING, PROJECT_STAGE.DESIGN, PROJECT_STAGE.MAINTENANCE], to: PROJECT_STAGE.DEVELOPMENT, label: '进入开发', permissions: ['pm:project:update'] },
  { action: 'to_self_test', from: [PROJECT_STAGE.DEVELOPMENT], to: PROJECT_STAGE.SELF_TEST, label: '进入自测', permissions: ['pm:project:update'] },
  { action: 'to_internal_test', from: [PROJECT_STAGE.SELF_TEST, PROJECT_STAGE.DEVELOPMENT], to: PROJECT_STAGE.INTERNAL_TEST, label: '进入内测', permissions: ['pm:project:update'] },
  { action: 'to_release_ready', from: [PROJECT_STAGE.INTERNAL_TEST], to: PROJECT_STAGE.RELEASE_READY, label: '待发布', permissions: ['pm:project:update'] },
  { action: 'to_released', from: [PROJECT_STAGE.RELEASE_READY], to: PROJECT_STAGE.RELEASED, label: '已发布', permissions: ['pm:project:update'] },
  { action: 'to_maintenance', from: [PROJECT_STAGE.RELEASED], to: PROJECT_STAGE.MAINTENANCE, label: '进入维护', permissions: ['pm:project:update'] },
  { action: 'pause', from: [PROJECT_STAGE.REQUIREMENT, PROJECT_STAGE.PLANNING, PROJECT_STAGE.DESIGN, PROJECT_STAGE.DEVELOPMENT, PROJECT_STAGE.INTERNAL_TEST], to: PROJECT_STAGE.PAUSED, label: '暂停', permissions: ['pm:project:update'] },
  { action: 'archive', from: [PROJECT_STAGE.MAINTENANCE, PROJECT_STAGE.PAUSED], to: PROJECT_STAGE.ARCHIVED, label: '归档', permissions: ['pm:project:update'] },
]

export const REQUIREMENT_TRANSITIONS: PmTransitionConfig<RequirementStatus>[] = [
  { action: 'submit', from: [REQUIREMENT_STATUS.DRAFT, REQUIREMENT_STATUS.CHANGED], to: REQUIREMENT_STATUS.SUBMITTED, label: '提交评审', permissions: ['pm:requirement:status'] },
  { action: 'review', from: [REQUIREMENT_STATUS.SUBMITTED], to: REQUIREMENT_STATUS.REVIEWING, label: '开始评审', permissions: ['pm:requirement:review'] },
  { action: 'approve', from: [REQUIREMENT_STATUS.REVIEWING, REQUIREMENT_STATUS.SUBMITTED], to: REQUIREMENT_STATUS.APPROVED, label: '评审通过', permissions: ['pm:requirement:review'] },
  { action: 'reject', from: [REQUIREMENT_STATUS.REVIEWING, REQUIREMENT_STATUS.SUBMITTED], to: REQUIREMENT_STATUS.REJECTED, label: '驳回', permissions: ['pm:requirement:review'] },
  { action: 'defer', from: [REQUIREMENT_STATUS.APPROVED, REQUIREMENT_STATUS.REVIEWING], to: REQUIREMENT_STATUS.DEFERRED, label: '延期', permissions: ['pm:requirement:review'] },
  { action: 'plan', from: [REQUIREMENT_STATUS.APPROVED, REQUIREMENT_STATUS.DEFERRED], to: REQUIREMENT_STATUS.PLANNED, label: '排期', permissions: ['pm:requirement:status'] },
  { action: 'start_dev', from: [REQUIREMENT_STATUS.PLANNED], to: REQUIREMENT_STATUS.DEVELOPING, label: '开始开发', permissions: ['pm:requirement:status'] },
  { action: 'submit_test', from: [REQUIREMENT_STATUS.DEVELOPING], to: REQUIREMENT_STATUS.TESTING, label: '提交测试', permissions: ['pm:requirement:status'] },
  { action: 'accept', from: [REQUIREMENT_STATUS.TESTING], to: REQUIREMENT_STATUS.ACCEPTED, label: '验收通过', permissions: ['pm:requirement:status'] },
  { action: 'release', from: [REQUIREMENT_STATUS.ACCEPTED], to: REQUIREMENT_STATUS.RELEASED, label: '发布', permissions: ['pm:requirement:status'] },
  { action: 'close', from: [REQUIREMENT_STATUS.RELEASED, REQUIREMENT_STATUS.REJECTED], to: REQUIREMENT_STATUS.CLOSED, label: '关闭', permissions: ['pm:requirement:status'] },
]

export const ITERATION_TRANSITIONS: PmTransitionConfig<IterationStatus>[] = [
  { action: 'start', from: [ITERATION_STATUS.PLANNED], to: ITERATION_STATUS.ACTIVE, label: '开始迭代', permissions: ['pm:iteration:manage'] },
  { action: 'test', from: [ITERATION_STATUS.ACTIVE], to: ITERATION_STATUS.TESTING, label: '进入测试', permissions: ['pm:iteration:manage'] },
  { action: 'complete', from: [ITERATION_STATUS.ACTIVE, ITERATION_STATUS.TESTING], to: ITERATION_STATUS.COMPLETED, label: '完成', permissions: ['pm:iteration:manage'] },
  { action: 'pause', from: [ITERATION_STATUS.ACTIVE], to: ITERATION_STATUS.PAUSED, label: '暂停', permissions: ['pm:iteration:manage'] },
  { action: 'cancel', from: [ITERATION_STATUS.PLANNED, ITERATION_STATUS.PAUSED], to: ITERATION_STATUS.CANCELLED, label: '取消', permissions: ['pm:iteration:manage'] },
]

export const MILESTONE_TRANSITIONS: PmTransitionConfig<MilestoneStatus>[] = [
  { action: 'start', from: [MILESTONE_STATUS.PENDING], to: MILESTONE_STATUS.IN_PROGRESS, label: '开始', permissions: ['pm:milestone:manage'] },
  { action: 'achieve', from: [MILESTONE_STATUS.PENDING, MILESTONE_STATUS.IN_PROGRESS, MILESTONE_STATUS.DELAYED], to: MILESTONE_STATUS.ACHIEVED, label: '达成', permissions: ['pm:milestone:manage'] },
  { action: 'delay', from: [MILESTONE_STATUS.PENDING, MILESTONE_STATUS.IN_PROGRESS], to: MILESTONE_STATUS.DELAYED, label: '延期', permissions: ['pm:milestone:manage'] },
  { action: 'cancel', from: [MILESTONE_STATUS.PENDING, MILESTONE_STATUS.IN_PROGRESS, MILESTONE_STATUS.DELAYED], to: MILESTONE_STATUS.CANCELLED, label: '取消', permissions: ['pm:milestone:manage'] },
]

export function findTransition<T extends string>(items: PmTransitionConfig<T>[], action: string, status: string) {
  return items.find((item) => item.action === action && item.from.includes(status as T))
}

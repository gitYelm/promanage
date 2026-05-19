import request from '@/utils/request'
import type {
  ActionAdvice,
  DashboardQuery,
  DashboardSummary,
  Iteration,
  IterationForm,
  IterationQuery,
  Milestone,
  MilestoneForm,
  MilestoneQuery,
  PageResult,
  ProjectHealth,
  ProjectOverview,
  ProjectProgressForm,
  Requirement,
  RequirementForm,
  RequirementQuery,
  RiskItems,
  WorkItems,
} from './types'

const unwrap = <T>(res: unknown) => (res as { data: T }).data

export function listRequirements(params: RequirementQuery): Promise<PageResult<Requirement>> {
  return request({ url: '/project-management/requirements', method: 'get', params }).then(
    unwrap<PageResult<Requirement>>,
  )
}
export function getRequirement(id: string): Promise<Requirement> {
  return request({ url: `/project-management/requirements/${id}`, method: 'get' }).then(
    unwrap<Requirement>,
  )
}
export function addRequirement(data: RequirementForm) {
  return request({ url: '/project-management/requirements', method: 'post', data })
}
export function updateRequirement(data: RequirementForm) {
  return request({
    url: `/project-management/requirements/${data.requirementId}`,
    method: 'put',
    data,
  })
}
export function deleteRequirements(ids: string[]) {
  return request({
    url: '/project-management/requirements',
    method: 'delete',
    params: { ids: ids.join(',') },
  })
}
export function runRequirementAction(id: string, action: string, remark = '') {
  return request({
    url: `/project-management/requirements/${id}/status/${action}`,
    method: 'post',
    data: { remark },
  })
}

export function listIterations(params: IterationQuery): Promise<PageResult<Iteration>> {
  return request({ url: '/project-management/iterations', method: 'get', params }).then(
    unwrap<PageResult<Iteration>>,
  )
}
export function addIteration(data: IterationForm) {
  return request({ url: '/project-management/iterations', method: 'post', data })
}
export function updateIteration(data: IterationForm) {
  return request({ url: `/project-management/iterations/${data.iterationId}`, method: 'put', data })
}
export function deleteIterations(ids: string[]) {
  return request({
    url: '/project-management/iterations',
    method: 'delete',
    params: { ids: ids.join(',') },
  })
}
export function runIterationAction(id: string, action: string, remark = '') {
  return request({
    url: `/project-management/iterations/${id}/status/${action}`,
    method: 'post',
    data: { remark },
  })
}

export function listMilestones(params: MilestoneQuery): Promise<PageResult<Milestone>> {
  return request({ url: '/project-management/milestones', method: 'get', params }).then(
    unwrap<PageResult<Milestone>>,
  )
}
export function addMilestone(data: MilestoneForm) {
  return request({ url: '/project-management/milestones', method: 'post', data })
}
export function updateMilestone(data: MilestoneForm) {
  return request({ url: `/project-management/milestones/${data.milestoneId}`, method: 'put', data })
}
export function deleteMilestones(ids: string[]) {
  return request({
    url: '/project-management/milestones',
    method: 'delete',
    params: { ids: ids.join(',') },
  })
}
export function runMilestoneAction(id: string, action: string, remark = '') {
  return request({
    url: `/project-management/milestones/${id}/status/${action}`,
    method: 'post',
    data: { remark },
  })
}

export function projectOverview(projectId: string): Promise<ProjectOverview> {
  return request({ url: `/project-management/projects/${projectId}/overview`, method: 'get' }).then(
    unwrap<ProjectOverview>,
  )
}
export function updateProjectProgress(
  projectId: string,
  data: ProjectProgressForm,
): Promise<ProjectOverview> {
  return request({
    url: `/project-management/projects/${projectId}/progress`,
    method: 'put',
    data,
  }).then(unwrap<ProjectOverview>)
}
export function executiveSummary(params?: DashboardQuery): Promise<DashboardSummary> {
  return request({
    url: '/project-management/executive-dashboard/summary',
    method: 'get',
    params,
  }).then(unwrap<DashboardSummary>)
}
export function executiveProjects(params?: DashboardQuery): Promise<ProjectHealth[]> {
  return request({
    url: '/project-management/executive-dashboard/projects',
    method: 'get',
    params,
  }).then(unwrap<ProjectHealth[]>)
}
export function executiveRisks(params?: DashboardQuery): Promise<RiskItems> {
  return request({
    url: '/project-management/executive-dashboard/risks',
    method: 'get',
    params,
  }).then(unwrap<RiskItems>)
}
export function executiveCurrentWork(params?: DashboardQuery): Promise<WorkItems> {
  return request({
    url: '/project-management/executive-dashboard/current-work',
    method: 'get',
    params,
  }).then(unwrap<WorkItems>)
}
export function executiveCompletedHistory(params?: DashboardQuery): Promise<WorkItems> {
  return request({
    url: '/project-management/executive-dashboard/completed-history',
    method: 'get',
    params,
  }).then(unwrap<WorkItems>)
}
export function executivePendingWork(params?: DashboardQuery): Promise<WorkItems> {
  return request({
    url: '/project-management/executive-dashboard/pending-work',
    method: 'get',
    params,
  }).then(unwrap<WorkItems>)
}
export function executiveUpcoming(params?: DashboardQuery) {
  return request({
    url: '/project-management/executive-dashboard/upcoming',
    method: 'get',
    params,
  }).then(unwrap<Milestone[]>)
}
export function executiveActions(params?: DashboardQuery) {
  return request({
    url: '/project-management/executive-dashboard/actions',
    method: 'get',
    params,
  }).then(unwrap<ActionAdvice[]>)
}

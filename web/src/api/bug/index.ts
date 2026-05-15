import request from '@/utils/request'
import type {
  BugAttachment,
  BugMember,
  BugModule,
  BugProject,
  BugStatisticsResult,
  BugTicket,
  BugUserRef,
  BugVersion,
  PageResult,
} from './types'

export interface BugTicketQuery {
  pageNum?: number
  pageSize?: number
  keyword?: string
  projectId?: string
  moduleId?: string
  status?: string
  severity?: string
  priority?: string
  assigneeId?: string
  submitterId?: string
  beginTime?: string
  endTime?: string
  mine?: string
}

export interface BugTicketForm {
  ticketId?: string
  title?: string
  projectId?: string
  moduleId?: string
  versionId?: string
  type?: string
  severity?: string
  priority?: string
  description?: string
  reproduceSteps?: string
  expectedResult?: string
  actualResult?: string
  environment?: string
  deviceInfo?: string
  attachmentIds?: string[]
}

export interface BugProjectForm {
  projectId?: string
  projectName?: string
  projectKey?: string
  ownerId?: string
  description?: string
  status?: string
}

export interface BugModuleForm {
  moduleId?: string
  projectId?: string
  moduleName?: string
  defaultAssigneeId?: string
  orderNum?: number
  status?: string
}

export interface BugVersionForm {
  versionId?: string
  projectId?: string
  versionNo?: string
  versionName?: string
  status?: string
}

export interface BugMemberForm {
  userId: string
  memberRole: string
  isDefault?: boolean
  status?: string
}

const unwrap = <T>(res: unknown) => (res as { data: T }).data

export function listBugTickets(params: BugTicketQuery): Promise<PageResult<BugTicket>> {
  return request({ url: '/bug/tickets', method: 'get', params }).then(unwrap<PageResult<BugTicket>>)
}

export function bugPendingCount(): Promise<{ count: number }> {
  return request({ url: '/bug/tickets/pending-count', method: 'get' }).then(unwrap<{ count: number }>)
}

export function getBugTicket(ticketId: string): Promise<BugTicket> {
  return request({ url: `/bug/tickets/${ticketId}`, method: 'get' }).then(unwrap<BugTicket>)
}

export function addBugTicket(data: BugTicketForm) {
  return request({ url: '/bug/tickets', method: 'post', data })
}

export function updateBugTicket(data: BugTicketForm) {
  return request({ url: `/bug/tickets/${data.ticketId}`, method: 'put', data })
}

export function deleteBugTickets(ids: string[]) {
  return request({ url: '/bug/tickets', method: 'delete', params: { ids: ids.join(',') } })
}

export function runBugAction(ticketId: string, action: string, data: Record<string, unknown>) {
  return request({ url: `/bug/tickets/${ticketId}/actions/${action}`, method: 'post', data })
}

export function assignBug(ticketId: string, data: Record<string, unknown>) {
  return request({ url: `/bug/tickets/${ticketId}/assign`, method: 'post', data })
}

export function addBugComment(ticketId: string, data: { content: string; attachmentIds?: string[] }) {
  return request({ url: `/bug/tickets/${ticketId}/comments`, method: 'post', data })
}

export function uploadBugAttachment(file: File, data: Record<string, string> = {}): Promise<BugAttachment> {
  const form = new FormData()
  form.append('file', file)
  Object.entries(data).forEach(([key, value]) => form.append(key, value))
  return request({
    url: '/bug/attachments/upload',
    method: 'post',
    data: form,
  }).then(unwrap<BugAttachment>)
}

export function bugStatistics(): Promise<BugStatisticsResult> {
  return request({ url: '/bug/tickets/statistics', method: 'get' }).then(unwrap<BugStatisticsResult>)
}

export function listBugProjects(params?: Record<string, unknown>): Promise<PageResult<BugProject>> {
  return request({ url: '/bug/projects', method: 'get', params }).then(unwrap<PageResult<BugProject>>)
}

export function bugProjectOptions(): Promise<BugProject[]> {
  return request({ url: '/bug/projects/options', method: 'get' }).then(unwrap<BugProject[]>)
}

export function addBugProject(data: BugProjectForm) {
  return request({ url: '/bug/projects', method: 'post', data })
}

export function updateBugProject(data: BugProjectForm) {
  return request({ url: `/bug/projects/${data.projectId}`, method: 'put', data })
}

export function deleteBugProjects(ids: string[]) {
  return request({ url: '/bug/projects', method: 'delete', params: { ids: ids.join(',') } })
}

export function listBugModules(params?: Record<string, unknown>): Promise<PageResult<BugModule>> {
  return request({ url: '/bug/modules', method: 'get', params }).then(unwrap<PageResult<BugModule>>)
}

export function addBugModule(data: BugModuleForm) {
  return request({ url: '/bug/modules', method: 'post', data })
}

export function updateBugModule(data: BugModuleForm) {
  return request({ url: `/bug/modules/${data.moduleId}`, method: 'put', data })
}

export function deleteBugModules(ids: string[]) {
  return request({ url: '/bug/modules', method: 'delete', params: { ids: ids.join(',') } })
}

export function listBugVersions(params?: Record<string, unknown>): Promise<PageResult<BugVersion>> {
  return request({ url: '/bug/versions', method: 'get', params }).then(unwrap<PageResult<BugVersion>>)
}

export function addBugVersion(data: BugVersionForm) {
  return request({ url: '/bug/versions', method: 'post', data })
}

export function updateBugVersion(data: BugVersionForm) {
  return request({ url: `/bug/versions/${data.versionId}`, method: 'put', data })
}

export function deleteBugVersions(ids: string[]) {
  return request({ url: '/bug/versions', method: 'delete', params: { ids: ids.join(',') } })
}

export function listBugMembers(projectId: string): Promise<BugMember[]> {
  return request({ url: `/bug/projects/${projectId}/members`, method: 'get' }).then(unwrap<BugMember[]>)
}

export function upsertBugMember(projectId: string, data: BugMemberForm) {
  return request({ url: `/bug/projects/${projectId}/members`, method: 'post', data })
}

export function deleteBugMember(memberId: string) {
  return request({ url: `/bug/projects/members/${memberId}`, method: 'delete' })
}

export function bugUserOptions(keyword = ''): Promise<BugUserRef[]> {
  return request({ url: '/bug/users/options', method: 'get', params: { keyword } }).then(
    unwrap<BugUserRef[]>,
  )
}

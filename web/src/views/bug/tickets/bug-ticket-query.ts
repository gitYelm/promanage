import type { BugTicketQuery } from '@/api/bug'
import { ALL_OPTION_VALUE } from '../shared/bug-options'
import {
  normalizeAllOption,
  normalizeText,
  toLocalDateBoundaryIso,
} from '@/utils/table-filter'

export interface BugTicketFilterState {
  pageNum: number
  pageSize: number
  keyword: string
  ticketNo: string
  title: string
  projectId: string
  moduleId: string
  type: string
  status: string
  severity: string
  priority: string
  environment: string
  assigneeId: string
  submitterId: string
  verifierId: string
  deviceInfo: string
  createTimeStart: string
  createTimeEnd: string
  dueTimeStart: string
  dueTimeEnd: string
  updateTimeStart: string
  updateTimeEnd: string
  sortBy: string
  sortOrder: 'asc' | 'desc' | ''
}

export function createBugTicketFilterState(pageSize = 20): BugTicketFilterState {
  return {
    pageNum: 1,
    pageSize,
    keyword: '',
    ticketNo: '',
    title: '',
    projectId: ALL_OPTION_VALUE,
    moduleId: ALL_OPTION_VALUE,
    type: ALL_OPTION_VALUE,
    status: ALL_OPTION_VALUE,
    severity: ALL_OPTION_VALUE,
    priority: ALL_OPTION_VALUE,
    environment: ALL_OPTION_VALUE,
    assigneeId: ALL_OPTION_VALUE,
    submitterId: ALL_OPTION_VALUE,
    verifierId: ALL_OPTION_VALUE,
    deviceInfo: '',
    createTimeStart: '',
    createTimeEnd: '',
    dueTimeStart: '',
    dueTimeEnd: '',
    updateTimeStart: '',
    updateTimeEnd: '',
    sortBy: '',
    sortOrder: '',
  }
}

export function buildBugTicketListQuery(
  query: BugTicketFilterState,
  options: { mine?: boolean } = {},
): BugTicketQuery {
  return {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    keyword: normalizeText(query.keyword),
    ticketNo: normalizeText(query.ticketNo),
    title: normalizeText(query.title),
    projectId: normalizeAllOption(query.projectId),
    moduleId: normalizeAllOption(query.moduleId),
    type: normalizeAllOption(query.type),
    status: normalizeAllOption(query.status),
    severity: normalizeAllOption(query.severity),
    priority: normalizeAllOption(query.priority),
    environment: normalizeAllOption(query.environment),
    assigneeId: normalizeAllOption(query.assigneeId),
    submitterId: normalizeAllOption(query.submitterId),
    verifierId: normalizeAllOption(query.verifierId),
    deviceInfo: normalizeText(query.deviceInfo),
    beginTime: toLocalDateBoundaryIso(query.createTimeStart, 'start'),
    endTime: toLocalDateBoundaryIso(query.createTimeEnd, 'end'),
    dueTimeStart: toLocalDateBoundaryIso(query.dueTimeStart, 'start'),
    dueTimeEnd: toLocalDateBoundaryIso(query.dueTimeEnd, 'end'),
    updateTimeStart: toLocalDateBoundaryIso(query.updateTimeStart, 'start'),
    updateTimeEnd: toLocalDateBoundaryIso(query.updateTimeEnd, 'end'),
    mine: options.mine ? 'true' : undefined,
    sortBy: normalizeText(query.sortBy),
    sortOrder: query.sortOrder || undefined,
  }
}

import type { RequirementQuery } from '@/api/project-management/types'
import { PM_ALL_OPTION_VALUE } from '../shared/options'
import {
  normalizeAllOption,
  normalizeNumber,
  normalizeText,
  toLocalDateBoundaryIso,
} from '@/utils/table-filter'

export interface RequirementFilterState {
  pageNum: number
  pageSize: number
  keyword: string
  requirementNo: string
  title: string
  projectId: string
  type: string
  status: string
  priority: string
  source: string
  ownerId: string
  developerId: string
  testerId: string
  valueScoreMin: string
  valueScoreMax: string
  difficultyScoreMin: string
  difficultyScoreMax: string
  plannedStartTimeStart: string
  plannedStartTimeEnd: string
  plannedEndTimeStart: string
  plannedEndTimeEnd: string
  createTimeStart: string
  createTimeEnd: string
  sortBy: string
  sortOrder: 'asc' | 'desc' | ''
}

export function createRequirementFilterState(pageSize = 20): RequirementFilterState {
  return {
    pageNum: 1,
    pageSize,
    keyword: '',
    requirementNo: '',
    title: '',
    projectId: PM_ALL_OPTION_VALUE,
    type: PM_ALL_OPTION_VALUE,
    status: PM_ALL_OPTION_VALUE,
    priority: PM_ALL_OPTION_VALUE,
    source: '',
    ownerId: PM_ALL_OPTION_VALUE,
    developerId: PM_ALL_OPTION_VALUE,
    testerId: PM_ALL_OPTION_VALUE,
    valueScoreMin: '',
    valueScoreMax: '',
    difficultyScoreMin: '',
    difficultyScoreMax: '',
    plannedStartTimeStart: '',
    plannedStartTimeEnd: '',
    plannedEndTimeStart: '',
    plannedEndTimeEnd: '',
    createTimeStart: '',
    createTimeEnd: '',
    sortBy: '',
    sortOrder: '',
  }
}

export function buildRequirementListQuery(query: RequirementFilterState): RequirementQuery {
  return {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    keyword: normalizeText(query.keyword),
    requirementNo: normalizeText(query.requirementNo),
    title: normalizeText(query.title),
    projectId: normalizeAllOption(query.projectId, PM_ALL_OPTION_VALUE),
    type: normalizeAllOption(query.type, PM_ALL_OPTION_VALUE),
    status: normalizeAllOption(query.status, PM_ALL_OPTION_VALUE),
    priority: normalizeAllOption(query.priority, PM_ALL_OPTION_VALUE),
    source: normalizeText(query.source),
    ownerId: normalizeAllOption(query.ownerId, PM_ALL_OPTION_VALUE),
    developerId: normalizeAllOption(query.developerId, PM_ALL_OPTION_VALUE),
    testerId: normalizeAllOption(query.testerId, PM_ALL_OPTION_VALUE),
    valueScoreMin: normalizeNumber(query.valueScoreMin),
    valueScoreMax: normalizeNumber(query.valueScoreMax),
    difficultyScoreMin: normalizeNumber(query.difficultyScoreMin),
    difficultyScoreMax: normalizeNumber(query.difficultyScoreMax),
    plannedStartTimeStart: toLocalDateBoundaryIso(query.plannedStartTimeStart, 'start'),
    plannedStartTimeEnd: toLocalDateBoundaryIso(query.plannedStartTimeEnd, 'end'),
    plannedEndTimeStart: toLocalDateBoundaryIso(query.plannedEndTimeStart, 'start'),
    plannedEndTimeEnd: toLocalDateBoundaryIso(query.plannedEndTimeEnd, 'end'),
    createTimeStart: toLocalDateBoundaryIso(query.createTimeStart, 'start'),
    createTimeEnd: toLocalDateBoundaryIso(query.createTimeEnd, 'end'),
    sortBy: normalizeText(query.sortBy),
    sortOrder: query.sortOrder || undefined,
  }
}

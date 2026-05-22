import { Prisma } from '@prisma/client'
import { BusinessException } from '../../common/exceptions/business.exception'
import { BugAccessService, type RequestUserLike } from '../bug-access.service'
import { QueryRequirementDto } from '../dto/project-management.dto'

export async function buildRequirementListWhere(
  access: BugAccessService,
  query: QueryRequirementDto,
  user: RequestUserLike,
): Promise<Prisma.ProjectRequirementWhereInput> {
  const projectIds = await access.getVisibleProjectIds(user.userId)
  const where = await access.buildRequirementWhere(user.userId)
  const appendAnd = (condition: Prisma.ProjectRequirementWhereInput) => {
    const currentAnd = !where.AND ? [] : Array.isArray(where.AND) ? where.AND : [where.AND]
    where.AND = [...currentAnd, condition]
  }

  appendKeywordFilters(appendAnd, query)
  appendRelationFilters(appendAnd, query, projectIds)
  appendRangeFilters(appendAnd, query)
  return where
}

export function buildRequirementOrderBy(
  query: QueryRequirementDto,
): Prisma.ProjectRequirementOrderByWithRelationInput[] {
  const direction =
    query.sortOrder === 'asc' ? 'asc' : query.sortOrder === 'desc' ? 'desc' : undefined
  const sortMap: Record<string, Prisma.ProjectRequirementOrderByWithRelationInput> = {
    requirementNo: { requirementNo: direction },
    projectId: { projectId: direction },
    ownerId: { ownerId: direction },
    status: { status: direction },
    priority: { priority: direction },
    plannedEndTime: { plannedEndTime: direction },
  }
  if (direction && query.sortBy && sortMap[query.sortBy]) {
    return [sortMap[query.sortBy], { requirementId: 'desc' }]
  }
  return [{ requirementId: 'desc' }]
}

function appendKeywordFilters(
  appendAnd: (condition: Prisma.ProjectRequirementWhereInput) => void,
  query: QueryRequirementDto,
) {
  if (query.keyword) {
    appendAnd({
      OR: [{ title: { contains: query.keyword } }, { requirementNo: { contains: query.keyword } }],
    })
  }
  if (query.requirementNo) appendAnd({ requirementNo: { contains: query.requirementNo } })
  if (query.title) appendAnd({ title: { contains: query.title } })
}

function appendRelationFilters(
  appendAnd: (condition: Prisma.ProjectRequirementWhereInput) => void,
  query: QueryRequirementDto,
  projectIds: bigint[],
) {
  if (query.projectId) {
    const id = BigInt(query.projectId)
    appendAnd({ projectId: projectIds.some((item) => item === id) ? id : { in: [] } })
  }
  if (query.moduleId) appendAnd({ moduleId: BigInt(query.moduleId) })
  if (query.type) appendAnd({ type: query.type })
  if (query.source) appendAnd({ source: { contains: query.source } })
  if (query.status) appendAnd({ status: query.status })
  if (query.priority) appendAnd({ priority: query.priority })
  if (query.ownerId) appendAnd({ ownerId: BigInt(query.ownerId) })
  if (query.developerId) appendAnd({ developerId: BigInt(query.developerId) })
  if (query.testerId) appendAnd({ testerId: BigInt(query.testerId) })
  if (query.iterationId) appendAnd({ iterationId: BigInt(query.iterationId) })
  if (query.milestoneId) appendAnd({ milestoneId: BigInt(query.milestoneId) })
  if (query.versionId) appendAnd({ versionId: BigInt(query.versionId) })
}

function appendRangeFilters(
  appendAnd: (condition: Prisma.ProjectRequirementWhereInput) => void,
  query: QueryRequirementDto,
) {
  appendIntRange(appendAnd, 'valueScore', query.valueScoreMin, query.valueScoreMax, '业务价值分')
  appendIntRange(
    appendAnd,
    'difficultyScore',
    query.difficultyScoreMin,
    query.difficultyScoreMax,
    '实现难度分',
  )
  appendDateRange(
    appendAnd,
    'plannedStartTime',
    query.plannedStartTimeStart,
    query.plannedStartTimeEnd,
    '计划开始时间',
  )
  appendDateRange(
    appendAnd,
    'plannedEndTime',
    query.plannedEndTimeStart,
    query.plannedEndTimeEnd,
    '计划完成时间',
  )
  appendDateRange(appendAnd, 'createTime', query.createTimeStart, query.createTimeEnd, '创建时间')
}

function appendIntRange(
  appendAnd: (condition: Prisma.ProjectRequirementWhereInput) => void,
  field: 'valueScore' | 'difficultyScore',
  min: number | undefined,
  max: number | undefined,
  label: string,
) {
  if (min === undefined && max === undefined) return
  if (min !== undefined && max !== undefined && min > max) {
    throw BusinessException.invalidParams(`${label}最小值不能大于最大值`)
  }
  const range = {
    ...(min !== undefined ? { gte: min } : {}),
    ...(max !== undefined ? { lte: max } : {}),
  }
  appendAnd(field === 'valueScore' ? { valueScore: range } : { difficultyScore: range })
}

function appendDateRange(
  appendAnd: (condition: Prisma.ProjectRequirementWhereInput) => void,
  field: 'plannedStartTime' | 'plannedEndTime' | 'createTime',
  start: string | undefined,
  end: string | undefined,
  label: string,
) {
  if (!start && !end) return
  const startDate = start ? parseQueryDate(start, `${label}开始值`) : undefined
  const endDate = end ? parseQueryDate(end, `${label}结束值`) : undefined
  if (startDate && endDate && startDate > endDate) {
    throw BusinessException.invalidParams(`${label}开始值不能晚于结束值`)
  }
  const range = { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) }
  if (field === 'plannedStartTime') appendAnd({ plannedStartTime: range })
  else if (field === 'plannedEndTime') appendAnd({ plannedEndTime: range })
  else appendAnd({ createTime: range })
}

function parseQueryDate(value: string, label: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw BusinessException.invalidParams(`${label}格式不正确`)
  return date
}

import { Prisma } from '@prisma/client'
import { BugAccessService } from '../bug-access.service'

export async function buildRequirementExportWhere(
  access: BugAccessService,
  query: Record<string, any>,
): Promise<Prisma.ProjectRequirementWhereInput> {
  const userId = typeof query.__operatorId === 'string' ? query.__operatorId : undefined
  const where = userId ? await access.buildRequirementWhere(userId) : { delFlag: '0' }
  const andList: Prisma.ProjectRequirementWhereInput[] = []
  appendTextFilters(andList, query)
  appendRelationFilters(andList, query)
  appendRangeFilters(andList, query)
  if (query.selectedIds?.length) {
    andList.push({ requirementId: { in: query.selectedIds.map((id: string) => BigInt(id)) } })
  }
  if (!andList.length) return where
  const currentAnd = !where.AND ? [] : Array.isArray(where.AND) ? where.AND : [where.AND]
  where.AND = [...currentAnd, ...andList]
  return where
}

function appendTextFilters(
  andList: Prisma.ProjectRequirementWhereInput[],
  query: Record<string, any>,
) {
  if (query.keyword) {
    andList.push({
      OR: [{ title: { contains: query.keyword } }, { requirementNo: { contains: query.keyword } }],
    })
  }
  if (query.requirementNo) andList.push({ requirementNo: { contains: query.requirementNo } })
  if (query.title) andList.push({ title: { contains: query.title } })
  if (query.type) andList.push({ type: String(query.type) })
  if (query.source) andList.push({ source: { contains: String(query.source) } })
  if (query.status) andList.push({ status: String(query.status) })
  if (query.priority) andList.push({ priority: String(query.priority) })
}

function appendRelationFilters(
  andList: Prisma.ProjectRequirementWhereInput[],
  query: Record<string, any>,
) {
  ;(
    [
      'projectId',
      'moduleId',
      'ownerId',
      'developerId',
      'testerId',
      'iterationId',
      'milestoneId',
      'versionId',
    ] as const
  ).forEach((field) => {
    if (query[field]) andList.push({ [field]: BigInt(String(query[field])) })
  })
}

function appendRangeFilters(
  andList: Prisma.ProjectRequirementWhereInput[],
  query: Record<string, any>,
) {
  appendNumberRange(andList, 'valueScore', query.valueScoreMin, query.valueScoreMax)
  appendNumberRange(andList, 'difficultyScore', query.difficultyScoreMin, query.difficultyScoreMax)
  appendDateRange(
    andList,
    'plannedStartTime',
    query.plannedStartTimeStart,
    query.plannedStartTimeEnd,
  )
  appendDateRange(andList, 'plannedEndTime', query.plannedEndTimeStart, query.plannedEndTimeEnd)
  appendDateRange(andList, 'createTime', query.createTimeStart, query.createTimeEnd)
}

function appendNumberRange(
  andList: Prisma.ProjectRequirementWhereInput[],
  field: 'valueScore' | 'difficultyScore',
  min?: number,
  max?: number,
) {
  if (min === undefined && max === undefined) return
  andList.push({
    [field]: {
      ...(min !== undefined ? { gte: Number(min) } : {}),
      ...(max !== undefined ? { lte: Number(max) } : {}),
    },
  })
}

function appendDateRange(
  andList: Prisma.ProjectRequirementWhereInput[],
  field: 'plannedStartTime' | 'plannedEndTime' | 'createTime',
  start?: string,
  end?: string,
) {
  if (!start && !end) return
  andList.push({
    [field]: { ...(start ? { gte: new Date(start) } : {}), ...(end ? { lte: new Date(end) } : {}) },
  })
}

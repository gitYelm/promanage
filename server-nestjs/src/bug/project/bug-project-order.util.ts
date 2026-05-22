import { Prisma } from '@prisma/client'
import { QueryBugModuleDto, QueryBugProjectDto, QueryBugVersionDto } from '../dto/project.dto'

function sortDirection(sortOrder?: string) {
  return sortOrder === 'asc' ? 'asc' : sortOrder === 'desc' ? 'desc' : undefined
}

export function buildProjectOrderBy(
  query: QueryBugProjectDto,
): Prisma.BugProjectOrderByWithRelationInput[] {
  const direction = sortDirection(query.sortOrder)
  const sortMap: Record<string, Prisma.BugProjectOrderByWithRelationInput> = {
    projectName: { projectName: direction },
    projectKey: { projectKey: direction },
    ownerId: { ownerId: direction },
    status: { status: direction },
    progress: { progress: direction },
    plannedEndTime: { plannedEndTime: direction },
  }
  if (direction && query.sortBy && sortMap[query.sortBy])
    return [sortMap[query.sortBy], { projectId: 'desc' }]
  return [{ projectId: 'desc' }]
}

export function buildModuleOrderBy(
  query: QueryBugModuleDto,
): Prisma.BugProjectModuleOrderByWithRelationInput[] {
  const direction = sortDirection(query.sortOrder)
  const sortMap: Record<string, Prisma.BugProjectModuleOrderByWithRelationInput> = {
    projectId: { projectId: direction },
    moduleName: { moduleName: direction },
    orderNum: { orderNum: direction },
    status: { status: direction },
  }
  if (direction && query.sortBy && sortMap[query.sortBy])
    return [sortMap[query.sortBy], { moduleId: 'desc' }]
  return [{ projectId: 'asc' }, { orderNum: 'asc' }]
}

export function buildVersionOrderBy(
  query: QueryBugVersionDto,
): Prisma.BugProjectVersionOrderByWithRelationInput[] {
  const direction = sortDirection(query.sortOrder)
  const sortMap: Record<string, Prisma.BugProjectVersionOrderByWithRelationInput> = {
    projectId: { projectId: direction },
    versionNo: { versionNo: direction },
    versionName: { versionName: direction },
    status: { status: direction },
  }
  if (direction && query.sortBy && sortMap[query.sortBy])
    return [sortMap[query.sortBy], { versionId: 'desc' }]
  return [{ projectId: 'asc' }, { versionId: 'desc' }]
}

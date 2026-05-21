export function resolveSortDirection(sortOrder?: string) {
  return sortOrder === 'asc' ? 'asc' : sortOrder === 'desc' ? 'desc' : undefined
}

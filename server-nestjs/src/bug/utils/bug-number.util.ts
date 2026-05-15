/**
 * 生成可读的 Bug 编号。
 * 使用项目标识和日期是为了让跨项目列表中也能快速定位来源。
 */
export function buildBugNo(projectKey: string, sequence: number, date = new Date()): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${projectKey.toUpperCase()}-BUG-${yyyy}${mm}${dd}-${String(sequence).padStart(4, '0')}`
}

/** 将 PostgreSQL pretty size 转为字节数，保证本地排序按真实大小而不是字符串排序。 */
export function parsePrettySize(value: string) {
  const matched = value.match(/^([0-9.]+)\s*(bytes|kB|MB|GB|TB)?$/i)
  if (!matched) return 0
  const unitMap: Record<string, number> = {
    bytes: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  }
  return Number(matched[1]) * (unitMap[(matched[2] || 'bytes').toLowerCase()] || 1)
}

export function parseDurationMs(value: string) {
  return Number.parseFloat(value) || 0
}

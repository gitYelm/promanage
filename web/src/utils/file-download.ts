/**
 * 触发浏览器保存 Blob 文件。
 * 部分内嵌浏览器不支持下载事件，但仍支持打开 blob URL 预览/保存。
 */
export function saveBlobFile(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.target = '_blank'
  link.rel = 'noopener'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000)
}

export function buildApiUrl(path: string) {
  const apiBase = import.meta.env.VITE_APP_BASE_API || ''
  if (/^https?:\/\//.test(apiBase)) return `${apiBase}${path}`
  const serverBase = import.meta.env.VITE_API_URL || ''
  return `${serverBase}${apiBase}${path}`
}

import type { BugAttachment } from '@/api/bug/types'
import { fileUrl } from '../../shared/bug-options'

export function attachmentUrl(item?: BugAttachment) {
  return fileUrl(item?.fileUrl)
}

export function isImageAttachment(item?: BugAttachment) {
  return Boolean(item?.fileType?.startsWith('image/') || item?.attachmentType?.includes('image'))
}

export function isVideoAttachment(item?: BugAttachment) {
  return Boolean(item?.fileType?.startsWith('video/'))
}

export function attachmentTypeLabel(item?: BugAttachment) {
  if (!item) return '附件'
  if (item.attachmentType === 'annotated_image') return '标注图'
  if (item.attachmentType === 'image') return '原图'
  if (item.attachmentType === 'video') return '视频'
  if (item.attachmentType === 'log') return '日志'
  return '附件'
}

export function formatFileSize(size?: string) {
  const value = Number(size)
  if (!Number.isFinite(value)) return ''
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${value} B`
}

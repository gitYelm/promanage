import request from '@/utils/request'

export interface UploadResult {
  url: string
  filename: string
  size: number
  mimetype: string
}

/**
 * 上传用户头像
 */
export function uploadAvatar(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  return request<{ data: UploadResult }>({
    url: '/upload/avatar',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then((res: unknown) => (res as { data: UploadResult }).data)
}

/**
 * 上传系统文件（Logo/Favicon）
 */
export function uploadSystem(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  return request<{ data: UploadResult }>({
    url: '/upload/system',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then((res: unknown) => (res as { data: UploadResult }).data)
}

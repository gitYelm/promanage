import request from '@/utils/request'
import { hasAnyPermission } from '@/composables/usePermission'

/**
 * 测试邮件发送
 */
export function testMail() {
  if (!hasAnyPermission(['system:setting:edit'])) {
    return Promise.resolve({ success: false, message: '无测试邮件权限' })
  }
  return request<{ success: boolean; message: string }>({
    url: '/system/mail/test',
    method: 'post',
  })
}

import request from '@/utils/request'

export interface SiteConfig {
  name: string
  description: string
  logo: string
  favicon: string
  copyright: string
  icp: string
  loginPath: string
  requestTimeout: number
  uploadTimeout: number
}

/**
 * 获取网站公开配置（无需登录）
 */
export function getSiteConfig() {
  return request<SiteConfig>({
    url: '/system/config/site',
    method: 'get',
  })
}

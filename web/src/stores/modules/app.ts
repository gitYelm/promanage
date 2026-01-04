import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSiteConfig, type SiteConfig } from '@/api/system/site'
import { setupLoginRoute } from '@/router'

export const useAppStore = defineStore('app', () => {
  // 侧边栏折叠状态（从 localStorage 恢复）
  const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')

  /**
   * 切换侧边栏折叠状态
   */
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }

  /**
   * 设置侧边栏折叠状态
   */
  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }

  // 网站配置
  const siteConfig = ref<SiteConfig>({
    name: 'RBAC Admin Pro',
    description: '企业级权限管理系统',
    logo: '',
    favicon: '',
    copyright: '© 2025 RBAC Admin Pro. All rights reserved.',
    icp: '',
    loginPath: '/login',
  })

  const siteConfigLoaded = ref(false)

  /**
   * 加载网站配置
   */
  async function loadSiteConfig() {
    if (siteConfigLoaded.value) return

    try {
      const res = (await getSiteConfig()) as unknown as { data: SiteConfig }
      if (res.data) {
        siteConfig.value = res.data
        // 更新页面标题
        if (res.data.name) {
          document.title = res.data.name
        }
        // 更新 favicon
        if (res.data.favicon) {
          updateFavicon(res.data.favicon)
        }
        // 设置登录路由（根据配置的路径）
        setupLoginRoute(res.data.loginPath || '/login')
      }
      siteConfigLoaded.value = true
    } catch (error) {
      console.error('加载网站配置失败:', error)
      // 加载失败时使用默认登录路径
      setupLoginRoute('/login')
      siteConfigLoaded.value = true
    }
  }

  /**
   * 更新 favicon
   */
  function updateFavicon(url: string) {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = url
  }

  /**
   * 刷新网站配置（设置保存后调用）
   */
  async function refreshSiteConfig() {
    siteConfigLoaded.value = false
    await loadSiteConfig()
  }

  return {
    sidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
    siteConfig,
    siteConfigLoaded,
    loadSiteConfig,
    refreshSiteConfig,
  }
})

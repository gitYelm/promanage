import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { useThemeStore } from '@/stores/theme'
import * as icons from 'lucide-vue-next'

export function useLayoutHelpers() {
  const route = useRoute()
  const appStore = useAppStore()
  const themeStore = useThemeStore()

  const siteName = computed(() => appStore.siteConfig.name || 'RBAC Admin')
  const siteLogo = computed(() => {
    const logo = appStore.siteConfig.logo
    if (!logo) return ''
    return logo.startsWith('/') ? `${import.meta.env.VITE_API_URL}${logo}` : logo
  })
  const transitionName = computed(() => {
    const map = { slide: 'slide-fade', fade: 'fade', scale: 'scale', none: '' }
    return map[themeStore.pageTransition] || ''
  })

  function toPascalCase(str: string): string {
    if (!str) return ''
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }

  function getIcon(iconName: string) {
    if (!iconName) return icons.Settings
    return (icons as any)[toPascalCase(iconName)] || icons.Settings
  }

  function getAvatarUrl(avatar: string | undefined | null): string {
    if (!avatar) return ''
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar
    return `${import.meta.env.VITE_API_URL}${avatar}`
  }

  function isActive(path: string) {
    return route.path === path
  }

  function childPath(parentPath: string, childPathValue: string) {
    return childPathValue.startsWith('/') ? childPathValue : `${parentPath}/${childPathValue}`
  }

  return { siteName, siteLogo, transitionName, getIcon, getAvatarUrl, isActive, childPath }
}

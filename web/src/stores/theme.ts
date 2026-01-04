import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { themes } from '@/lib/registry/themes'
import { computed } from 'vue'

// 菜单模式类型
export type MenuMode = 'normal' | 'top' | 'mixed'

// 页面切换动画类型
export type PageTransition = 'slide' | 'fade' | 'scale' | 'none'

export const useThemeStore = defineStore('theme', () => {
  // 主题色和圆角
  const themeName = useStorage('theme', 'zinc')
  const customColor = useStorage('customColor', '') // 自定义颜色 (hex)
  const radius = useStorage('radius', 0.5)

  // 布局配置
  const menuMode = useStorage<MenuMode>('menuMode', 'normal')
  const showTabs = useStorage('showTabs', false)
  const pageTransition = useStorage<PageTransition>('pageTransition', 'slide')

  // Layout 大小配置
  const sidebarExpandedWidth = useStorage('sidebarExpandedWidth', 256)
  const sidebarCollapsedWidth = useStorage('sidebarCollapsedWidth', 80)
  const sidebarItemHeight = useStorage('sidebarItemHeight', 48)

  const currentTheme = computed(() => {
    return themes.find((t) => t.name === themeName.value) || themes[0]
  })

  function setTheme(name: string) {
    themeName.value = name
    customColor.value = '' // 清除自定义颜色
  }

  function setCustomColor(color: string) {
    customColor.value = color
    if (color) {
      themeName.value = 'custom'
    }
  }

  // 判断是否使用自定义颜色
  const isCustomTheme = computed(() => themeName.value === 'custom' && customColor.value)

  function setRadius(value: number) {
    radius.value = value
  }

  function setMenuMode(mode: MenuMode) {
    menuMode.value = mode
  }

  function setShowTabs(value: boolean) {
    showTabs.value = value
  }

  function setPageTransition(value: PageTransition) {
    pageTransition.value = value
  }

  function setSidebarExpandedWidth(value: number) {
    sidebarExpandedWidth.value = Math.max(200, Math.min(400, value))
  }

  function setSidebarCollapsedWidth(value: number) {
    sidebarCollapsedWidth.value = Math.max(48, Math.min(120, value))
  }

  function setSidebarItemHeight(value: number) {
    sidebarItemHeight.value = Math.max(32, Math.min(64, value))
  }

  // 重置为默认值
  function resetToDefault() {
    themeName.value = 'zinc'
    customColor.value = ''
    radius.value = 0.5
    menuMode.value = 'normal'
    showTabs.value = false
    pageTransition.value = 'slide'
    sidebarExpandedWidth.value = 256
    sidebarCollapsedWidth.value = 80
    sidebarItemHeight.value = 48
  }

  return {
    // 主题
    themeName,
    customColor,
    radius,
    currentTheme,
    isCustomTheme,
    setTheme,
    setCustomColor,
    setRadius,
    // 布局配置
    menuMode,
    showTabs,
    pageTransition,
    setMenuMode,
    setShowTabs,
    setPageTransition,
    // Layout 大小
    sidebarExpandedWidth,
    sidebarCollapsedWidth,
    sidebarItemHeight,
    setSidebarExpandedWidth,
    setSidebarCollapsedWidth,
    setSidebarItemHeight,
    resetToDefault,
  }
})

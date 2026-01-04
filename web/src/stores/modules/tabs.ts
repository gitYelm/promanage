import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TabItem {
  path: string
  name: string
  title: string
  icon?: string
  closable: boolean
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>([
    { path: '/dashboard', name: 'Dashboard', title: '仪表盘', closable: false },
  ])
  const activeTab = ref('/dashboard')

  // 添加标签页
  function addTab(route: RouteLocationNormalized) {
    const { path, name, meta } = route

    // 忽略登录页、错误页、redirect页等特殊页面
    if (path === '/login' || path === '/404' || path === '/403' || path.startsWith('/redirect')) {
      return
    }

    // 检查是否已存在
    const exists = tabs.value.some((tab) => tab.path === path)
    if (!exists) {
      tabs.value.push({
        path,
        name: (name as string) || path,
        title: (meta?.title as string) || path,
        icon: meta?.icon as string,
        closable: path !== '/dashboard',
      })
    }
    activeTab.value = path
  }

  // 关闭标签页
  function closeTab(path: string) {
    const index = tabs.value.findIndex((tab) => tab.path === path)
    if (index === -1) return null

    const tab = tabs.value[index]
    // 不能关闭固定标签（仪表盘）
    if (!tab || !tab.closable) return null

    tabs.value.splice(index, 1)

    // 如果关闭的是当前标签，切换到前一个或后一个
    if (activeTab.value === path) {
      const newIndex = Math.min(index, tabs.value.length - 1)
      const newTab = newIndex >= 0 ? tabs.value[newIndex] : undefined
      return newTab?.path || '/dashboard'
    }
    return null
  }

  // 关闭其他标签页（保留固定标签）
  function closeOtherTabs(path: string) {
    tabs.value = tabs.value.filter((tab) => !tab.closable || tab.path === path)
    activeTab.value = path
  }

  // 关闭所有标签页（保留固定标签）
  function closeAllTabs() {
    tabs.value = tabs.value.filter((tab) => !tab.closable)
    activeTab.value = '/dashboard'
    return '/dashboard'
  }

  // 关闭左侧标签页（保留固定标签）
  function closeLeftTabs(path: string) {
    const index = tabs.value.findIndex((tab) => tab.path === path)
    if (index <= 0) return
    tabs.value = tabs.value.filter((tab, i) => i >= index || !tab.closable)
  }

  // 关闭右侧标签页（保留固定标签）
  function closeRightTabs(path: string) {
    const index = tabs.value.findIndex((tab) => tab.path === path)
    if (index === -1) return
    tabs.value = tabs.value.filter((tab, i) => i <= index || !tab.closable)
  }

  // 设置当前标签
  function setActiveTab(path: string) {
    activeTab.value = path
  }

  return {
    tabs,
    activeTab,
    addTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    closeLeftTabs,
    closeRightTabs,
    setActiveTab,
  }
})

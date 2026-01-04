import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getRouters } from '@/api/login'
import router from '@/router'
import type { RouteRecordRaw } from 'vue-router'

export interface MenuItem {
  name: string
  path: string
  hidden: boolean
  redirect?: string
  component: string
  alwaysShow?: boolean
  meta: {
    title: string
    icon: string
    noCache: boolean
    link: string | null
  }
  children?: MenuItem[]
}

// 匹配 views 里面所有的 .vue 文件
const modules = import.meta.glob('../../views/**/*.vue')

// 加载视图组件
function loadView(view: string) {
  let res
  for (const path in modules) {
    const parts = path.split('views/')
    if (parts.length < 2) continue
    const part = parts[1]
    if (!part) continue
    const dir = part.split('.vue')[0]
    if (dir === view) {
      res = modules[path]
    }
  }
  return res
}

// 转换菜单为路由
function filterAsyncRouter(asyncRouterMap: MenuItem[]): RouteRecordRaw[] {
  return asyncRouterMap.map((route) => {
    const routeRecord: any = {
      path: route.path,
      name: route.name,
      meta: route.meta,
    }

    // 处理 redirect
    if (route.redirect) {
      routeRecord.redirect = route.redirect
    }

    // 处理组件
    if (route.component) {
      if (route.component === 'Layout') {
        routeRecord.component = () => import('@/layout/index.vue')
      } else {
        routeRecord.component = loadView(route.component)
      }
    }

    // 处理子路由
    if (route.children && route.children.length) {
      routeRecord.children = filterAsyncRouter(route.children)
    }

    return routeRecord as RouteRecordRaw
  })
}

// 收集路由名称（用于移除动态路由）
function collectRouteNames(routes: RouteRecordRaw[]): string[] {
  const names: string[] = []
  routes.forEach((route) => {
    if (route.name) {
      names.push(route.name as string)
    }
    if (route.children) {
      names.push(...collectRouteNames(route.children))
    }
  })
  return names
}

// 已添加的动态路由名称
let addedRouteNames: string[] = []

export const useMenuStore = defineStore('menu', () => {
  const menuList = ref<MenuItem[]>([])
  const loading = ref(false)

  // 检查动态路由是否已注册到 Vue Router
  function checkRoutesRegistered(): boolean {
    if (addedRouteNames.length === 0) return false
    // 检查第一个动态路由是否存在
    const firstName = addedRouteNames[0]
    if (!firstName) return false
    return router.hasRoute(firstName)
  }

  // 注册动态路由
  function registerRoutes(menus: MenuItem[]) {
    // 先移除旧的动态路由
    removeRoutes()

    const accessRoutes = filterAsyncRouter(menus)
    addedRouteNames = collectRouteNames(accessRoutes)

    accessRoutes.forEach((route) => {
      router.addRoute(route)
    })
  }

  // 移除动态路由
  function removeRoutes() {
    addedRouteNames.forEach((name) => {
      if (router.hasRoute(name)) {
        router.removeRoute(name)
      }
    })
    addedRouteNames = []
  }

  // 获取菜单数据并注册路由
  async function fetchMenus() {
    // 如果菜单数据存在且路由已注册，直接返回
    if (menuList.value.length > 0 && checkRoutesRegistered()) {
      return menuList.value
    }

    loading.value = true
    try {
      const res = await getRouters()
      menuList.value = res.data || []

      // 动态注册路由
      if (menuList.value.length > 0) {
        registerRoutes(menuList.value)
      }

      return menuList.value
    } catch (error) {
      console.error('获取菜单失败:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  // 清空菜单
  function clearMenus() {
    removeRoutes()
    menuList.value = []
  }

  return {
    menuList,
    loading,
    fetchMenus,
    clearMenus,
  }
})

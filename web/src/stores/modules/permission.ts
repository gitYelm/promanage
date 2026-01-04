import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '@/router'
import type { RouteRecordRaw } from 'vue-router'
import { getRouters } from '@/api/login'

/** 后端返回的路由数据结构 */
interface RouteData {
  path: string
  name?: string
  component?: string
  redirect?: string
  meta?: Record<string, unknown>
  children?: RouteData[]
}

type ViewModule = () => Promise<{ default: unknown }>

// 匹配 views 目录下所有 .vue 文件
const viewModules = import.meta.glob<{ default: unknown }>('@/views/**/*.vue')

// 构建视图路径映射表（只执行一次）
const viewPathMap = new Map<string, ViewModule>()
for (const path in viewModules) {
  // 提取 views/ 后面的路径，去掉 .vue 后缀
  const match = path.match(/\/views\/(.+)\.vue$/)
  const loader = viewModules[path]
  if (match?.[1] && loader) {
    viewPathMap.set(match[1], loader)
  }
}

/**
 * 根据组件路径加载视图组件
 */
function loadView(viewPath: string): ViewModule | undefined {
  return viewPathMap.get(viewPath)
}

/**
 * 将后端路由数据转换为 Vue Router 路由配置
 */
function transformRoutes(routes: RouteData[]): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = []

  for (const route of routes) {
    // 处理组件
    let component: RouteRecordRaw['component'] | undefined
    if (route.component === 'Layout') {
      component = () => import('@/layout/index.vue')
    } else if (route.component) {
      component = loadView(route.component)
    }

    // 递归处理子路由
    const children = route.children?.length ? transformRoutes(route.children) : undefined

    // 跳过没有组件也没有子路由的项
    if (!component && !children?.length) continue

    // 使用类型断言构建路由对象
    const transformed = {
      path: route.path,
      ...(component && { component }),
      ...(children && { children }),
      ...(route.meta && { meta: route.meta }),
      ...(route.name && { name: route.name }),
      ...(route.redirect && { redirect: route.redirect }),
    } as RouteRecordRaw

    result.push(transformed)
  }

  return result
}

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const addRoutes = ref<RouteRecordRaw[]>([])

  function setRoutes(newRoutes: RouteRecordRaw[]) {
    addRoutes.value = newRoutes
    routes.value = [...router.options.routes, ...newRoutes]
  }

  async function generateRoutes(): Promise<RouteRecordRaw[]> {
    const res = await getRouters()
    // 使用 structuredClone 进行深拷贝，避免修改原始数据
    const routeData = structuredClone(res.data) as RouteData[]
    const accessedRoutes = transformRoutes(routeData)
    setRoutes(accessedRoutes)
    return accessedRoutes
  }

  return {
    routes,
    addRoutes,
    generateRoutes,
  }
})

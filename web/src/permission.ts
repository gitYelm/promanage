import router, { getLoginPath } from './router'
import { useUserStore } from './stores/modules/user'
import { useMenuStore } from './stores/modules/menu'
import { useAppStore } from './stores/modules/app'
import { useWorkspaceStore } from './stores/modules/workspace'
import { hasAnyPermission } from './composables/usePermission'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

// 无需登录即可访问的页面（错误页面）
const publicPages = ['/404', '/403']

router.beforeEach(async (to, _from, next) => {
  NProgress.start()

  // 错误页面直接放行
  if (publicPages.includes(to.path)) {
    next()
    return
  }

  const userStore = useUserStore()
  const appStore = useAppStore()

  // 确保网站配置已加载（包括登录路径）
  if (!appStore.siteConfigLoaded) {
    await appStore.loadSiteConfig()
    // 配置加载后，登录路由已添加，如果当前访问的是登录路径，需要重新导航
    const loginPath = getLoginPath()
    if (to.path === loginPath && to.name === 'CatchAll') {
      next({ path: loginPath, replace: true })
      return
    }
  }

  const hasToken = userStore.token
  // 从路由获取实际配置的登录路径
  const loginPath = getLoginPath()

  if (hasToken) {
    if (to.path === loginPath) {
      next({ path: '/' })
      NProgress.done()
    } else {
      const hasRoles = userStore.roles && userStore.roles.length > 0
      if (hasRoles) {
        // 已有角色信息，确保菜单和路由已加载
        // fetchMenus 内部会检查路由是否真正注册到 Vue Router
        const menuStore = useMenuStore()
        const workspaceStore = useWorkspaceStore()
        await workspaceStore.fetchConfig()
        const dashboardTarget = workspaceStore.resolveDashboardTarget(to.path)
        if (dashboardTarget !== to.path) {
          next({ path: dashboardTarget, query: to.query, replace: true })
          return
        }
        const prevMenuLength = menuStore.menuList.length
        try {
          const menus = await menuStore.fetchMenus()
          // 只有真实注册到动态菜单时才重进路由。无角色/无菜单账号如果也重进同一路径，
          // 会在登录成功后被 beforeEach 反复 replace，表现为登录页不跳转。
          if (prevMenuLength === 0 && menus.length > 0) {
            next({ path: to.path, query: to.query, replace: true })
            return
          }
        } catch (error) {
          console.error('加载菜单失败:', error)
        }

        const requiredRoles = (to.meta && (to.meta as any).roles) as string[] | undefined
        if (requiredRoles && !requiredRoles.some((r) => userStore.roles.includes(r))) {
          next('/403')
          NProgress.done()
          return
        }
        const requiredPerms = (to.meta && (to.meta as any).perms) as string[] | undefined
        if (requiredPerms && !hasAnyPermission(requiredPerms)) {
          next('/403')
          NProgress.done()
          return
        }
        next()
      } else {
        const tokenBeforeGetInfo = userStore.token
        try {
          // 获取用户信息
          await userStore.getInfo()

          // 获取动态菜单
          const menuStore = useMenuStore()
          const workspaceStore = useWorkspaceStore()
          await workspaceStore.fetchConfig()
          await menuStore.fetchMenus()

          const nextPath = to.path === '/' ? workspaceStore.defaultPath : workspaceStore.resolveDashboardTarget(to.path)

          // 路由已动态添加，需要用 path 重新导航让新路由生效
          next({ path: nextPath, query: to.query, replace: true })
        } catch {
          await userStore.logout(tokenBeforeGetInfo)
          next(`${loginPath}?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    // 只有配置的登录路径才允许访问
    if (to.path === loginPath) {
      next()
    } else {
      // 未登录访问系统入口或受保护页面时跳转登录页，并保留原目标用于登录后回跳。
      next({ path: loginPath, query: { redirect: to.fullPath }, replace: true })
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

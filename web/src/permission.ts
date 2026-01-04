import router, { getLoginPath } from './router'
import { useUserStore } from './stores/modules/user'
import { useMenuStore } from './stores/modules/menu'
import { useAppStore } from './stores/modules/app'
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
        const prevMenuLength = menuStore.menuList.length
        try {
          await menuStore.fetchMenus()
          // 如果之前没有菜单数据，需要重新导航让新路由生效
          if (prevMenuLength === 0) {
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
        if (
          requiredPerms &&
          !requiredPerms.some(
            (p) => userStore.permissions.includes(p) || userStore.permissions.includes('*:*:*')
          )
        ) {
          next('/403')
          NProgress.done()
          return
        }
        next()
      } else {
        try {
          // 获取用户信息
          await userStore.getInfo()

          // 获取动态菜单
          const menuStore = useMenuStore()
          await menuStore.fetchMenus()

          // 路由已动态添加，需要用 path 重新导航让新路由生效
          next({ path: to.path, query: to.query, replace: true })
        } catch {
          await userStore.logout()
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
      // 未登录且访问非登录页，显示 404（不暴露真实登录入口）
      next({ name: 'NotFound', replace: true })
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

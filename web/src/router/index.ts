import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

// 登录页组件
const LoginComponent = () => import('@/views/login/index.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '首页', icon: 'dashboard' },
        },
        {
          path: 'user/profile',
          name: 'Profile',
          component: () => import('@/views/system/user/profile.vue'),
          meta: { title: '个人中心', icon: 'user' },
        },
        // System Module
        {
          path: 'system/user',
          name: 'User',
          component: () => import('@/views/system/user/index.vue'),
          meta: { title: '用户管理', icon: 'user' },
        },
        {
          path: 'system/role',
          name: 'Role',
          component: () => import('@/views/system/role/index.vue'),
          meta: { title: '角色管理', icon: 'shield' },
        },
        {
          path: 'system/menu',
          name: 'Menu',
          component: () => import('@/views/system/menu/index.vue'),
          meta: { title: '菜单管理', icon: 'menu' },
        },
        {
          path: 'system/dept',
          name: 'Dept',
          component: () => import('@/views/system/dept/index.vue'),
          meta: { title: '部门管理', icon: 'network' },
        },
        {
          path: 'system/post',
          name: 'Post',
          component: () => import('@/views/system/post/index.vue'),
          meta: { title: '岗位管理', icon: 'briefcase' },
        },
        {
          path: 'system/dict',
          name: 'Dict',
          component: () => import('@/views/system/dict/index.vue'),
          meta: { title: '字典管理', icon: 'book' },
        },
        {
          path: 'system/config',
          name: 'Config',
          component: () => import('@/views/system/config/index.vue'),
          meta: { title: '参数管理', icon: 'settings' },
        },
        {
          path: 'system/setting',
          name: 'Setting',
          component: () => import('@/views/system/setting/index.vue'),
          meta: { title: '系统设置', icon: 'settings-2', roles: ['admin'] },
        },
        {
          path: 'system/notice',
          name: 'Notice',
          component: () => import('@/views/system/notice/index.vue'),
          meta: { title: '通知公告', icon: 'bell' },
        },
        // Monitor Module
        {
          path: 'monitor/operlog',
          name: 'OperLog',
          component: () => import('@/views/monitor/operlog/index.vue'),
          meta: { title: '操作日志', icon: 'file-text', roles: ['admin'] },
        },
        {
          path: 'monitor/logininfor',
          name: 'LoginInfor',
          component: () => import('@/views/monitor/logininfor/index.vue'),
          meta: { title: '登录日志', icon: 'log-in', roles: ['admin'] },
        },
        {
          path: 'monitor/online',
          name: 'Online',
          component: () => import('@/views/monitor/online/index.vue'),
          meta: { title: '在线用户', icon: 'users', roles: ['admin'] },
        },
        {
          path: 'monitor/job',
          name: 'Job',
          component: () => import('@/views/monitor/job/index.vue'),
          meta: { title: '定时任务', icon: 'clock', roles: ['admin'] },
        },
        {
          path: 'monitor/server',
          name: 'Server',
          component: () => import('@/views/monitor/server/index.vue'),
          meta: { title: '服务监控', icon: 'server', roles: ['admin'] },
        },
        {
          path: 'monitor/cache',
          name: 'Cache',
          component: () => import('@/views/monitor/cache/index.vue'),
          meta: { title: '缓存监控', icon: 'database', roles: ['admin'] },
        },
        {
          path: 'monitor/druid',
          name: 'Database',
          component: () => import('@/views/monitor/druid/index.vue'),
          meta: { title: '数据库监控', icon: 'database', roles: ['admin'] },
        },
        // Tool Module
        {
          path: 'tool/build',
          name: 'Build',
          component: () => import('@/views/tool/build/index.vue'),
          meta: { title: '表单构建', icon: 'layout', roles: ['admin'] },
        },
        {
          path: 'tool/swagger',
          redirect: '/tool/apidoc',
        },
        {
          path: 'tool/apidoc',
          name: 'ApiDoc',
          component: () => import('@/views/tool/swagger/index.vue'),
          meta: { title: '接口文档', icon: 'link', roles: ['admin'] },
        },
      ],
    },
    {
      path: '/redirect/:path(.*)',
      name: 'Redirect',
      component: Layout,
      children: [
        {
          path: '',
          component: () => import('@/views/redirect/index.vue'),
        },
      ],
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('@/views/error/403.vue'),
      meta: { title: '无权限' },
    },
    {
      path: '/404',
      name: 'NotFound',
      component: () => import('@/views/error/404.vue'),
      meta: { title: '未找到' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'CatchAll',
      component: () => import('@/views/error/404.vue'),
      meta: { title: '未找到' },
    },
  ],
})

/**
 * 设置登录路由
 * @param loginPath 登录路径
 */
export function setupLoginRoute(loginPath: string) {
  const path = loginPath || '/login'

  // 移除已存在的登录路由
  if (router.hasRoute('Login')) {
    router.removeRoute('Login')
  }

  // 添加登录路由
  const loginRoute: RouteRecordRaw = {
    path,
    name: 'Login',
    component: LoginComponent,
    meta: { title: '登录' },
  }
  router.addRoute(loginRoute)
}

/**
 * 获取当前配置的登录路径
 */
export function getLoginPath(): string {
  const loginRoute = router.getRoutes().find((r) => r.name === 'Login')
  return loginRoute?.path || '/login'
}

export default router

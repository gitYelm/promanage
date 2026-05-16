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
          path: 'system/workspace-config',
          name: 'WorkspaceConfig',
          component: () => import('@/views/system/workspace/index.vue'),
          meta: { title: '工作台配置', icon: 'layout-dashboard' },
        },
        {
          path: 'system/notice',
          name: 'Notice',
          component: () => import('@/views/system/notice/index.vue'),
          meta: { title: '通知公告', icon: 'bell' },
        },
        {
          path: 'system/notification',
          name: 'Notification',
          component: () => import('@/views/system/notification/index.vue'),
          meta: { title: '站内通知', icon: 'bell-ring', perms: ['system:notification:list'] },
        },
        // Bug Module
        {
          path: 'bug/tickets',
          name: 'BugTickets',
          component: () => import('@/views/bug/tickets/index.vue'),
          meta: { title: 'Bug 列表', icon: 'bug' },
        },
        {
          path: 'bug/my',
          name: 'MyBugTickets',
          component: () => import('@/views/bug/tickets/index.vue'),
          meta: { title: '我的 Bug', icon: 'user-check' },
        },
        {
          path: 'bug/create',
          name: 'BugCreate',
          component: () => import('@/views/bug/tickets/create.vue'),
          meta: { title: '提交 Bug', icon: 'plus-square' },
        },
        {
          path: 'bug/projects',
          redirect: '/project-management/projects',
        },
        {
          path: 'bug/modules',
          redirect: '/project-management/modules',
        },
        {
          path: 'bug/versions',
          redirect: '/project-management/versions',
        },
        {
          path: 'bug/statistics',
          name: 'BugStatistics',
          component: () => import('@/views/bug/statistics/index.vue'),
          meta: { title: 'Bug 看板', icon: 'bar-chart-3' },
        },
        // Project Management Module
        {
          path: 'project-management/executive-dashboard',
          name: 'ProjectExecutiveDashboard',
          component: () => import('@/views/project-management/executive-dashboard/index.vue'),
          meta: { title: '老板驾驶舱', icon: 'layout-dashboard' },
        },
        {
          path: 'project-management/overview',
          name: 'ProjectOverview',
          component: () => import('@/views/project-management/overview/index.vue'),
          meta: { title: '项目概览', icon: 'panel-top' },
        },
        {
          path: 'project-management/requirements',
          name: 'ProjectRequirements',
          component: () => import('@/views/project-management/requirements/index.vue'),
          meta: { title: '需求管理', icon: 'list-todo' },
        },
        {
          path: 'project-management/iterations',
          name: 'ProjectIterations',
          component: () => import('@/views/project-management/iterations/index.vue'),
          meta: { title: '迭代计划', icon: 'calendar-days' },
        },
        {
          path: 'project-management/milestones',
          name: 'ProjectMilestones',
          component: () => import('@/views/project-management/milestones/index.vue'),
          meta: { title: '里程碑', icon: 'flag' },
        },
        {
          path: 'project-management/board',
          name: 'ProjectBoard',
          component: () => import('@/views/project-management/board/index.vue'),
          meta: { title: '项目看板', icon: 'columns-3' },
        },
        {
          path: 'project-management/projects',
          name: 'ProjectConfig',
          component: () => import('@/views/bug/projects/index.vue'),
          meta: { title: '项目配置', icon: 'folder-kanban' },
        },
        {
          path: 'project-management/modules',
          name: 'ProjectModules',
          component: () => import('@/views/bug/modules/index.vue'),
          meta: { title: '模块管理', icon: 'blocks' },
        },
        {
          path: 'project-management/versions',
          name: 'ProjectVersions',
          component: () => import('@/views/bug/versions/index.vue'),
          meta: { title: '版本管理', icon: 'git-branch' },
        },
        {
          path: 'project-management/statistics',
          redirect: '/bug/statistics',
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

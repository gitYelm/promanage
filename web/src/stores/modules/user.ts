import { defineStore } from 'pinia'
import { login, logout, getInfo, type LoginData } from '@/api/login'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { useMenuStore } from './menu'

interface RoleInfo {
  roleId: string
  roleName: string
  roleKey: string
}

interface UserState {
  token: string
  userId: string
  name: string
  avatar: string
  email: string
  roles: string[]
  roleList: RoleInfo[]
  permissions: string[]
  isLoggedIn: boolean // 标记用户是否已成功登录（用于区分冷启动验证失败和使用中过期）
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: getToken() || '',
    userId: '',
    name: '',
    avatar: '',
    email: '',
    roles: [],
    roleList: [],
    permissions: [],
    isLoggedIn: false,
  }),
  actions: {
    // 登录（不自动设置 token，用于两步验证场景）
    async loginWithoutToken(userInfo: LoginData) {
      return await login(userInfo)
    },
    // 登录
    async login(userInfo: LoginData) {
      // 登录前先清除旧 token，避免状态残留
      removeToken()
      this.token = ''

      const res = await login(userInfo)
      const data = res.data as { token?: string; requireTwoFactor?: boolean; tempToken?: string }

      // 如果需要两步验证，不设置 token
      if (data.requireTwoFactor) {
        return res
      }

      if (data.token) {
        this.token = data.token
        setToken(data.token)
      }
      return res
    },
    // 获取用户信息
    async getInfo() {
      const res = await getInfo()
      const data = res.data // { user, roles, roleList, permissions }

      if (data.roles && data.roles.length > 0) {
        this.roles = data.roles
        this.roleList = data.roleList || []
        this.permissions = data.permissions
      } else {
        this.roles = ['ROLE_DEFAULT']
        this.roleList = []
      }

      this.userId = data.user.userId?.toString() || ''
      this.name = data.user.nickName || data.user.userName
      this.avatar = data.user.avatar || ''
      this.email = data.user.email || ''
      this.isLoggedIn = true // 标记已成功登录
      return data
    },
    // 退出系统
    async logout() {
      try {
        await logout()
      } catch {
        // 忽略错误（可能是 token 已失效）
      }
      this.token = ''
      this.roles = []
      this.permissions = []
      this.isLoggedIn = false
      removeToken()

      // 清空菜单缓存
      const menuStore = useMenuStore()
      menuStore.clearMenus()
    },
  },
})

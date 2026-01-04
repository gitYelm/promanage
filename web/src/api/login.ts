import request from '@/utils/request'

export interface LoginData {
  username?: string
  password?: string
  code?: string
  uuid?: string
}

export interface LoginResult {
  token?: string
  requireTwoFactor?: boolean
  tempToken?: string
}

export interface CaptchaResult {
  captchaEnabled: boolean
  uuid?: string
  img?: string
}

export interface TwoFactorStatusResult {
  globalEnabled: boolean
}

export interface TwoFactorSetupResult {
  globalEnabled: boolean
  userEnabled: boolean
  secret?: string
  qrCode?: string
}

// 登录方法
export function login(data: LoginData) {
  return request<LoginResult>({
    url: '/auth/login',
    method: 'post',
    data: data,
  })
}

// 获取验证码
export function getCaptchaImage() {
  return request<CaptchaResult>({
    url: '/auth/captchaImage',
    method: 'get',
  })
}

// 获取用户信息
export function getInfo() {
  return request({
    url: '/system/user/getInfo',
    method: 'get',
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post',
  })
}

// 获取路由
export function getRouters() {
  return request({
    url: '/getRouters',
    method: 'get',
  })
}

// ==================== 两步验证相关 ====================

// 获取两步验证全局状态
export function getTwoFactorStatus() {
  return request<TwoFactorStatusResult>({
    url: '/auth/twoFactor/status',
    method: 'get',
  })
}

// 两步验证登录
export function verifyTwoFactor(data: { tempToken: string; code: string }) {
  return request<{ token: string }>({
    url: '/auth/twoFactor/verify',
    method: 'post',
    data,
  })
}

// 获取两步验证设置信息
export function getTwoFactorSetup() {
  return request<TwoFactorSetupResult>({
    url: '/auth/twoFactor/setup',
    method: 'get',
  })
}

// 启用两步验证
export function enableTwoFactor(data: { secret: string; code: string }) {
  return request({
    url: '/auth/twoFactor/enable',
    method: 'post',
    data,
  })
}

// 禁用两步验证
export function disableTwoFactor() {
  return request({
    url: '/auth/twoFactor/disable',
    method: 'post',
  })
}

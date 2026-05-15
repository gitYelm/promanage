import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { useToast } from '@/components/ui/toast/use-toast'
import { getToken, setToken } from '@/utils/auth'
import { useUserStore } from '@/stores/modules/user'
import { useAppStore } from '@/stores/modules/app'
import { ErrorCode, shouldRedirectToLogin, getErrorMessage } from '@/types/error-code'

const { toast } = useToast()

// 默认超时时间（秒）
const DEFAULT_TIMEOUT = 10
const DEFAULT_UPLOAD_TIMEOUT = 30

/**
 * 获取请求超时时间（毫秒）
 */
function getTimeout(isUpload: boolean = false): number {
  try {
    const appStore = useAppStore()
    if (isUpload) {
      return (appStore.siteConfig.uploadTimeout || DEFAULT_UPLOAD_TIMEOUT) * 1000
    }
    return (appStore.siteConfig.requestTimeout || DEFAULT_TIMEOUT) * 1000
  } catch {
    // store 未初始化时使用默认值
    return (isUpload ? DEFAULT_UPLOAD_TIMEOUT : DEFAULT_TIMEOUT) * 1000
  }
}

// 创建 axios 实例
const service = axios.create({
  // axios中请求配置有baseURL选项，表示请求URL公共部分
  baseURL: import.meta.env.VITE_APP_BASE_API,
  // 默认超时（会在拦截器中动态设置）
  timeout: DEFAULT_TIMEOUT * 1000,
})

// request 拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 是否需要设置 token
    const isToken = (config.headers || {}).isToken === false
    // 模拟从 pinia 或 localStorage 获取 token
    const token = getToken()

    if (token && !isToken) {
      config.headers['Authorization'] = 'Bearer ' + token
    }

    // 动态设置超时时间
    const isUpload = config.data instanceof FormData || config.headers?.['Content-Type'] === 'multipart/form-data'
    if (!config.timeout || config.timeout === DEFAULT_TIMEOUT * 1000) {
      config.timeout = getTimeout(isUpload)
    }

    // 可以在这里添加其他通用 header，如 tenant-id 等
    return config
  },
  (error: unknown) => {
    return Promise.reject(error)
  },
)

// response 拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 滑动过期：检查响应头中是否有新 Token
    const newToken = response.headers['x-new-token']
    if (newToken) {
      setToken(newToken)
    }

    // 未设置状态码则默认成功状态
    const code = response.data.code || ErrorCode.SUCCESS
    // 获取错误信息 (优先使用后端返回的 msg,如果没有则使用前端错误码映射)
    const msg = response.data.msg || getErrorMessage(code)

    // 二进制数据则直接返回
    if (
      response.request.responseType === 'blob' ||
      response.request.responseType === 'arraybuffer'
    ) {
      return response.data
    }

    // 判断是否需要跳转登录页 (使用业务错误码)
    if (shouldRedirectToLogin(code)) {
      // 先显示提示，延迟后再跳转登录页
      toast({
        title: '登录状态已过期',
        description: '为保障账户安全，请重新登录',
        variant: 'destructive',
        duration: 3000,
      })
      const userStore = useUserStore()
      const appStore = useAppStore()
      const loginPath = appStore.siteConfig.loginPath || '/login'
      setTimeout(() => {
        userStore.logout().then(() => {
          location.href = loginPath
        })
      }, 2000)
      return Promise.reject(new Error('登录状态已过期'))
    }

    // 判断系统内部错误
    if (code === ErrorCode.INTERNAL_ERROR || code === ErrorCode.DATABASE_ERROR) {
      toast({
        title: '系统错误',
        description: msg,
        variant: 'destructive',
      })
      return Promise.reject(new Error(msg))
    }

    // 判断是否成功
    if (code !== ErrorCode.SUCCESS) {
      toast({
        title: '操作失败',
        description: msg,
        variant: 'destructive',
      })
      return Promise.reject(new Error(msg))
    }

    // 成功,返回数据
    return response.data
  },
  (error: unknown) => {
    const err = error as {
      message?: string
      response?: { status: number; data?: { code?: number; msg?: string } }
    }
    let message = err.message || '未知错误'
    let title = '网络错误'

    // 尝试从响应中获取后端返回的错误信息
    if (err.response?.data) {
      const httpStatus = err.response.status // HTTP 状态码
      const { code, msg } = err.response.data // 业务错误码和消息
      // 优先使用后端返回的 msg,如果没有则使用错误码映射
      const errorMessage = msg || (code !== undefined ? getErrorMessage(code) : '')

      if (httpStatus === 400) {
        title = '参数验证失败'
        message = errorMessage || '请求参数验证失败'
      } else if (httpStatus === 401) {
        const userStore = useUserStore()
        const appStore = useAppStore()
        const loginPath = appStore.siteConfig.loginPath || '/login'

        // 使用后端返回的具体错误信息，如果没有则使用默认消息
        title = '认证失败'
        message = errorMessage || '登录状态已过期，请重新登录'

        // 只有用户已成功登录过（使用中过期）才弹窗提示
        if (userStore.isLoggedIn) {
          toast({
            title,
            description: message,
            variant: 'destructive',
            duration: 3000,
          })
          setTimeout(() => {
            userStore.logout().then(() => {
              location.href = loginPath
            })
          }, 2000)
        }
        // 冷启动验证失败时不弹窗，由路由守卫静默处理
        return Promise.reject(new Error(message))
      } else if (httpStatus === 403) {
        title = '权限不足'
        message = errorMessage || '您没有权限执行此操作'
      } else if (httpStatus === 429) {
        title = '请求过于频繁'
        message = '请稍后再试'
      } else if (httpStatus === 500) {
        title = '系统错误'
        message = errorMessage || '系统内部错误'
      } else if (errorMessage) {
        message = errorMessage
      }
    } else if (message == 'Network Error') {
      message = '后端接口连接异常'
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时'
    } else if (message.includes('Request failed with status code')) {
      message = '系统接口' + message.substr(message.length - 3) + '异常'
    }

    toast({
      title,
      description: message,
      variant: 'destructive',
    })
    return Promise.reject(new Error(message))
  },
)

export default service

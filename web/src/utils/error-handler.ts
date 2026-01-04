import { toast } from '@/components/ui/toast'

/**
 * 全局错误处理器
 * 用于统一处理异步操作中的错误
 */
export function handleError(error: unknown, context?: string) {
  console.error(`[${context || 'Error'}]`, error)

  let message = '操作失败'

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String((error as any).message)
  }

  toast({
    title: '错误',
    description: message,
    variant: 'destructive',
  })
}

/**
 * 包装异步函数,自动处理错误
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, context)
      throw error // 重新抛出,让调用者决定是否需要额外处理
    }
  }) as T
}

/**
 * 安全执行异步函数,捕获所有错误
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options?: {
    context?: string
    onError?: (error: unknown) => void
    defaultValue?: T
  }
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    handleError(error, options?.context)
    options?.onError?.(error)
    return options?.defaultValue
  }
}

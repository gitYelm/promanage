import { ref, onMounted, onUnmounted, watch, type Ref, type WatchSource } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'

export interface UseUnsavedChangesOptions {
  /** 是否启用路由离开守卫，默认 true */
  enableRouteGuard?: boolean
  /** 是否监听浏览器刷新/关闭事件，默认 true */
  watchBrowserClose?: boolean
}

export interface UseUnsavedChangesReturn {
  /** 是否有未保存的更改 */
  isDirty: Ref<boolean>
  /** 标记为已修改 */
  markDirty: () => void
  /** 标记为已保存（清除脏状态） */
  markClean: () => void
  /** 显示离开确认弹窗 */
  showLeaveDialog: Ref<boolean>
  /** 确认离开（用于弹窗确认按钮） */
  confirmLeave: () => void
  /** 取消离开（用于弹窗取消按钮） */
  cancelLeave: () => void
  /** 监听数据变化自动标记脏状态 */
  watchChanges: <T>(source: WatchSource<T>) => void
  /** 检查是否可以离开（用于弹窗关闭等场景），返回 true 表示可以离开 */
  canLeave: () => boolean
  /** 尝试离开，如果有未保存更改则显示确认弹窗，返回 Promise<boolean> */
  tryLeave: () => Promise<boolean>
}

/**
 * 未保存更改提示组合式函数
 *
 * @example
 * ```ts
 * // 场景1: 页面级表单（路由离开提示）
 * const { isDirty, markClean, showLeaveDialog, confirmLeave, cancelLeave, watchChanges } = useUnsavedChanges()
 * watchChanges(() => form)
 * const handleSave = async () => { await save(); markClean() }
 *
 * // 场景2: 弹窗表单（关闭弹窗提示）
 * const { isDirty, markClean, canLeave, tryLeave, showLeaveDialog, confirmLeave, cancelLeave } = useUnsavedChanges({ enableRouteGuard: false })
 * const handleClose = async () => {
 *   if (await tryLeave()) {
 *     showDialog.value = false
 *   }
 * }
 * ```
 */
export function useUnsavedChanges(options: UseUnsavedChangesOptions = {}): UseUnsavedChangesReturn {
  const { enableRouteGuard = true, watchBrowserClose = true } = options

  const isDirty = ref(false)
  const showLeaveDialog = ref(false)

  // 存储路由守卫的 next 函数
  let _pendingNext: ((value?: boolean) => void) | null = null
  // 存储 tryLeave 的 resolve 函数
  let pendingResolve: ((value: boolean) => void) | null = null

  const markDirty = () => {
    isDirty.value = true
  }

  const markClean = () => {
    isDirty.value = false
  }

  // 获取 router 实例用于手动导航
  const router = enableRouteGuard ? useRouter() : null

  const confirmLeave = () => {
    showLeaveDialog.value = false
    isDirty.value = false

    // 路由场景：手动导航到目标页面
    if (pendingTo && router) {
      const target = pendingTo
      pendingTo = null
      _pendingNext = null
      router.push(target)
    }

    // 弹窗场景
    if (pendingResolve) {
      pendingResolve(true)
      pendingResolve = null
    }
  }

  const cancelLeave = () => {
    showLeaveDialog.value = false
    pendingTo = null
    _pendingNext = null
    if (pendingResolve) {
      pendingResolve(false)
      pendingResolve = null
    }
  }

  // 检查是否可以离开（同步）
  const canLeave = () => !isDirty.value

  // 尝试离开（异步，用于弹窗等场景）
  const tryLeave = (): Promise<boolean> => {
    if (!isDirty.value) {
      return Promise.resolve(true)
    }
    return new Promise((resolve) => {
      pendingResolve = resolve
      showLeaveDialog.value = true
    })
  }

  // 监听数据变化的辅助函数
  const watchChanges = <T>(source: WatchSource<T>) => {
    let isFirstChange = true
    watch(
      source,
      () => {
        // 跳过初始化时的第一次变化
        if (isFirstChange) {
          isFirstChange = false
          return
        }
        markDirty()
      },
      { deep: true },
    )
  }

  // 存储目标路由，用于确认后手动导航
  let pendingTo: any = null

  // 路由离开守卫
  if (enableRouteGuard) {
    onBeforeRouteLeave((to, _from, next) => {
      if (isDirty.value) {
        pendingTo = to
        _pendingNext = next
        showLeaveDialog.value = true
        // 返回 false 阻止导航，等待用户确认
        return false
      }
      next()
    })
  }

  // 浏览器刷新/关闭事件
  if (watchBrowserClose) {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty.value) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    onMounted(() => {
      window.addEventListener('beforeunload', handleBeforeUnload)
    })

    onUnmounted(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })
  }

  return {
    isDirty,
    markDirty,
    markClean,
    showLeaveDialog,
    confirmLeave,
    cancelLeave,
    watchChanges,
    canLeave,
    tryLeave,
  }
}

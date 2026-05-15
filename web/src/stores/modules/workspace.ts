import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getCurrentWorkspaceConfig, type WorkspaceClientConfig } from '@/api/system/workspace'

const fallbackConfig: WorkspaceClientConfig = {
  roleKey: 'default',
  roleName: '默认配置',
  defaultPath: '/dashboard',
  dashboardPath: '/dashboard',
  defaultOpenMenu: null,
  menuScope: 'all',
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const config = ref<WorkspaceClientConfig>({ ...fallbackConfig })
  const loaded = ref(false)
  const loading = ref(false)

  const defaultPath = computed(() => normalizePath(config.value.defaultPath || fallbackConfig.defaultPath))
  const dashboardPath = computed(() => normalizePath(config.value.dashboardPath || defaultPath.value))
  const defaultOpenMenu = computed(() => config.value.defaultOpenMenu || '')

  async function fetchConfig(force = false) {
    if (loaded.value && !force) return config.value
    loading.value = true
    try {
      config.value = await getCurrentWorkspaceConfig()
      loaded.value = true
    } catch {
      config.value = { ...fallbackConfig }
      loaded.value = true
    } finally {
      loading.value = false
    }
    return config.value
  }

  function resolveDashboardTarget(path: string) {
    return path === '/dashboard' ? dashboardPath.value : path
  }

  function clearConfig() {
    config.value = { ...fallbackConfig }
    loaded.value = false
  }

  return {
    config,
    loaded,
    loading,
    defaultPath,
    dashboardPath,
    defaultOpenMenu,
    fetchConfig,
    resolveDashboardTarget,
    clearConfig,
  }
})

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}

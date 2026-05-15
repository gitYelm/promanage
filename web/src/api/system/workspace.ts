import request from '@/utils/request'
import type { PageResult } from './types'

export interface WorkspaceConfig {
  configId: string
  roleKey: string
  roleName?: string | null
  defaultPath: string
  dashboardPath?: string | null
  defaultOpenMenu?: string | null
  menuScope: string
  status: string
  remark?: string | null
  createTime?: string
  updateTime?: string
}

export interface WorkspaceConfigQuery {
  pageNum?: number
  pageSize?: number
  roleKey?: string
  status?: string
}

export interface WorkspaceConfigForm {
  configId?: string
  roleKey?: string
  defaultPath?: string
  dashboardPath?: string | null
  defaultOpenMenu?: string | null
  menuScope?: string
  status?: string
  remark?: string | null
}

export interface WorkspaceClientConfig {
  roleKey: string
  roleName?: string | null
  defaultPath: string
  dashboardPath: string
  defaultOpenMenu?: string | null
  menuScope: string
}

export interface WorkspaceRoleOption {
  roleId: string
  roleName: string
  roleKey: string
}

export interface WorkspaceMenuOption {
  menuId: string
  parentId: string | null
  menuName: string
  menuType: string
  path: string
}

const unwrap = <T>(res: unknown) => (res as { data: T }).data

export function getCurrentWorkspaceConfig(): Promise<WorkspaceClientConfig> {
  return request({ url: '/system/workspace-config/current', method: 'get' }).then(
    unwrap<WorkspaceClientConfig>,
  )
}

export function listWorkspaceConfig(query: WorkspaceConfigQuery): Promise<PageResult<WorkspaceConfig>> {
  return request({ url: '/system/workspace-config', method: 'get', params: query }).then(
    unwrap<PageResult<WorkspaceConfig>>,
  )
}

export function getWorkspaceConfig(configId: string): Promise<WorkspaceConfig> {
  return request({ url: `/system/workspace-config/${configId}`, method: 'get' }).then(
    unwrap<WorkspaceConfig>,
  )
}

export function addWorkspaceConfig(data: WorkspaceConfigForm) {
  return request({ url: '/system/workspace-config', method: 'post', data })
}

export function updateWorkspaceConfig(data: WorkspaceConfigForm) {
  return request({ url: `/system/workspace-config/${data.configId}`, method: 'put', data })
}

export function delWorkspaceConfig(configIds: string[]) {
  return request({ url: '/system/workspace-config', method: 'delete', params: { ids: configIds.join(',') } })
}

export function workspaceRoleOptions(): Promise<WorkspaceRoleOption[]> {
  return request({ url: '/system/workspace-config/role-options', method: 'get' }).then(
    unwrap<WorkspaceRoleOption[]>,
  )
}

export function workspaceMenuOptions(): Promise<WorkspaceMenuOption[]> {
  return request({ url: '/system/workspace-config/menu-options', method: 'get' }).then(
    unwrap<WorkspaceMenuOption[]>,
  )
}

import request from '@/utils/request'
import { type SysRole, type RoleQuery, type PageResult } from './types'

/** 角色表单参数 */
export interface RoleForm {
  roleId?: string
  roleName?: string
  roleKey?: string
  roleSort?: number
  dataScope?: string
  menuCheckStrictly?: boolean
  deptCheckStrictly?: boolean
  status?: string
  menuIds?: string[]
  deptIds?: string[]
  remark?: string
}

export function listRole(query: RoleQuery): Promise<PageResult<SysRole>> {
  return request<{ data: PageResult<SysRole> }>({
    url: '/system/role',
    method: 'get',
    params: query,
  }).then((res: unknown) => (res as { data: PageResult<SysRole> }).data)
}

export function getRole(roleId: string): Promise<SysRole> {
  return request<{ data: SysRole }>({
    url: `/system/role/${roleId}`,
    method: 'get',
  }).then((res: unknown) => (res as { data: SysRole }).data)
}

export function addRole(data: RoleForm) {
  return request<{ msg: string }>({
    url: '/system/role',
    method: 'post',
    data,
  })
}

export function updateRole(data: RoleForm) {
  return request<{ msg: string }>({
    url: `/system/role/${data.roleId}`,
    method: 'put',
    data,
  })
}

export function delRole(roleIds: string[]) {
  return request<{ msg: string }>({
    url: `/system/role/${roleIds[0]}`,
    method: 'delete',
  })
}

export function changeRoleStatus(roleId: string, status: string) {
  return request<{ msg: string }>({
    url: '/system/role/changeStatus',
    method: 'put',
    data: { roleId, status },
  })
}

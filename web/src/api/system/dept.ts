import request from '@/utils/request'
import { type SysDept } from './types'

/** 部门查询参数 */
export interface DeptQuery {
  deptName?: string
  status?: string
}

/** 部门表单参数 */
export interface DeptForm {
  deptId?: string
  parentId?: string | number | null
  deptName?: string
  orderNum?: number
  leader?: string
  phone?: string
  email?: string
  status?: string
}

export function listDept(query?: DeptQuery): Promise<SysDept[]> {
  return request<{ data: SysDept[] }>({
    url: '/system/dept',
    method: 'get',
    params: query
  }).then((res: unknown) => (res as { data: SysDept[] }).data)
}

export function getDept(deptId: string): Promise<SysDept> {
  return request<{ data: SysDept }>({
    url: `/system/dept/${deptId}`,
    method: 'get'
  }).then((res: unknown) => (res as { data: SysDept }).data)
}

export function addDept(data: DeptForm) {
  return request<{ msg: string }>({
    url: '/system/dept',
    method: 'post',
    data
  })
}

export function updateDept(data: DeptForm) {
  return request<{ msg: string }>({
    url: `/system/dept/${data.deptId}`,
    method: 'put',
    data
  })
}

export function delDept(deptId: string) {
  return request<{ msg: string }>({
    url: `/system/dept/${deptId}`,
    method: 'delete'
  })
}

export function listDeptExcludeChild(deptId: string): Promise<SysDept[]> {
  return request<{ data: SysDept[] }>({
    url: `/system/dept/list/exclude/${deptId}`,
    method: 'get'
  }).then((res: unknown) => (res as { data: SysDept[] }).data)
}

export function listDeptTree(): Promise<SysDept[]> {
  return request<{ data: SysDept[] }>({
    url: '/system/dept',
    method: 'get'
  }).then((res: unknown) => (res as { data: SysDept[] }).data)
}

export function changeDeptStatus(deptId: string, status: string) {
  return request({
    url: '/system/dept/changeStatus',
    method: 'put',
    data: { deptId, status }
  })
}

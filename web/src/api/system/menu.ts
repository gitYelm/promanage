import request from '@/utils/request'
import { type SysMenu, type MenuQuery } from './types'

/** 菜单创建/更新参数 */
export interface MenuForm {
  menuId?: string
  parentId?: string | number | null
  menuName?: string
  orderNum?: number
  path?: string
  component?: string
  isFrame?: number
  isCache?: number
  menuType?: string
  visible?: string
  status?: string
  perms?: string
  icon?: string
}

export function listMenu(query?: MenuQuery) {
  return request<{ data: SysMenu[] }>({
    url: '/system/menu',
    method: 'get',
    params: query
  }).then((res: any) => res.data)
}

export function getMenu(menuId: string) {
  return request<{ data: SysMenu }>({
    url: `/system/menu/${menuId}`,
    method: 'get'
  })
}

export function addMenu(data: MenuForm) {
  return request({
    url: '/system/menu',
    method: 'post',
    data
  })
}

export function updateMenu(data: MenuForm) {
  return request({
    url: `/system/menu/${data.menuId}`,
    method: 'put',
    data
  })
}

export function delMenu(menuId: string) {
  return request({
    url: `/system/menu/${menuId}`,
    method: 'delete'
  })
}

export function treeselect() {
  return request<{ data: SysMenu[] }>({
    url: '/system/menu/treeselect',
    method: 'get'
  })
}

export function roleMenuTreeselect(roleId: string) {
  return request<{ data: { menus: SysMenu[]; checkedKeys: string[] } }>({
    url: `/system/menu/roleMenuTreeselect/${roleId}`,
    method: 'get'
  })
}

export function changeMenuStatus(menuId: string, status: string) {
  return request({
    url: '/system/menu/changeStatus',
    method: 'put',
    data: { menuId, status }
  })
}

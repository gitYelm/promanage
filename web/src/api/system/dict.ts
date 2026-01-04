import request from '@/utils/request'
import {
  type SysDictType as DictType,
  type SysDictData as DictData,
  type DictTypeQuery,
  type DictDataQuery,
  type PageResult,
} from './types'

export type { SysDictType as DictType, SysDictData as DictData } from './types'

/** 字典类型创建/更新参数 */
export interface DictTypeForm {
  dictId?: string
  dictName?: string
  dictType?: string
  status?: string
  remark?: string
}

/** 字典数据创建/更新参数 */
export interface DictDataForm {
  dictCode?: string
  dictSort?: number
  dictLabel?: string
  dictValue?: string
  dictType?: string
  cssClass?: string
  listClass?: string
  isDefault?: string
  status?: string
  remark?: string
}

export function listType(query: DictTypeQuery) {
  return request<{ data: PageResult<DictType> }>({
    url: '/system/dict/type',
    method: 'get',
    params: query,
  }).then((res: any) => res.data)
}

export function getType(dictId: string) {
  return request<{ data: DictType }>({
    url: `/system/dict/type/${dictId}`,
    method: 'get',
  }).then((res: any) => res.data)
}

export function addType(data: DictTypeForm) {
  return request({
    url: '/system/dict/type',
    method: 'post',
    data,
  })
}

export function updateType(data: DictTypeForm) {
  return request({
    url: `/system/dict/type/${data.dictId}`,
    method: 'put',
    data,
  })
}

export function delType(dictIds: string[]) {
  return request({
    url: '/system/dict/type',
    method: 'delete',
    params: { ids: dictIds.join(',') },
  })
}

// 字典数据
export function listData(query: DictDataQuery) {
  return request<{ data: PageResult<DictData> }>({
    url: '/system/dict/data',
    method: 'get',
    params: query,
  }).then((res: any) => res.data)
}

export function getData(dictCode: string) {
  return request<{ data: DictData }>({
    url: `/system/dict/data/${dictCode}`,
    method: 'get',
  }).then((res: any) => res.data)
}

export function addData(data: DictDataForm) {
  return request({
    url: '/system/dict/data',
    method: 'post',
    data,
  })
}

export function updateData(data: DictDataForm) {
  return request({
    url: `/system/dict/data/${data.dictCode}`,
    method: 'put',
    data,
  })
}

export function delData(dictCodes: string[]) {
  return request({
    url: '/system/dict/data',
    method: 'delete',
    params: { ids: dictCodes.join(',') },
  })
}

// 切换字典类型状态
export function changeDictTypeStatus(dictId: string, status: string) {
  return request({
    url: '/system/dict/type/changeStatus',
    method: 'put',
    data: { dictId, status },
  })
}

// 切换字典数据状态
export function changeDictDataStatus(dictCode: string, status: string) {
  return request({
    url: '/system/dict/data/changeStatus',
    method: 'put',
    data: { dictCode, status },
  })
}

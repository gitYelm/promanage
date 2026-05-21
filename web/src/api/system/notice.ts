import request from '@/utils/request'
import { type SysNotice, type NoticeQuery, type PageResult } from './types'

export type { SysNotice } from './types'

/** 通知公告创建/更新参数 */
export interface NoticeForm {
  noticeId?: string
  noticeTitle: string
  noticeType: string
  noticeContent: string
  status: string
  remark?: string
}

export interface NoticeFormState extends NoticeForm {
  noticeId?: string
}

export function listNotice(query: NoticeQuery) {
  return request<{ data: PageResult<SysNotice> }>({
    url: '/system/notice',
    method: 'get',
    params: query,
  }).then((res: any) => res.data)
}

export function getNotice(noticeId: string) {
  return request<{ data: SysNotice }>({
    url: `/system/notice/${noticeId}`,
    method: 'get',
  }).then((res: any) => res.data)
}

export function addNotice(data: NoticeForm) {
  return request({
    url: '/system/notice',
    method: 'post',
    data,
  })
}

export function updateNotice(data: NoticeForm) {
  return request({
    url: `/system/notice/${data.noticeId}`,
    method: 'put',
    data,
  })
}

export function delNotice(noticeIds: string[]) {
  return request({
    url: '/system/notice',
    method: 'delete',
    params: { ids: noticeIds.join(',') },
  })
}

export function changeNoticeStatus(noticeId: string, status: string) {
  return request({
    url: '/system/notice/changeStatus',
    method: 'put',
    data: { noticeId, status },
  })
}

import request from '@/utils/request'
import { type SysPost, type PostQuery, type PageResult } from './types'

/** 岗位创建/更新参数 */
export interface PostForm {
  postId?: string
  postCode?: string
  postName?: string
  postSort?: number
  status?: string
  remark?: string
}

export function listPost(query: PostQuery) {
  return request<{ data: PageResult<SysPost> }>({
    url: '/system/post',
    method: 'get',
    params: query
  }).then((res: any) => res.data)
}

export function getPost(postId: string) {
  return request<{ data: SysPost }>({
    url: `/system/post/${postId}`,
    method: 'get'
  }).then((res: any) => res.data)
}

export function addPost(data: PostForm) {
  return request({
    url: '/system/post',
    method: 'post',
    data
  })
}

export function updatePost(data: PostForm) {
  return request({
    url: `/system/post/${data.postId}`,
    method: 'put',
    data
  })
}

export function delPost(postIds: string[]) {
  return request({
    url: '/system/post',
    method: 'delete',
    params: { ids: postIds.join(',') }
  })
}

export function changePostStatus(postId: string, status: string) {
  return request({
    url: '/system/post/changeStatus',
    method: 'put',
    data: { postId, status }
  })
}

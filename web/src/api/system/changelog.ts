import request from '@/utils/request'

export interface CommitInfo {
  sha: string
  shortSha: string
  message: string
  fullMessage?: string // 完整提交信息（多行时）
  type: string
  date: string
  author: string
  authorAvatar?: string
}

export interface ChangelogResponse {
  rows: CommitInfo[]
  total: number
  source: 'github' | 'static'
  repoUrl?: string
}

export function getChangelog(page = 1, perPage = 30) {
  return request<{ data: ChangelogResponse }>({
    url: '/system/changelog',
    method: 'get',
    params: { page, perPage },
  }).then((res: any) => res.data)
}

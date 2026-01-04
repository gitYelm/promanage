import request from '@/utils/request'
import { type SysJob, type PageQuery, type PageResult } from '@/api/system/types'

/** 定时任务查询参数 */
export interface JobQuery extends PageQuery {
  jobName?: string
  jobGroup?: string
  status?: string
}

/** 定时任务表单参数 */
export interface JobForm {
  jobId?: string
  jobName?: string
  jobGroup?: string
  invokeTarget?: string
  cronExpression?: string
  misfirePolicy?: string
  concurrent?: string
  status?: string
  remark?: string
}

/** 任务执行日志 */
export interface SysJobLog {
  jobLogId: string
  jobName: string
  jobGroup: string
  invokeTarget: string
  jobMessage: string
  status: string
  exceptionInfo?: string
  createTime: string
}

export function listJob(query: JobQuery): Promise<PageResult<SysJob>> {
  return request<{ data: PageResult<SysJob> }>({
    url: '/monitor/job',
    method: 'get',
    params: query,
  }).then((res: unknown) => (res as { data: PageResult<SysJob> }).data)
}

export function getJob(jobId: string): Promise<SysJob> {
  return request<{ data: SysJob }>({
    url: `/monitor/job/${jobId}`,
    method: 'get',
  }).then((res: unknown) => (res as { data: SysJob }).data)
}

export function addJob(data: JobForm) {
  return request<{ msg: string }>({
    url: '/monitor/job',
    method: 'post',
    data,
  })
}

export function updateJob(data: JobForm) {
  return request<{ msg: string }>({
    url: `/monitor/job/${data.jobId}`,
    method: 'put',
    data,
  })
}

export function delJob(jobIds: string[]) {
  return request<{ msg: string }>({
    url: '/monitor/job',
    method: 'delete',
    params: { ids: jobIds.join(',') },
  })
}

export function runJob(jobId: string) {
  return request<{ msg: string }>({
    url: '/monitor/job/run',
    method: 'post',
    data: { jobId },
  })
}

export function changeJobStatus(jobId: string, status: string) {
  return request<{ msg: string }>({
    url: '/monitor/job/changeStatus',
    method: 'put',
    data: { jobId, status },
  })
}

/** 查询任务执行日志 */
export function listJobLog(query: JobQuery): Promise<PageResult<SysJobLog>> {
  return request<{ data: PageResult<SysJobLog> }>({
    url: '/monitor/job/log',
    method: 'get',
    params: query,
  }).then((res: unknown) => (res as { data: PageResult<SysJobLog> }).data)
}

/** 清空任务日志 */
export function cleanJobLog() {
  return request<{ msg: string }>({
    url: '/monitor/job/log/clean',
    method: 'delete',
  })
}

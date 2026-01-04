import request from '@/utils/request'

/** 导出格式 */
export type ExportFormat = 'xlsx' | 'csv' | 'json'

/** 导出范围 */
export type ExportScope = 'current' | 'all' | 'selected'

/** 导出列配置 */
export interface ExportColumn {
  key: string
  header: string
  width?: number
}

/** 创建导出任务参数 */
export interface CreateExportTaskDto {
  module: string
  taskName?: string
  format: ExportFormat
  scope: ExportScope
  columns?: ExportColumn[]
  queryParams?: Record<string, any>
  selectedIds?: string[]
}

/** 导出任务状态 */
export type ExportTaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

/** 导出任务 */
export interface ExportTask {
  taskId: string
  taskName: string
  module: string
  status: ExportTaskStatus
  format: ExportFormat
  progress: number
  totalRows: number | null
  processedRows: number | null
  filePath: string | null
  fileSize: number | null
  errorMsg: string | null
  createBy: string | null
  createTime: string | null
  finishTime: string | null
  expireTime: string | null
}

/** 创建导出任务 */
export function createExportTask(data: CreateExportTaskDto) {
  return request<{ data: { taskId: string; taskName: string } }>({
    url: '/export/task',
    method: 'post',
    data,
  }).then((res: any) => res.data)
}

/** 查询导出任务列表 */
export function listExportTasks(params?: {
  pageNum?: number
  pageSize?: number
  module?: string
  status?: string
}) {
  return request<{ data: { rows: ExportTask[]; total: number } }>({
    url: '/export/task',
    method: 'get',
    params,
  }).then((res: any) => res.data)
}

/** 获取任务详情 */
export function getExportTask(taskId: string) {
  return request<{ data: ExportTask }>({
    url: `/export/task/${taskId}`,
    method: 'get',
  }).then((res: any) => res.data)
}

/** 下载导出文件 */
export function downloadExportFile(taskId: string) {
  return request({
    url: `/export/task/${taskId}/download`,
    method: 'get',
    responseType: 'blob',
  })
}

/** 删除导出任务 */
export function deleteExportTask(taskId: string) {
  return request({
    url: `/export/task/${taskId}`,
    method: 'delete',
  })
}

/** 获取模块可导出列 */
export function getModuleColumns(module: string) {
  return request<{ data: ExportColumn[] }>({
    url: `/export/columns/${module}`,
    method: 'get',
  }).then((res: any) => res.data)
}

/** 导出配置 */
export interface ExportConfig {
  fileExpireHours: number
}

/** 获取导出配置 */
export function getExportConfig() {
  return request<{ data: ExportConfig }>({
    url: '/export/config',
    method: 'get',
  }).then((res: any) => res.data)
}

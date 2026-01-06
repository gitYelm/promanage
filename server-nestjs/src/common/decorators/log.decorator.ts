import { SetMetadata } from '@nestjs/common'

export const LOG_METADATA_KEY = 'log_metadata'

export interface LogMetadata {
  title: string // 模块标题
  businessType: number // 业务类型（0其它 1新增 2修改 3删除）
}

/**
 * 操作日志装饰器
 * @param title 模块标题
 * @param businessType 业务类型（0其它 1新增 2修改 3删除）
 */
export const Log = (title: string, businessType: number = 0) =>
  SetMetadata(LOG_METADATA_KEY, { title, businessType } as LogMetadata)

/**
 * 业务类型枚举
 */
export enum BusinessType {
  OTHER = 0, // 其它
  INSERT = 1, // 新增
  UPDATE = 2, // 修改
  DELETE = 3, // 删除
  GRANT = 4, // 授权
  EXPORT = 5, // 导出
  IMPORT = 6, // 导入
  FORCE = 7, // 强退
  CLEAN = 8, // 清空
}

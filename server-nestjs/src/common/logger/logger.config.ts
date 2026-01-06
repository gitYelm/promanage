import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { utilities as nestWinstonModuleUtilities } from 'nest-winston'

/**
 * 日志级别配置
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const LOG_DIR = process.env.LOG_DIR || 'logs'
const NODE_ENV = process.env.NODE_ENV || 'development'

/**
 * 自定义日志格式
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
)

/**
 * 控制台输出格式(开发环境使用彩色输出)
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.ms(),
  nestWinstonModuleUtilities.format.nestLike('RBAC-Admin', {
    colors: true,
    prettyPrint: true,
  }),
)

/**
 * 创建日志轮转传输器
 */
const createRotateTransport = (level: string, filename: string): DailyRotateFile => {
  return new DailyRotateFile({
    level,
    dirname: LOG_DIR,
    filename: `${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true, // 压缩归档
    maxSize: '20m', // 单个文件最大 20MB
    maxFiles: '14d', // 保留 14 天
    format: customFormat,
  })
}

/**
 * Winston 日志配置
 */
export const winstonConfig: winston.LoggerOptions = {
  level: LOG_LEVEL,
  format: customFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: NODE_ENV === 'production' ? customFormat : consoleFormat,
    }),
    // 所有日志
    createRotateTransport('info', 'application'),
    // 错误日志单独记录
    createRotateTransport('error', 'error'),
    // HTTP 请求日志
    createRotateTransport('http', 'http'),
  ],
  // 捕获未处理的异常和 Promise 拒绝
  exceptionHandlers: [
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: customFormat,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: customFormat,
    }),
  ],
}

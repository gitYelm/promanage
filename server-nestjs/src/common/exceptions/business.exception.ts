import { HttpException, HttpStatus } from '@nestjs/common'
import { ErrorCode, ErrorCodeMessage } from '../enums/error-code.enum'

/**
 * 业务异常类
 *
 * 用于抛出业务逻辑错误,会被全局异常过滤器捕获并返回统一格式
 */
export class BusinessException extends HttpException {
  /**
   * 错误码
   */
  private readonly errorCode: ErrorCode

  /**
   * 错误消息
   */
  private readonly errorMessage: string

  /**
   * 额外数据
   */
  private readonly data?: unknown

  constructor(
    errorCode: ErrorCode,
    message?: string,
    data?: unknown,
    httpStatus: HttpStatus = HttpStatus.OK,
  ) {
    // 使用错误码对应的默认消息,如果提供了自定义消息则使用自定义消息
    const errorMessage = message || ErrorCodeMessage[errorCode] || '操作失败'

    const responseBody: { code: ErrorCode; msg: string; data: unknown } = {
      code: errorCode,
      msg: errorMessage,
      data: data ?? null,
    }
    super(responseBody, httpStatus)

    this.errorCode = errorCode
    this.errorMessage = errorMessage
    this.data = data
  }

  /**
   * 获取错误码
   */
  getErrorCode(): ErrorCode {
    return this.errorCode
  }

  /**
   * 获取错误消息
   */
  getErrorMessage(): string {
    return this.errorMessage
  }

  /**
   * 获取额外数据
   */
  getData(): unknown {
    return this.data
  }

  /**
   * 静态工厂方法 - 参数错误
   */
  static invalidParams(message?: string, data?: unknown): BusinessException {
    return new BusinessException(ErrorCode.INVALID_PARAMS, message, data)
  }

  /**
   * 静态工厂方法 - 数据不存在
   */
  static notFound(message?: string, data?: unknown): BusinessException {
    return new BusinessException(ErrorCode.DATA_NOT_FOUND, message, data)
  }

  /**
   * 静态工厂方法 - 数据已存在
   */
  static alreadyExists(message?: string, data?: unknown): BusinessException {
    return new BusinessException(ErrorCode.DATA_ALREADY_EXISTS, message, data)
  }

  /**
   * 静态工厂方法 - 操作被拒绝
   */
  static denied(message?: string, data?: unknown): BusinessException {
    return new BusinessException(ErrorCode.OPERATION_DENIED, message, data)
  }

  /**
   * 静态工厂方法 - 未授权
   */
  static unauthorized(message?: string, data?: unknown): BusinessException {
    return new BusinessException(ErrorCode.UNAUTHORIZED, message, data, HttpStatus.UNAUTHORIZED)
  }

  /**
   * 静态工厂方法 - 无权限
   */
  static forbidden(message?: string, data?: unknown): BusinessException {
    return new BusinessException(ErrorCode.FORBIDDEN, message, data, HttpStatus.FORBIDDEN)
  }

  /**
   * 静态工厂方法 - 内部错误
   */
  static internal(message?: string, data?: unknown): BusinessException {
    return new BusinessException(
      ErrorCode.INTERNAL_ERROR,
      message,
      data,
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }
}

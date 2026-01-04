import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { LoggerService } from '../logger/logger.service';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 全局异常过滤器
 * 捕获所有异常并统一返回格式
 */
@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 忽略 source map 文件的 404 请求（Swagger UI 等工具会请求这些文件）
    if (request.url.endsWith('.map')) {
      return response.status(404).send();
    }

    // 处理 BusinessException
    if (exception instanceof BusinessException) {
      const exceptionResponse = exception.getResponse() as {
        code: number;
        msg: string;
        data: unknown;
      };
      const status = exception.getStatus();

      // 记录业务异常日志
      this.logger.warn(
        `[${request.method}] ${request.url} - 业务异常: ${exceptionResponse.msg} (code: ${exceptionResponse.code})`,
        'AllExceptionsFilter',
      );

      return response.status(status).json(exceptionResponse);
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const showDetail =
      (process.env.ERROR_FULL ?? 'true').toLowerCase() === 'true';
    const messageResponse =
      exception instanceof HttpException ? exception.getResponse() : exception;

    // 处理字符串或对象类型的错误信息，并在开发环境尽可能透出异常细节
    let msg: string;
    if (typeof messageResponse === 'string') {
      msg = messageResponse;
    } else if (
      typeof messageResponse === 'object' &&
      messageResponse !== null &&
      'message' in (messageResponse as Record<string, unknown>)
    ) {
      const m = (messageResponse as { message: unknown }).message;
      if (Array.isArray(m)) {
        msg = m
          .map((x) => (typeof x === 'string' ? x : JSON.stringify(x)))
          .join(', ');
      } else if (typeof m === 'string') {
        msg = m;
      } else if (typeof m === 'number' || typeof m === 'boolean') {
        msg = String(m);
      } else if (m && typeof m === 'object') {
        try {
          msg = JSON.stringify(m);
        } catch {
          msg = 'Internal Server Error';
        }
      } else {
        msg = 'Internal Server Error';
      }
    } else if (messageResponse && typeof messageResponse === 'object') {
      try {
        msg = JSON.stringify(messageResponse);
      } catch {
        msg = 'Internal Server Error';
      }
    } else {
      msg = 'Internal Server Error';
    }

    // 记录错误日志
    const err = exception as { name?: string; stack?: string };
    this.logger.error(
      `[${request.method}] ${request.url} - ${msg}`,
      err.stack,
      'AllExceptionsFilter',
    );
    const errorDetail = showDetail
      ? {
          name: typeof err?.name === 'string' ? err.name : undefined,
          stack: typeof err?.stack === 'string' ? err.stack : undefined,
          response:
            typeof messageResponse === 'object' && messageResponse !== null
              ? messageResponse
              : undefined,
        }
      : undefined;

    response.status(status).json({
      code: status,
      msg: msg,
      data: null,
      error: errorDetail,
    });
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { SSE_METADATA } from '@nestjs/common/constants'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

/**
 * 统一响应接口结构
 */
export interface Response<T> {
  code: number
  msg: string
  data: T
}

/**
 * 全局响应拦截器
 * 统一将返回值封装为 { code: 200, msg: 'success', data: ... } 格式
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T> | T> {
    const isSse = Reflect.getMetadata(SSE_METADATA, context.getHandler()) === true
    if (isSse) return next.handle()

    return next.handle().pipe(
      map((data: T) => ({
        code: 200,
        msg: 'success',
        data,
      })),
    )
  }
}

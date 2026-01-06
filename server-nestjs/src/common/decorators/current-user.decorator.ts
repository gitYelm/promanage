import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface JwtPayload {
  sub: string
  username: string
  iat?: number
  exp?: number
}

/**
 * 获取当前登录用户信息的装饰器
 * @param data 可选，指定要获取的用户属性名
 * @example
 * // 获取完整用户对象
 * @CurrentUser() user: JwtPayload
 * // 获取用户名
 * @CurrentUser('username') username: string
 * // 获取用户ID
 * @CurrentUser('sub') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as JwtPayload | undefined

    if (!user) {
      return null
    }

    return data ? user[data] : user
  },
)

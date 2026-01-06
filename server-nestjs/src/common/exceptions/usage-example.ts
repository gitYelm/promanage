/**
 * BusinessException 使用示例
 *
 * 本文件仅作为示例,不会被实际使用
 */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable } from '@nestjs/common'
import { BusinessException } from './business.exception'
import { ErrorCode } from '../enums/error-code.enum'

@Injectable()
export class ExampleService {
  /**
   * 示例1: 使用预定义错误码
   */
  async example1(userId: string) {
    const user = await this.findUser(userId)

    if (!user) {
      // 方式1: 直接使用错误码
      throw new BusinessException(ErrorCode.USER_NOT_FOUND)
      // 返回: { code: 30001, msg: '用户不存在', data: null }
    }

    return user
  }

  /**
   * 示例2: 自定义错误消息
   */
  async example2(userId: string) {
    const user = await this.findUser(userId)

    if (!user) {
      // 方式2: 自定义消息
      throw new BusinessException(ErrorCode.USER_NOT_FOUND, `用户 ${userId} 不存在`)
      // 返回: { code: 30001, msg: '用户 123 不存在', data: null }
    }

    return user
  }

  /**
   * 示例3: 携带额外数据
   */
  async example3(username: string) {
    const existingUser = await this.findByUsername(username)

    if (existingUser) {
      // 方式3: 携带额外数据
      throw new BusinessException(ErrorCode.USERNAME_EXISTS, '用户名已存在', {
        username,
        suggestion: '请尝试其他用户名',
      })
      // 返回: {
      //   code: 30002,
      //   msg: '用户名已存在',
      //   data: { username: 'admin', suggestion: '请尝试其他用户名' }
      // }
    }

    return true
  }

  /**
   * 示例4: 使用静态工厂方法
   */
  async example4(userId: string) {
    const user = await this.findUser(userId)

    if (!user) {
      // 方式4: 使用静态工厂方法 (更简洁)
      throw BusinessException.notFound('用户不存在')
    }

    if (user.status === '1') {
      throw BusinessException.denied('用户已被停用')
    }

    return user
  }

  /**
   * 示例5: 权限相关异常
   */
  async example5(userId: string, resourceId: string) {
    const user = await this.findUser(userId)

    if (!user) {
      // 未登录
      throw BusinessException.unauthorized()
    }

    const hasPermission = await this.checkPermission(userId, resourceId)
    if (!hasPermission) {
      // 无权限
      throw BusinessException.forbidden('您没有权限访问该资源')
    }

    return true
  }

  /**
   * 示例6: 参数验证
   */
  async example6(data: any) {
    if (!data.username || data.username.length < 2) {
      throw BusinessException.invalidParams('用户名长度不能少于2个字符')
    }

    if (!data.password || data.password.length < 6) {
      throw BusinessException.invalidParams('密码长度不能少于6个字符')
    }

    return true
  }

  /**
   * 示例7: 业务规则验证
   */
  async example7(userId: string, deptId: string) {
    const dept = await this.findDept(deptId)

    if (!dept) {
      throw new BusinessException(ErrorCode.DEPT_NOT_FOUND)
    }

    // 检查部门是否有子部门
    const hasChildren = await this.deptHasChildren(deptId)
    if (hasChildren) {
      throw new BusinessException(ErrorCode.DEPT_HAS_CHILDREN, '该部门存在子部门,不能删除')
    }

    // 检查部门是否有用户
    const hasUsers = await this.deptHasUsers(deptId)
    if (hasUsers) {
      throw new BusinessException(ErrorCode.DEPT_HAS_USERS, '该部门已分配用户,不能删除')
    }

    return true
  }

  /**
   * 示例8: 在 Controller 中使用
   */
  // @Post()
  // async create(@Body() createDto: CreateUserDto) {
  //   // 检查用户名是否存在
  //   const existing = await this.userService.findByUsername(createDto.userName);
  //   if (existing) {
  //     throw new BusinessException(ErrorCode.USERNAME_EXISTS);
  //   }
  //
  //   // 检查手机号是否存在
  //   if (createDto.phonenumber) {
  //     const phoneExists = await this.userService.findByPhone(createDto.phonenumber);
  //     if (phoneExists) {
  //       throw new BusinessException(ErrorCode.PHONE_EXISTS);
  //     }
  //   }
  //
  //   return this.userService.create(createDto);
  // }

  /**
   * 示例9: 在 Service 中使用
   */
  async deleteUser(userId: string, currentUserId: string) {
    // 不能删除自己
    if (userId === currentUserId) {
      throw new BusinessException(ErrorCode.CANNOT_DELETE_SELF)
    }

    const user = await this.findUser(userId)
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND)
    }

    // 不能删除超级管理员
    if (user.userId === BigInt(1)) {
      throw new BusinessException(ErrorCode.CANNOT_DELETE_ADMIN)
    }

    // 检查用户是否有角色
    const hasRoles = await this.userHasRoles(userId)
    if (hasRoles) {
      throw new BusinessException(ErrorCode.USER_HAS_ROLES, '该用户已分配角色,请先解除角色关联')
    }

    // 执行删除
    await this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: { delFlag: '2' },
    })

    return true
  }

  /**
   * 示例10: 错误码分类使用
   * 注意: 以下代码仅展示各种异常的使用方式,实际使用时只会抛出一个异常
   */
  exampleByCategory(type: string) {
    // 通用错误
    if (type === 'invalidParams') throw BusinessException.invalidParams('参数错误')
    if (type === 'notFound') throw BusinessException.notFound('数据不存在')
    if (type === 'alreadyExists') throw BusinessException.alreadyExists('数据已存在')
    if (type === 'denied') throw BusinessException.denied('操作被拒绝')

    // 认证授权错误
    if (type === 'unauthorized') throw BusinessException.unauthorized('未登录')
    if (type === 'forbidden') throw BusinessException.forbidden('无权限')
    if (type === 'invalidCredentials') throw new BusinessException(ErrorCode.INVALID_CREDENTIALS)
    if (type === 'tokenExpired') throw new BusinessException(ErrorCode.TOKEN_EXPIRED)
    if (type === 'accountDisabled') throw new BusinessException(ErrorCode.ACCOUNT_DISABLED)

    // 用户管理错误
    if (type === 'userNotFound') throw new BusinessException(ErrorCode.USER_NOT_FOUND)
    if (type === 'usernameExists') throw new BusinessException(ErrorCode.USERNAME_EXISTS)
    if (type === 'phoneExists') throw new BusinessException(ErrorCode.PHONE_EXISTS)
    if (type === 'emailExists') throw new BusinessException(ErrorCode.EMAIL_EXISTS)

    // 角色管理错误
    if (type === 'roleNotFound') throw new BusinessException(ErrorCode.ROLE_NOT_FOUND)
    if (type === 'roleNameExists') throw new BusinessException(ErrorCode.ROLE_NAME_EXISTS)
    if (type === 'roleHasUsers') throw new BusinessException(ErrorCode.ROLE_HAS_USERS)

    // 部门管理错误
    if (type === 'deptNotFound') throw new BusinessException(ErrorCode.DEPT_NOT_FOUND)
    if (type === 'deptHasChildren') throw new BusinessException(ErrorCode.DEPT_HAS_CHILDREN)
    if (type === 'deptHasUsers') throw new BusinessException(ErrorCode.DEPT_HAS_USERS)

    // 菜单管理错误
    if (type === 'menuNotFound') throw new BusinessException(ErrorCode.MENU_NOT_FOUND)
    if (type === 'menuHasChildren') throw new BusinessException(ErrorCode.MENU_HAS_CHILDREN)
    if (type === 'menuHasRoles') throw new BusinessException(ErrorCode.MENU_HAS_ROLES)
  }

  // ==================== 辅助方法 (仅用于示例) ====================

  private async findUser(userId: string): Promise<any> {
    return null
  }

  private async findByUsername(username: string): Promise<any> {
    return null
  }

  private async findDept(deptId: string): Promise<any> {
    return null
  }

  private async checkPermission(userId: string, resourceId: string): Promise<boolean> {
    return false
  }

  private async deptHasChildren(deptId: string): Promise<boolean> {
    return false
  }

  private async deptHasUsers(deptId: string): Promise<boolean> {
    return false
  }

  private async userHasRoles(userId: string): Promise<boolean> {
    return false
  }

  private prisma: any
}

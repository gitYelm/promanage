import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoggerService } from '../../common/logger/logger.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { ConfigService } from '../config/config.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    @Inject(forwardRef(() => ConfigService))
    private configService: ConfigService,
  ) {}

  findByUsername(username: string) {
    this.logger.debug(`查询用户: ${username}`, 'UserService');
    return this.prisma.sysUser.findFirst({
      where: {
        userName: username,
        delFlag: '0', // 未删除
      },
      include: {
        dept: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async getUserInfo(userId: string) {
    this.logger.debug(`获取用户信息: ${userId}`, 'UserService');
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        dept: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    const roleKeys = user.roles.map((ur) => ur.role.roleKey);
    const roleList = user.roles.map((ur) => ({
      roleId: ur.role.roleId.toString(),
      roleName: ur.role.roleName,
      roleKey: ur.role.roleKey,
    }));
    const isAdmin = roleKeys.includes('admin');

    let permissions: string[] = [];

    if (isAdmin) {
      permissions = ['*:*:*'];
    } else {
      // 查询角色关联的菜单权限
      const roleIds = user.roles.map((ur) => ur.roleId);
      const menus = await this.prisma.sysMenu.findMany({
        where: {
          roles: {
            some: {
              roleId: { in: roleIds },
            },
          },
          status: '0',
          perms: { not: '' }, // 过滤掉没有权限标识的
        },
        select: { perms: true },
      });

      permissions = menus
        .map((m) => m.perms)
        .filter((p) => !!p) // 过滤 null/empty
        .map((p) => p as string); // 类型断言
    }

    // 移除密码等敏感信息
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userInfo } = user;

    return {
      user: userInfo,
      roles: roleKeys, // 保持兼容性,返回roleKey数组
      roleList, // 新增:返回完整的角色信息
      permissions,
    };
  }

  /**
   * 查询用户列表
   */
  async findAll(query: QueryUserDto) {
    const {
      userName,
      phonenumber,
      status,
      deptId,
      pageNum = 1,
      pageSize = 20,
    } = query;
    const skip = (pageNum - 1) * pageSize;

    const where: Prisma.SysUserWhereInput = {
      delFlag: '0',
    };

    if (userName) {
      where.userName = { contains: userName };
    }
    if (phonenumber) {
      where.phonenumber = { contains: phonenumber };
    }
    if (status) {
      where.status = status;
    }
    if (deptId) {
      // 部门查询通常包含子部门
      // 1. 查出该部门及其子部门ID
      // 这里的逻辑比较复杂，因为 ancestors 是字符串。
      // 简单起见，我们先只查当前部门，或者如果前端传的是 id，我们假设要查这个 id 下的所有
      // 更好的做法是先查出所有子部门 ID 列表
      /*
       const dept = await this.prisma.sysDept.findUnique({ where: { deptId } });
       if (dept) {
          const children = await this.prisma.sysDept.findMany({
             where: { ancestors: { contains: deptId } },
             select: { deptId: true }
          });
          const deptIds = [deptId, ...children.map(d => d.deptId)];
          where.deptId = { in: deptIds };
       }
       */
      // 暂时只精确匹配
      where.deptId = BigInt(deptId);
    }

    const [total, rows] = await Promise.all([
      this.prisma.sysUser.count({ where }),
      this.prisma.sysUser.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        include: {
          dept: true,
        },
        orderBy: { userId: 'asc' },
      }),
    ]);

    // 移除密码
    const safeRows = rows.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = user;
      return rest;
    });

    return { total, rows: safeRows };
  }

  /**
   * 查询用户详情 (用于编辑)
   */
  async findOne(userId: string) {
    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        dept: true, // 包含部门信息
        roles: {
          include: {
            role: true, // 包含完整的角色信息
          },
        },
        posts: {
          include: {
            post: true, // 包含完整的岗位信息
          },
        },
      },
    });

    if (!user) return null;

    const roleIds = user.roles.map((ur) => ur.roleId.toString());
    const postIds = user.posts.map((up) => up.postId.toString());
    const roleList = user.roles.map((ur) => ur.role);
    const postList = user.posts.map((up) => up.post);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, roles, posts, ...userInfo } = user;

    return {
      user: userInfo,
      roleIds,
      postIds,
      roles: roleList,
      posts: postList,
    };
  }

  /**
   * 新增用户
   */
  async create(createUserDto: CreateUserDto) {
    this.logger.log(`创建用户: ${createUserDto.userName}`, 'UserService');

    // 检查用户名唯一性
    const exist = await this.prisma.sysUser.findFirst({
      where: { userName: createUserDto.userName, delFlag: '0' },
    });
    if (exist) {
      this.logger.warn(
        `创建用户失败,用户名已存在: ${createUserDto.userName}`,
        'UserService',
      );
      throw new BadRequestException('用户账号已存在');
    }

    const { roleIds, postIds, password, deptId, ...userData } = createUserDto;

    // 密码加密（未提供密码时使用系统配置的初始密码）
    const salt = await bcrypt.genSalt();
    const initPassword =
      password || (await this.configService.getInitPassword());
    const hashedPassword = await bcrypt.hash(initPassword, salt);

    return this.prisma.$transaction(async (tx) => {
      // 1. 创建用户
      const user = await tx.sysUser.create({
        data: {
          ...userData,
          deptId: deptId ? BigInt(deptId) : null,
          password: hashedPassword,
          createTime: new Date(),
        },
      });

      // 2. 绑定角色
      if (roleIds && roleIds.length > 0) {
        await tx.sysUserRole.createMany({
          data: roleIds.map((roleId) => ({
            userId: user.userId,
            roleId: BigInt(roleId),
          })),
        });
      }

      // 3. 绑定岗位
      if (postIds && postIds.length > 0) {
        await tx.sysUserPost.createMany({
          data: postIds.map((postId) => ({
            userId: user.userId,
            postId: BigInt(postId),
          })),
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: p, ...result } = user;
      this.logger.log(
        `用户创建成功: ${createUserDto.userName} (ID: ${user.userId})`,
        'UserService',
      );
      return result;
    });
  }

  /**
   * 修改用户
   */
  async update(userId: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`更新用户: ${userId}`, 'UserService');

    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
    });
    if (!user) {
      this.logger.warn(`更新用户失败,用户不存在: ${userId}`, 'UserService');
      throw new BadRequestException('用户不存在');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { roleIds, postIds, password, deptId, ...userData } = updateUserDto;
    // 注意：这里通常不修改密码，密码修改有单独接口

    return this.prisma.$transaction(async (tx) => {
      // 1. 更新基本信息
      const updatedUser = await tx.sysUser.update({
        where: { userId: BigInt(userId) },
        data: {
          ...userData,
          ...(deptId !== undefined
            ? { deptId: deptId ? BigInt(deptId) : null }
            : {}),
          updateTime: new Date(),
        },
      });

      // 2. 更新角色
      if (roleIds !== undefined) {
        await tx.sysUserRole.deleteMany({ where: { userId: BigInt(userId) } });
        if (roleIds.length > 0) {
          await tx.sysUserRole.createMany({
            data: roleIds.map((roleId) => ({
              userId: BigInt(userId),
              roleId: BigInt(roleId),
            })),
          });
        }
      }

      // 3. 更新岗位
      if (postIds !== undefined) {
        await tx.sysUserPost.deleteMany({ where: { userId: BigInt(userId) } });
        if (postIds.length > 0) {
          await tx.sysUserPost.createMany({
            data: postIds.map((postId) => ({
              userId: BigInt(userId),
              postId: BigInt(postId),
            })),
          });
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: p, ...result } = updatedUser;
      this.logger.log(
        `用户更新成功: ${updatedUser.userName} (ID: ${userId})`,
        'UserService',
      );
      return result;
    });
  }

  /**
   * 删除用户
   */
  async remove(userId: string) {
    this.logger.log(`删除用户: ${userId}`, 'UserService');

    if (userId === '1') {
      // 假设1是超级管理员或者通过其他方式判断
      // throw new BadRequestException('不允许删除超级管理员');
    }

    // 逻辑删除
    const result = await this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: { delFlag: '2' },
    });

    this.logger.log(
      `用户删除成功: ${result.userName} (ID: ${userId})`,
      'UserService',
    );
    return result;
  }

  /**
   * 重置密码
   */
  async resetPassword(userId: string, password: string) {
    this.logger.warn(`重置用户密码: ${userId}`, 'UserService');

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: { password: hashedPassword },
    });

    this.logger.warn(
      `密码重置成功: ${result.userName} (ID: ${userId})`,
      'UserService',
    );
    return result;
  }

  /**
   * 修改状态
   */
  async changeStatus(userId: string, status: string) {
    this.logger.log(`修改用户状态: ${userId} -> ${status}`, 'UserService');

    const result = await this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: { status, updateTime: new Date() },
    });

    this.logger.log(
      `用户状态修改成功: ${result.userName} (ID: ${userId}, 状态: ${status})`,
      'UserService',
    );
    return result;
  }

  /**
   * 修改个人密码
   */
  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    this.logger.log(`修改个人密码: ${userId}`, 'UserService');

    const user = await this.prisma.sysUser.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 验证旧密码
    const isMatch = await bcrypt.compare(oldPassword, user.password || '');
    if (!isMatch) {
      throw new BadRequestException('当前密码错误');
    }

    // 加密新密码
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: { password: hashedPassword, updateTime: new Date() },
    });

    this.logger.log(
      `密码修改成功: ${user.userName} (ID: ${userId})`,
      'UserService',
    );
    return { msg: '密码修改成功' };
  }

  /**
   * 更新个人信息
   */
  async updateProfile(
    userId: string,
    data: {
      nickName?: string;
      email?: string;
      phonenumber?: string;
      sex?: string;
      avatar?: string;
    },
  ) {
    this.logger.log(`更新个人信息: ${userId}`, 'UserService');

    // 字段长度校验
    if (data.nickName && data.nickName.length > 30) {
      throw new BusinessException(
        ErrorCode.INVALID_PARAMS,
        '用户昵称不能超过30个字符',
      );
    }
    if (data.email && data.email.length > 50) {
      throw new BusinessException(
        ErrorCode.INVALID_PARAMS,
        '邮箱不能超过50个字符',
      );
    }
    if (data.phonenumber && data.phonenumber.length > 11) {
      throw new BusinessException(
        ErrorCode.INVALID_PARAMS,
        '手机号码不能超过11位',
      );
    }
    if (data.avatar && data.avatar.length > 100) {
      throw new BusinessException(ErrorCode.INVALID_PARAMS, '头像地址过长');
    }

    const result = await this.prisma.sysUser.update({
      where: { userId: BigInt(userId) },
      data: {
        ...(data.nickName !== undefined && { nickName: data.nickName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phonenumber !== undefined && {
          phonenumber: data.phonenumber,
        }),
        ...(data.sex !== undefined && { sex: data.sex }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        updateTime: new Date(),
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userInfo } = result;

    this.logger.log(
      `个人信息更新成功: ${result.userName} (ID: ${userId})`,
      'UserService',
    );
    return userInfo;
  }

  /**
   * 获取导出数据
   */
  async getExportData(query: QueryUserDto) {
    const { userName, phonenumber, status, deptId } = query;

    const where: Prisma.SysUserWhereInput = { delFlag: '0' };
    if (userName) where.userName = { contains: userName };
    if (phonenumber) where.phonenumber = { contains: phonenumber };
    if (status) where.status = status;
    if (deptId) where.deptId = BigInt(deptId);

    const users = await this.prisma.sysUser.findMany({
      where,
      include: { dept: true },
      orderBy: { userId: 'asc' },
    });

    return users.map((user) => ({
      userId: user.userId.toString(),
      userName: user.userName,
      nickName: user.nickName,
      deptName: user.dept?.deptName || '',
      phonenumber: user.phonenumber || '',
      email: user.email || '',
      sex: user.sex === '0' ? '男' : user.sex === '1' ? '女' : '未知',
      status: user.status === '0' ? '正常' : '停用',
      createTime: user.createTime
        ? new Date(user.createTime).toLocaleString('zh-CN')
        : '',
    }));
  }

  /**
   * 批量导入用户
   */
  async importUsers(
    users: Array<{
      userName: string;
      nickName: string;
      deptName?: string;
      phonenumber?: string;
      email?: string;
      sex?: string;
      status?: string;
    }>,
    updateSupport: boolean,
  ): Promise<{ success: number; fail: number; errors: string[] }> {
    this.logger.log(`批量导入用户: ${users.length} 条`, 'UserService');

    let success = 0;
    let fail = 0;
    const errors: string[] = [];

    // 获取部门映射
    const depts = await this.prisma.sysDept.findMany({
      where: { delFlag: '0' },
      select: { deptId: true, deptName: true },
    });
    const deptMap = new Map(depts.map((d) => [d.deptName, d.deptId]));

    // 获取初始密码
    const initPassword = await this.configService.getInitPassword();
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(initPassword, salt);

    for (let i = 0; i < users.length; i++) {
      const row = users[i];
      const rowNum = i + 2; // Excel 行号（从2开始，1是表头）

      try {
        // 校验必填字段
        if (!row.userName || !row.nickName) {
          errors.push(`第${rowNum}行: 用户名和昵称不能为空`);
          fail++;
          continue;
        }

        // 查找部门
        let deptId: bigint | null = null;
        if (row.deptName) {
          deptId = deptMap.get(row.deptName) || null;
          if (!deptId) {
            errors.push(`第${rowNum}行: 部门"${row.deptName}"不存在`);
            fail++;
            continue;
          }
        }

        // 检查用户是否存在
        const existUser = await this.prisma.sysUser.findFirst({
          where: { userName: row.userName, delFlag: '0' },
        });

        const userData = {
          nickName: row.nickName,
          deptId,
          phonenumber: row.phonenumber || null,
          email: row.email || null,
          sex: row.sex === '男' ? '0' : row.sex === '女' ? '1' : '2',
          status: row.status === '停用' ? '1' : '0',
        };

        if (existUser) {
          if (updateSupport) {
            await this.prisma.sysUser.update({
              where: { userId: existUser.userId },
              data: { ...userData, updateTime: new Date() },
            });
            success++;
          } else {
            errors.push(`第${rowNum}行: 用户"${row.userName}"已存在`);
            fail++;
          }
        } else {
          await this.prisma.sysUser.create({
            data: {
              userName: row.userName,
              ...userData,
              password: hashedPassword,
              createTime: new Date(),
            },
          });
          success++;
        }
      } catch (e) {
        errors.push(`第${rowNum}行: ${(e as Error).message}`);
        fail++;
      }
    }

    this.logger.log(`导入完成: 成功${success}条, 失败${fail}条`, 'UserService');
    return { success, fail, errors };
  }
}

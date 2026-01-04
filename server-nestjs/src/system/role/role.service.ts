import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/logger/logger.service';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';

@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * 查询角色列表
   */
  async findAll(query: QueryRoleDto) {
    const { roleName, roleKey, status, pageNum = 1, pageSize = 20 } = query;
    const skip = (pageNum - 1) * pageSize;

    const where: Prisma.SysRoleWhereInput = {
      delFlag: '0',
    };

    if (roleName) {
      where.roleName = { contains: roleName };
    }
    if (roleKey) {
      where.roleKey = { contains: roleKey };
    }
    if (status) {
      where.status = status;
    }

    const [total, rows] = await Promise.all([
      this.prisma.sysRole.count({ where }),
      this.prisma.sysRole.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: [{ roleSort: 'asc' }, { roleId: 'asc' }],
      }),
    ]);

    // 为每个角色添加用户数统计（只统计未删除的用户）
    const rowsWithUserCount = await Promise.all(
      rows.map(async (role) => {
        const userCount = await this.prisma.sysUserRole.count({
          where: {
            roleId: role.roleId,
            user: { delFlag: '0' }, // 只统计未删除的用户
          },
        });
        return { ...role, userCount };
      }),
    );

    return { total, rows: rowsWithUserCount };
  }

  /**
   * 查询角色详情
   */
  async findOne(roleId: string) {
    this.logger.log(`查询角色详情: ${roleId}`, 'RoleService');

    const role = await this.prisma.sysRole.findUnique({
      where: { roleId: BigInt(roleId), delFlag: '0' },
      include: {
        menus: true, // 关联查询 SysRoleMenu
      },
    });

    if (!role) {
      this.logger.warn(`角色不存在: ${roleId}`, 'RoleService');
      throw new BusinessException(ErrorCode.ROLE_NOT_FOUND);
    }

    // 提取 menuIds
    const menuIds = role.menus.map((rm) => rm.menuId);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { menus, ...roleInfo } = role;

    return { ...roleInfo, menuIds };
  }

  /**
   * 新增角色
   */
  async create(createRoleDto: CreateRoleDto) {
    this.logger.log(
      `创建角色: ${createRoleDto.roleName} (${createRoleDto.roleKey})`,
      'RoleService',
    );

    // 检查 roleKey 唯一性
    const exist = await this.prisma.sysRole.findFirst({
      where: { roleKey: createRoleDto.roleKey, delFlag: '0' },
    });
    if (exist) {
      this.logger.warn(
        `创建角色失败,权限字符已存在: ${createRoleDto.roleKey}`,
        'RoleService',
      );
      throw new BusinessException(ErrorCode.ROLE_KEY_EXISTS);
    }

    const { menuIds, ...roleData } = createRoleDto;

    // 使用事务
    return this.prisma.$transaction(async (tx) => {
      // 1. 创建角色
      const role = await tx.sysRole.create({
        data: {
          ...roleData,
          status: roleData.status || '0',
          createTime: new Date(),
        },
      });

      // 2. 绑定菜单
      if (menuIds && menuIds.length > 0) {
        await tx.sysRoleMenu.createMany({
          data: menuIds.map((menuId) => ({
            roleId: role.roleId,
            menuId: BigInt(menuId),
          })),
        });
      }

      this.logger.log(
        `角色创建成功: ${role.roleName} (ID: ${role.roleId})`,
        'RoleService',
      );
      return role;
    });
  }

  /**
   * 修改角色
   */
  async update(roleId: string, updateRoleDto: UpdateRoleDto) {
    this.logger.log(`更新角色: ${roleId}`, 'RoleService');

    const role = await this.prisma.sysRole.findUnique({
      where: { roleId: BigInt(roleId) },
    });
    if (!role) {
      this.logger.warn(`更新角色失败,角色不存在: ${roleId}`, 'RoleService');
      throw new BusinessException(ErrorCode.ROLE_NOT_FOUND);
    }

    // 检查 roleKey 唯一性 (如果修改了 roleKey)
    if (updateRoleDto.roleKey && updateRoleDto.roleKey !== role.roleKey) {
      const exist = await this.prisma.sysRole.findFirst({
        where: { roleKey: updateRoleDto.roleKey, delFlag: '0' },
      });
      if (exist) {
        throw new BusinessException(ErrorCode.ROLE_KEY_EXISTS);
      }
    }

    const { menuIds, ...roleData } = updateRoleDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. 更新角色信息
      const updatedRole = await tx.sysRole.update({
        where: { roleId: BigInt(roleId) },
        data: {
          ...roleData,
          updateTime: new Date(),
        },
      });

      // 2. 更新菜单权限 (如果传了 menuIds)
      if (menuIds) {
        // 先删除旧的
        await tx.sysRoleMenu.deleteMany({
          where: { roleId: BigInt(roleId) },
        });
        // 再插入新的
        if (menuIds.length > 0) {
          await tx.sysRoleMenu.createMany({
            data: menuIds.map((menuId) => ({
              roleId: BigInt(roleId),
              menuId: BigInt(menuId),
            })),
          });
        }
      }

      this.logger.log(
        `角色更新成功: ${updatedRole.roleName} (ID: ${roleId})`,
        'RoleService',
      );
      return updatedRole;
    });
  }

  /**
   * 删除角色
   */
  async remove(roleId: string) {
    this.logger.log(`删除角色: ${roleId}`, 'RoleService');

    // 1. 检查是否分配给用户（只检查未删除的用户）
    const userCount = await this.prisma.sysUserRole.count({
      where: {
        roleId: BigInt(roleId),
        user: { delFlag: '0' },
      },
    });
    if (userCount > 0) {
      this.logger.warn(
        `删除角色失败,角色已分配给 ${userCount} 个用户: ${roleId}`,
        'RoleService',
      );
      throw new BusinessException(ErrorCode.ROLE_HAS_USERS);
    }

    // 逻辑删除
    const result = await this.prisma.sysRole.update({
      where: { roleId: BigInt(roleId) },
      data: { delFlag: '2' },
    });

    this.logger.log(
      `角色删除成功: ${result.roleName} (ID: ${roleId})`,
      'RoleService',
    );
    return result;
  }

  /**
   * 修改状态
   */
  async changeStatus(roleId: string, status: string) {
    this.logger.log(`修改角色状态: ${roleId} -> ${status}`, 'RoleService');

    const result = await this.prisma.sysRole.update({
      where: { roleId: BigInt(roleId) },
      data: { status, updateTime: new Date() },
    });

    this.logger.log(
      `角色状态修改成功: ${result.roleName} (ID: ${roleId}, 状态: ${status})`,
      'RoleService',
    );
    return result;
  }
}

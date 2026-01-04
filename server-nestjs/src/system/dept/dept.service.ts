import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeptDto } from './dto/create-dept.dto';
import { UpdateDeptDto } from './dto/update-dept.dto';
import { QueryDeptDto } from './dto/query-dept.dto';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/logger/logger.service';
import { BusinessException } from '../../common/exceptions';
import { ErrorCode } from '../../common/enums';

@Injectable()
export class DeptService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * 查询部门列表
   */
  async findAll(query: QueryDeptDto) {
    const { deptName, status } = query;
    const where: Prisma.SysDeptWhereInput = {
      delFlag: '0',
    };

    if (deptName) {
      where.deptName = { contains: deptName };
    }
    if (status) {
      where.status = status;
    }

    const depts = await this.prisma.sysDept.findMany({
      where,
      orderBy: { orderNum: 'asc' },
    });

    return depts;
  }

  /**
   * 查询部门详情
   */
  async findOne(deptId: string) {
    return this.prisma.sysDept.findUnique({
      where: { deptId: BigInt(deptId) },
    });
  }

  /**
   * 新增部门
   */
  async create(createDeptDto: CreateDeptDto) {
    this.logger.log(`创建部门: ${createDeptDto.deptName}`, 'DeptService');

    // 如果 parentId 为空，说明是顶级部门 (实际上若依前端通常传 0 或 null)
    // 我们需要处理 ancestors 字段 (祖级列表)

    const { parentId, ...rest } = createDeptDto;
    let ancestors = '0';
    let parentIdBigInt: bigint | null = null;

    if (parentId && parentId !== '0') {
      const parentDept = await this.findOne(parentId);
      if (!parentDept) {
        throw new BusinessException(ErrorCode.PARENT_DEPT_NOT_FOUND);
      }
      if (parentDept.status === '1') {
        throw new BusinessException(
          ErrorCode.DEPT_STATUS_ERROR,
          '部门停用，不允许新增',
        );
      }
      parentIdBigInt = BigInt(parentId);
      ancestors = `${parentDept.ancestors || '0'},${parentId}`;
    }

    const result = await this.prisma.sysDept.create({
      data: {
        ...rest,
        parentId: parentIdBigInt,
        ancestors,
        createTime: new Date(),
      },
    });

    this.logger.log(
      `部门创建成功: ${result.deptName} (ID: ${result.deptId})`,
      'DeptService',
    );
    return result;
  }

  /**
   * 修改部门
   */
  async update(deptId: string, updateDeptDto: UpdateDeptDto) {
    const dept = await this.findOne(deptId);
    if (!dept) {
      throw new BusinessException(ErrorCode.DEPT_NOT_FOUND);
    }

    const { parentId, ...rest } = updateDeptDto;
    const deptIdBigInt = BigInt(deptId);

    if (parentId && parentId !== '0' && BigInt(parentId) !== dept.parentId) {
      // 如果修改了父级，需要更新 ancestors
      const parentDept = await this.findOne(parentId);
      if (!parentDept) {
        throw new BusinessException(ErrorCode.PARENT_DEPT_NOT_FOUND);
      }
      // 检查是否将自己设为父级
      if (parentId === deptId) {
        throw new BusinessException(ErrorCode.CANNOT_SET_SELF_AS_CHILD);
      }
      // 还需要更新所有子部门的 ancestors (这是一个级联操作，略复杂，这里先简单更新自己)
      // 严格来说，若依逻辑是禁止修改父级为自己的子节点

      // 更新 ancestors
      const newAncestors = `${parentDept.ancestors || '0'},${parentId}`;

      // 更新自己和所有子部门的 ancestors
      await this.updateChildrenAncestors(
        deptId,
        newAncestors,
        dept.ancestors || '0',
      );

      return this.prisma.sysDept.update({
        where: { deptId: deptIdBigInt },
        data: {
          ...rest,
          parentId: BigInt(parentId),
          ancestors: newAncestors,
          updateTime: new Date(),
        },
      });
    }

    return this.prisma.sysDept.update({
      where: { deptId: deptIdBigInt },
      data: {
        ...rest,
        ...(parentId !== undefined
          ? { parentId: parentId ? BigInt(parentId) : null }
          : {}),
        updateTime: new Date(),
      },
    });
  }

  /**
   * 删除部门
   */
  async remove(deptId: string) {
    const deptIdBigInt = BigInt(deptId);
    // 1. 检查是否有子部门
    const childCount = await this.prisma.sysDept.count({
      where: { parentId: deptIdBigInt, delFlag: '0' },
    });
    if (childCount > 0) {
      throw new BusinessException(ErrorCode.DEPT_HAS_CHILDREN);
    }

    // 2. 检查是否有用户关联
    const userCount = await this.prisma.sysUser.count({
      where: { deptId: deptIdBigInt, delFlag: '0' },
    });
    if (userCount > 0) {
      throw new BusinessException(ErrorCode.DEPT_HAS_USERS);
    }

    // 逻辑删除
    return this.prisma.sysDept.update({
      where: { deptId: deptIdBigInt },
      data: { delFlag: '2' }, // 2 代表删除
    });
  }

  /**
   * 查询部门列表（排除节点）
   */
  async listExcludeChild(deptId: string) {
    const depts = await this.findAll({});
    const deptIdBigInt = BigInt(deptId);
    // 过滤掉自己和子节点
    // 若依逻辑：如果是自己或者自己的 ancestors 中包含自己，则排除
    // 但是 ancestors 是字符串，判断起来有点麻烦。
    // 简单判断：排除 id 等于 deptId 的，以及 parentId 递归等于 deptId 的。

    // 这里先简单返回所有，前端通常也会处理
    return depts.filter(
      (d) =>
        d.deptId !== deptIdBigInt && !d.ancestors?.split(',').includes(deptId),
    );
  }

  /**
   * 更新子部门的 ancestors
   * @param deptId 当前部门ID
   * @param newAncestors 新的祖级列表
   * @param oldAncestors 旧的祖级列表
   */
  private async updateChildrenAncestors(
    deptId: string,
    newAncestors: string,
    oldAncestors: string,
  ) {
    try {
      // 查找所有子部门（ancestors 包含当前部门ID的）
      const children = await this.prisma.sysDept.findMany({
        where: {
          delFlag: '0',
          ancestors: {
            contains: deptId,
          },
        },
      });

      // 批量更新子部门的 ancestors
      const updatePromises = children.map((child) => {
        // 替换 ancestors 中的旧路径为新路径
        // 例如: oldAncestors = "0,100", newAncestors = "0,200,100"
        // child.ancestors = "0,100,101" => "0,200,100,101"
        const childAncestors = child.ancestors || '';
        const updatedAncestors = childAncestors.replace(
          `${oldAncestors},${deptId}`,
          `${newAncestors},${deptId}`,
        );

        return this.prisma.sysDept.update({
          where: { deptId: child.deptId },
          data: {
            ancestors: updatedAncestors,
            updateTime: new Date(),
          },
        });
      });

      await Promise.all(updatePromises);
      this.logger.log(
        `Updated ancestors for ${children.length} child departments`,
        'DeptService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to update children ancestors: ${error}`,
        'DeptService',
      );
      throw error;
    }
  }

  /**
   * 修改部门状态
   */
  async changeStatus(deptId: string, status: string) {
    this.logger.log(`切换部门状态: ${deptId} -> ${status}`, 'DeptService');

    const dept = await this.findOne(deptId);
    if (!dept) {
      throw new BusinessException(ErrorCode.DEPT_NOT_FOUND);
    }

    await this.prisma.sysDept.update({
      where: { deptId: BigInt(deptId) },
      data: { status, updateTime: new Date() },
    });

    return {};
  }
}

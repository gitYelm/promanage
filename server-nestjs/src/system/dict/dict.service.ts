import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { QueryDictTypeDto } from './dto/query-dict-type.dto'
import { CreateDictTypeDto } from './dto/create-dict-type.dto'
import { UpdateDictTypeDto } from './dto/update-dict-type.dto'
import { Prisma } from '@prisma/client'
import { LoggerService } from '../../common/logger/logger.service'
import { resolveSortDirection } from '../../common/utils/sort-order.util'

@Injectable()
export class DictService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async listTypes(query: QueryDictTypeDto) {
    const { dictName, dictType, status } = query
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const where: Prisma.SysDictTypeWhereInput = {}
    if (dictName) where.dictName = { contains: dictName }
    if (dictType) where.dictType = { contains: dictType }
    if (status) where.status = status

    const [total, rows] = await Promise.all([
      this.prisma.sysDictType.count({ where }),
      this.prisma.sysDictType.findMany({
        where,
        skip: Number((pageNum - 1) * pageSize),
        take: Number(pageSize),
        orderBy: this.buildOrderBy(query),
      }),
    ])

    return { total, rows }
  }

  private buildOrderBy(query: QueryDictTypeDto): Prisma.SysDictTypeOrderByWithRelationInput[] {
    const direction = resolveSortDirection(query.sortOrder)
    const sortMap: Record<string, Prisma.SysDictTypeOrderByWithRelationInput> = {
      dictId: { dictId: direction },
      dictName: { dictName: direction },
      dictType: { dictType: direction },
      status: { status: direction },
      createTime: { createTime: direction },
    }
    if (direction && query.sortBy && sortMap[query.sortBy])
      return [sortMap[query.sortBy], { dictId: 'asc' }]
    return [{ dictId: 'asc' }]
  }

  async getType(dictId: string) {
    return this.prisma.sysDictType.findUnique({
      where: { dictId: BigInt(dictId) },
    })
  }

  async createType(dto: CreateDictTypeDto) {
    this.logger.log(`创建字典类型: ${dto.dictName} (${dto.dictType})`, 'DictService')

    // 唯一约束：dictType 不重复
    const exist = await this.prisma.sysDictType.findFirst({
      where: { dictType: dto.dictType },
    })
    if (exist) {
      this.logger.warn(`创建字典失败,类型已存在: ${dto.dictType}`, 'DictService')
      throw new BadRequestException('字典类型已存在')
    }

    const result = await this.prisma.sysDictType.create({
      data: { ...dto, status: dto.status ?? '0', createTime: new Date() },
    })

    this.logger.log(`字典类型创建成功: ${result.dictName} (ID: ${result.dictId})`, 'DictService')
    return result
  }

  async updateType(dictId: string, dto: UpdateDictTypeDto) {
    this.logger.log(`更新字典类型: ${dictId}`, 'DictService')

    const type = await this.getType(dictId)
    if (!type) {
      this.logger.warn(`更新字典失败,类型不存在: ${dictId}`, 'DictService')
      throw new BadRequestException('字典类型不存在')
    }

    const result = await this.prisma.sysDictType.update({
      where: { dictId: BigInt(dictId) },
      data: { ...dto, updateTime: new Date() },
    })

    this.logger.log(`字典类型更新成功: ${result.dictName} (ID: ${dictId})`, 'DictService')
    return result
  }

  async removeTypes(dictIds: string[]) {
    this.logger.log(`删除字典类型: ${dictIds.length} 个`, 'DictService')

    if (!dictIds || dictIds.length === 0) {
      this.logger.warn('删除字典失败,参数为空', 'DictService')
      throw new BadRequestException('参数为空')
    }

    await this.prisma.sysDictType.deleteMany({
      where: { dictId: { in: dictIds.map((id) => BigInt(id)) } },
    })

    this.logger.log(`字典类型删除成功: ${dictIds.length} 个`, 'DictService')
    return {}
  }

  async changeTypeStatus(dictId: string, status: string) {
    this.logger.log(`切换字典类型状态: ${dictId} -> ${status}`, 'DictService')

    const type = await this.getType(dictId)
    if (!type) {
      throw new BadRequestException('字典类型不存在')
    }

    await this.prisma.sysDictType.update({
      where: { dictId: BigInt(dictId) },
      data: { status, updateTime: new Date() },
    })

    return {}
  }
}

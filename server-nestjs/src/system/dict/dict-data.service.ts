import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { QueryDictDataDto } from './dto/query-dict-data.dto'
import { CreateDictDataDto } from './dto/create-dict-data.dto'
import { UpdateDictDataDto } from './dto/update-dict-data.dto'
import { LoggerService } from '../../common/logger/logger.service'
import { resolveSortDirection } from '../../common/utils/sort-order.util'

@Injectable()
export class DictDataService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async list(query: QueryDictDataDto) {
    const where: Prisma.SysDictDataWhereInput = {}
    if (query.dictType) where.dictType = { contains: query.dictType }
    if (query.dictLabel) where.dictLabel = { contains: query.dictLabel }
    if (query.status) where.status = query.status
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.sysDictData.count({ where }),
      this.prisma.sysDictData.findMany({
        where,
        skip: Number((pageNum - 1) * pageSize),
        take: Number(pageSize),
        orderBy: this.buildOrderBy(query),
      }),
    ])
    return { total, rows }
  }

  private buildOrderBy(query: QueryDictDataDto): Prisma.SysDictDataOrderByWithRelationInput[] {
    const direction = resolveSortDirection(query.sortOrder)
    const sortMap: Record<string, Prisma.SysDictDataOrderByWithRelationInput> = {
      dictLabel: { dictLabel: direction },
      dictValue: { dictValue: direction },
      dictSort: { dictSort: direction },
      status: { status: direction },
      createTime: { createTime: direction },
    }
    if (direction && query.sortBy && sortMap[query.sortBy]) return [sortMap[query.sortBy], { dictCode: 'asc' }]
    return [{ dictSort: 'asc' }, { dictCode: 'asc' }]
  }

  async get(dictCode: string) {
    return this.prisma.sysDictData.findUnique({
      where: { dictCode: BigInt(dictCode) },
    })
  }

  async create(dto: CreateDictDataDto) {
    this.logger.debug(`创建字典数据: ${dto.dictLabel} (${dto.dictType})`, 'DictDataService')

    // 可选唯一性校验：同 dictType + dictValue 唯一
    const exist = await this.prisma.sysDictData.findFirst({
      where: { dictType: dto.dictType, dictValue: dto.dictValue },
    })
    if (exist) {
      this.logger.warn(
        `创建字典数据失败,字典值已存在: ${dto.dictType}/${dto.dictValue}`,
        'DictDataService',
      )
      throw new BadRequestException('字典值已存在')
    }

    const result = await this.prisma.sysDictData.create({
      data: {
        ...dto,
        isDefault: dto.isDefault ?? 'N',
      },
    })

    this.logger.debug(`字典数据创建成功: ${result.dictLabel}`, 'DictDataService')
    return result
  }

  async update(dictCode: string, dto: UpdateDictDataDto) {
    this.logger.debug(`更新字典数据: ${dictCode}`, 'DictDataService')

    const data = await this.get(dictCode)
    if (!data) {
      this.logger.warn(`更新字典数据失败,数据不存在: ${dictCode}`, 'DictDataService')
      throw new BadRequestException('字典数据不存在')
    }

    const result = await this.prisma.sysDictData.update({
      where: { dictCode: BigInt(dictCode) },
      data: { ...dto },
    })

    this.logger.debug(`字典数据更新成功: ${result.dictLabel}`, 'DictDataService')
    return result
  }

  async remove(dictCodes: string[]) {
    this.logger.debug(`删除字典数据: ${dictCodes.length} 个`, 'DictDataService')

    await this.prisma.sysDictData.deleteMany({
      where: { dictCode: { in: dictCodes.map((id) => BigInt(id)) } },
    })

    this.logger.debug(`字典数据删除成功: ${dictCodes.length} 个`, 'DictDataService')
    return {}
  }

  async changeStatus(dictCode: string, status: string) {
    this.logger.debug(`切换字典数据状态: ${dictCode} -> ${status}`, 'DictDataService')

    const data = await this.get(dictCode)
    if (!data) {
      throw new BadRequestException('字典数据不存在')
    }

    await this.prisma.sysDictData.update({
      where: { dictCode: BigInt(dictCode) },
      data: { status },
    })

    return {}
  }
}

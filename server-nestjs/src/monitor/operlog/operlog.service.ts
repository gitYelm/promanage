import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { QueryOperLogDto } from './dto/query-operlog.dto'
import { BusinessException } from '../../common/exceptions/business.exception'
import { resolveSortDirection } from '../../common/utils/sort-order.util'

@Injectable()
export class OperlogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryOperLogDto) {
    const where: Prisma.SysOperLogWhereInput = {}
    if (query.title) where.title = { contains: query.title }
    if (query.operName) where.operName = { contains: query.operName }
    if (query.status) where.status = Number(query.status)
    if (query.businessType) where.businessType = Number(query.businessType)
    if (query.beginTime || query.endTime) {
      const beginTime = query.beginTime
        ? this.parseDate(query.beginTime, '操作开始时间')
        : undefined
      const endTime = query.endTime ? this.parseDate(query.endTime, '操作结束时间') : undefined
      where.operTime = {
        ...(beginTime ? { gte: beginTime } : {}),
        ...(endTime ? { lte: endTime } : {}),
      }
    }

    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)

    const [total, rows] = await Promise.all([
      this.prisma.sysOperLog.count({ where }),
      this.prisma.sysOperLog.findMany({
        where,
        skip: Number((pageNum - 1) * pageSize),
        take: Number(pageSize),
        orderBy: this.buildOrderBy(query),
      }),
    ])
    return { total, rows }
  }

  private buildOrderBy(query: QueryOperLogDto): Prisma.SysOperLogOrderByWithRelationInput[] {
    const direction = resolveSortDirection(query.sortOrder)
    const sortMap: Record<string, Prisma.SysOperLogOrderByWithRelationInput> = {
      operId: { operId: direction },
      title: { title: direction },
      businessType: { businessType: direction },
      operName: { operName: direction },
      operIp: { operIp: direction },
      operLocation: { operLocation: direction },
      status: { status: direction },
      operTime: { operTime: direction },
    }
    if (direction && query.sortBy && sortMap[query.sortBy])
      return [sortMap[query.sortBy], { operTime: 'desc' }]
    return [{ operTime: 'desc' }]
  }

  async remove(operIds: string[]) {
    await this.prisma.sysOperLog.deleteMany({
      where: { operId: { in: operIds.map((id) => BigInt(id)) } },
    })
    return {}
  }

  async clean() {
    await this.prisma.sysOperLog.deleteMany({})
    return {}
  }

  private parseDate(value: string, label: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) throw BusinessException.invalidParams(`${label}格式不正确`)
    return date
  }
}

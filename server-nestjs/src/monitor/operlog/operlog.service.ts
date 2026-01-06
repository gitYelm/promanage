import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { QueryOperLogDto } from './dto/query-operlog.dto'

@Injectable()
export class OperlogService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryOperLogDto) {
    const where: Prisma.SysOperLogWhereInput = {}
    if (query.title) where.title = { contains: query.title }
    if (query.operName) where.operName = { contains: query.operName }
    if (query.status) where.status = Number(query.status)
    if (query.businessType) where.businessType = Number(query.businessType)

    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)

    const [total, rows] = await Promise.all([
      this.prisma.sysOperLog.count({ where }),
      this.prisma.sysOperLog.findMany({
        where,
        skip: Number((pageNum - 1) * pageSize),
        take: Number(pageSize),
        orderBy: { operId: 'asc' },
      }),
    ])
    return { total, rows }
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
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { QueryLogininforDto } from './dto/query-logininfor.dto'
import { Prisma } from '@prisma/client'
import { resolveSortDirection } from '../../common/utils/sort-order.util'

@Injectable()
export class LogininforService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryLogininforDto) {
    const where: Prisma.SysLoginLogWhereInput = {}
    if (query.userName) where.userName = { contains: query.userName }
    if (query.status) where.status = query.status
    if (query.ipaddr) where.ipaddr = { contains: query.ipaddr }

    // 时间范围筛选
    if (query.beginTime || query.endTime) {
      where.loginTime = {}
      if (query.beginTime) {
        where.loginTime.gte = new Date(query.beginTime)
      }
      if (query.endTime) {
        // 结束时间设置为当天的 23:59:59
        const endDate = new Date(query.endTime)
        endDate.setHours(23, 59, 59, 999)
        where.loginTime.lte = endDate
      }
    }

    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)

    const [total, rows] = await Promise.all([
      this.prisma.sysLoginLog.count({ where }),
      this.prisma.sysLoginLog.findMany({
        where,
        skip: Number((pageNum - 1) * pageSize),
        take: Number(pageSize),
        orderBy: this.buildOrderBy(query),
      }),
    ])

    // 转换 BigInt 为字符串
    const safeRows = rows.map((row) => ({
      ...row,
      infoId: row.infoId.toString(),
    }))

    return { total, rows: safeRows }
  }

  private buildOrderBy(query: QueryLogininforDto): Prisma.SysLoginLogOrderByWithRelationInput[] {
    const direction = resolveSortDirection(query.sortOrder)
    const sortMap: Record<string, Prisma.SysLoginLogOrderByWithRelationInput> = {
      infoId: { infoId: direction },
      userName: { userName: direction },
      ipaddr: { ipaddr: direction },
      loginLocation: { loginLocation: direction },
      browser: { browser: direction },
      os: { os: direction },
      status: { status: direction },
      msg: { msg: direction },
      loginTime: { loginTime: direction },
    }
    if (direction && query.sortBy && sortMap[query.sortBy])
      return [sortMap[query.sortBy], { loginTime: 'desc' }]
    return [{ loginTime: 'desc' }]
  }

  async create(data: {
    userName: string
    ipaddr: string
    loginLocation?: string
    browser?: string
    os?: string
    status: string
    msg?: string
  }) {
    await this.prisma.sysLoginLog.create({
      data,
    })
  }

  async remove(infoIds: string[]) {
    await this.prisma.sysLoginLog.deleteMany({
      where: { infoId: { in: infoIds.map((id) => BigInt(id)) } },
    })
    return {}
  }

  async clean() {
    await this.prisma.sysLoginLog.deleteMany({})
    return {}
  }
}

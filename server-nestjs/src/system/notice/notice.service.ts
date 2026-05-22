import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { QueryNoticeDto } from './dto/query-notice.dto'
import { CreateNoticeDto } from './dto/create-notice.dto'
import { UpdateNoticeDto } from './dto/update-notice.dto'
import { LoggerService } from '../../common/logger/logger.service'
import { sanitizeHtmlContent } from '../../common/utils/sanitize-html.util'
import { resolveSortDirection } from '../../common/utils/sort-order.util'

@Injectable()
export class NoticeService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async findAll(query: QueryNoticeDto) {
    const where: Prisma.SysNoticeWhereInput = {}
    if (query.noticeTitle) where.noticeTitle = { contains: query.noticeTitle }
    if (query.noticeType) where.noticeType = query.noticeType
    if (query.createBy) where.createBy = { contains: query.createBy }
    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.sysNotice.count({ where }),
      this.prisma.sysNotice.findMany({
        where,
        skip: Number((pageNum - 1) * pageSize),
        take: Number(pageSize),
        orderBy: this.buildOrderBy(query),
      }),
    ])
    return { total, rows }
  }

  private buildOrderBy(query: QueryNoticeDto): Prisma.SysNoticeOrderByWithRelationInput[] {
    const direction = resolveSortDirection(query.sortOrder)
    const sortMap: Record<string, Prisma.SysNoticeOrderByWithRelationInput> = {
      noticeId: { noticeId: direction },
      noticeTitle: { noticeTitle: direction },
      noticeType: { noticeType: direction },
      status: { status: direction },
      createBy: { createBy: direction },
      createTime: { createTime: direction },
    }
    if (direction && query.sortBy && sortMap[query.sortBy])
      return [sortMap[query.sortBy], { noticeId: 'asc' }]
    return [{ noticeId: 'asc' }]
  }

  async findOne(noticeId: string) {
    return this.prisma.sysNotice.findUnique({
      where: { noticeId: BigInt(noticeId) },
    })
  }

  async create(dto: CreateNoticeDto) {
    this.logger.log(`发布通知公告: ${dto.noticeTitle}`, 'NoticeService')

    // 清洗 HTML 内容，防止 XSS 攻击
    const sanitizedContent = sanitizeHtmlContent(dto.noticeContent)

    const result = await this.prisma.sysNotice.create({
      data: { ...dto, noticeContent: sanitizedContent, createTime: new Date() },
    })

    this.logger.log(
      `通知公告发布成功: ${result.noticeTitle} (ID: ${result.noticeId})`,
      'NoticeService',
    )
    return result
  }

  async update(noticeId: string, dto: UpdateNoticeDto) {
    this.logger.log(`更新通知公告: ${noticeId}`, 'NoticeService')

    const notice = await this.findOne(noticeId)
    if (!notice) {
      this.logger.warn(`更新公告失败,公告不存在: ${noticeId}`, 'NoticeService')
      throw new BadRequestException('公告不存在')
    }

    // 清洗 HTML 内容，防止 XSS 攻击
    const updateData = { ...dto, updateTime: new Date() }
    if (dto.noticeContent) {
      updateData.noticeContent = sanitizeHtmlContent(dto.noticeContent)
    }

    const result = await this.prisma.sysNotice.update({
      where: { noticeId: BigInt(noticeId) },
      data: updateData,
    })

    this.logger.log(`通知公告更新成功: ${result.noticeTitle} (ID: ${noticeId})`, 'NoticeService')
    return result
  }

  async remove(noticeIds: string[]) {
    this.logger.log(`删除通知公告: ${noticeIds.length} 个`, 'NoticeService')

    await this.prisma.sysNotice.deleteMany({
      where: { noticeId: { in: noticeIds.map((id) => BigInt(id)) } },
    })

    this.logger.log(`通知公告删除成功: ${noticeIds.length} 个`, 'NoticeService')
    return {}
  }

  async changeStatus(noticeId: string, status: string) {
    this.logger.log(`切换公告状态: ${noticeId} -> ${status}`, 'NoticeService')

    const notice = await this.findOne(noticeId)
    if (!notice) {
      throw new BadRequestException('公告不存在')
    }

    await this.prisma.sysNotice.update({
      where: { noticeId: BigInt(noticeId) },
      data: { status, updateTime: new Date() },
    })

    return {}
  }
}

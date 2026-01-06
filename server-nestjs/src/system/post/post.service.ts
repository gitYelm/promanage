import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { QueryPostDto } from './dto/query-post.dto'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { Prisma } from '@prisma/client'
import { LoggerService } from '../../common/logger/logger.service'

@Injectable()
export class PostService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async findAll(query: QueryPostDto) {
    const where: Prisma.SysPostWhereInput = {}
    if (query.postCode) where.postCode = { contains: query.postCode }
    if (query.postName) where.postName = { contains: query.postName }
    if (query.status) where.status = query.status

    const pageNum = Number(query.pageNum ?? 1)
    const pageSize = Number(query.pageSize ?? 20)
    const [total, rows] = await Promise.all([
      this.prisma.sysPost.count({ where }),
      this.prisma.sysPost.findMany({
        where,
        skip: Number((pageNum - 1) * pageSize),
        take: Number(pageSize),
        orderBy: [{ postSort: 'asc' }, { postId: 'asc' }],
      }),
    ])
    return { total, rows }
  }

  async findOne(postId: string) {
    return this.prisma.sysPost.findUnique({
      where: { postId: BigInt(postId) },
    })
  }

  async create(dto: CreatePostDto) {
    this.logger.log(`创建岗位: ${dto.postName} (${dto.postCode})`, 'PostService')

    const exist = await this.prisma.sysPost.findFirst({
      where: { postCode: dto.postCode },
    })
    if (exist) {
      this.logger.warn(`创建岗位失败,编码已存在: ${dto.postCode}`, 'PostService')
      throw new BadRequestException('岗位编码已存在')
    }

    const result = await this.prisma.sysPost.create({
      data: { ...dto, createTime: new Date() },
    })

    this.logger.log(`岗位创建成功: ${result.postName} (ID: ${result.postId})`, 'PostService')
    return result
  }

  async update(postId: string, dto: UpdatePostDto) {
    this.logger.log(`更新岗位: ${postId}`, 'PostService')

    const post = await this.findOne(postId)
    if (!post) {
      this.logger.warn(`更新岗位失败,岗位不存在: ${postId}`, 'PostService')
      throw new BadRequestException('岗位不存在')
    }

    const result = await this.prisma.sysPost.update({
      where: { postId: BigInt(postId) },
      data: { ...dto, updateTime: new Date() },
    })

    this.logger.log(`岗位更新成功: ${result.postName} (ID: ${postId})`, 'PostService')
    return result
  }

  async remove(postIds: string[]) {
    this.logger.log(`删除岗位: ${postIds.length} 个`, 'PostService')

    if (!postIds || postIds.length === 0) {
      this.logger.warn('删除岗位失败,参数为空', 'PostService')
      throw new BadRequestException('参数为空')
    }

    // 检查岗位是否被用户关联
    const usedCount = await this.prisma.sysUserPost.count({
      where: { postId: { in: postIds.map((id) => BigInt(id)) } },
    })
    if (usedCount > 0) {
      this.logger.warn(`删除岗位失败,岗位已分配给用户`, 'PostService')
      throw new BadRequestException('岗位已分配给用户，无法删除')
    }

    await this.prisma.sysPost.deleteMany({
      where: { postId: { in: postIds.map((id) => BigInt(id)) } },
    })

    this.logger.log(`岗位删除成功: ${postIds.length} 个`, 'PostService')
    return {}
  }

  async changeStatus(postId: string, status: string) {
    this.logger.log(`切换岗位状态: ${postId} -> ${status}`, 'PostService')

    const post = await this.findOne(postId)
    if (!post) {
      throw new BadRequestException('岗位不存在')
    }

    await this.prisma.sysPost.update({
      where: { postId: BigInt(postId) },
      data: { status, updateTime: new Date() },
    })

    return {}
  }
}

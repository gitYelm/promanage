import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ProjectActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    projectId: bigint
    targetType: string
    targetId: bigint
    action: string
    operatorId: bigint
    fromValue?: string
    toValue?: string
    remark?: string
  }) {
    return this.prisma.projectActivity.create({
      data: {
        projectId: input.projectId,
        targetType: input.targetType,
        targetId: input.targetId,
        action: input.action,
        operatorId: input.operatorId,
        fromValue: input.fromValue,
        toValue: input.toValue,
        remark: input.remark,
      },
    })
  }

  async list(projectId: string, take = 20) {
    return this.prisma.projectActivity.findMany({
      where: { projectId: BigInt(projectId) },
      include: { operator: true },
      orderBy: { activityId: 'desc' },
      take,
    })
  }
}

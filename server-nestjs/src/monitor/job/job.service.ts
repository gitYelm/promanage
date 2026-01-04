import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryJobDto } from './dto/query-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobExecutorService } from './job-executor.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private jobExecutor: JobExecutorService,
  ) {}

  async findAll(query: QueryJobDto) {
    const where: Prisma.SysJobWhereInput = {};
    if (query.jobName) where.jobName = { contains: query.jobName };
    if (query.jobGroup) where.jobGroup = { contains: query.jobGroup };
    if (query.status) where.status = query.status;
    const pageNum = Number(query.pageNum ?? 1);
    const pageSize = Number(query.pageSize ?? 20);

    const [total, rows] = await Promise.all([
      this.prisma.sysJob.count({ where }),
      this.prisma.sysJob.findMany({
        where,
        skip: Number((pageNum - 1) * pageSize),
        take: Number(pageSize),
        orderBy: { jobId: 'asc' },
      }),
    ]);

    // 转换 BigInt 为字符串
    const safeRows = rows.map((row) => ({
      ...row,
      jobId: row.jobId.toString(),
    }));

    return { total, rows: safeRows };
  }

  async findOne(jobId: string) {
    const job = await this.prisma.sysJob.findUnique({
      where: { jobId: BigInt(jobId) },
    });
    if (job) {
      return { ...job, jobId: job.jobId.toString() };
    }
    return null;
  }

  async create(dto: CreateJobDto) {
    const job = await this.prisma.sysJob.create({
      data: { ...dto, createTime: new Date() },
    });

    // 添加到调度器
    await this.jobExecutor.addJob({
      jobId: job.jobId.toString(),
      jobName: job.jobName ?? '',
      jobGroup: job.jobGroup ?? 'DEFAULT',
      invokeTarget: job.invokeTarget,
      cronExpression: job.cronExpression ?? '',
      status: job.status ?? '1',
      concurrent: job.concurrent ?? '1',
    });

    return { ...job, jobId: job.jobId.toString() };
  }

  async update(jobId: string, dto: UpdateJobDto) {
    const job = await this.prisma.sysJob.findUnique({
      where: { jobId: BigInt(jobId) },
    });
    if (!job) throw new BadRequestException('任务不存在');

    const updated = await this.prisma.sysJob.update({
      where: { jobId: BigInt(jobId) },
      data: { ...dto, updateTime: new Date() },
    });

    // 更新调度器中的任务
    await this.jobExecutor.addJob({
      jobId: updated.jobId.toString(),
      jobName: updated.jobName ?? '',
      jobGroup: updated.jobGroup ?? 'DEFAULT',
      invokeTarget: updated.invokeTarget,
      cronExpression: updated.cronExpression ?? '',
      status: updated.status ?? '1',
      concurrent: updated.concurrent ?? '1',
    });

    return { ...updated, jobId: updated.jobId.toString() };
  }

  async remove(jobIds: string[]) {
    // 从调度器中移除任务
    for (const jobId of jobIds) {
      this.jobExecutor.removeJob(jobId);
    }

    await this.prisma.sysJob.deleteMany({
      where: { jobId: { in: jobIds.map((id) => BigInt(id)) } },
    });
    return { msg: '删除成功' };
  }

  /**
   * 立即执行一次任务
   */
  async run(jobId: string) {
    await this.jobExecutor.runJobOnce(jobId);
    return { msg: '执行成功' };
  }

  /**
   * 修改任务状态
   */
  async changeStatus(jobId: string, status: string) {
    const job = await this.prisma.sysJob.update({
      where: { jobId: BigInt(jobId) },
      data: { status, updateTime: new Date() },
    });

    // 根据状态启动或停止任务
    if (status === '0') {
      // 启用任务
      await this.jobExecutor.addJob({
        jobId: job.jobId.toString(),
        jobName: job.jobName ?? '',
        jobGroup: job.jobGroup ?? 'DEFAULT',
        invokeTarget: job.invokeTarget,
        cronExpression: job.cronExpression ?? '',
        status: job.status ?? '1',
        concurrent: job.concurrent ?? '1',
      });
    } else {
      // 停止任务
      this.jobExecutor.stopJob(jobId);
    }

    return { ...job, jobId: job.jobId.toString() };
  }

  /**
   * 查询任务执行日志
   */
  async findJobLogs(query: {
    jobName?: string;
    jobGroup?: string;
    status?: string;
    pageNum?: number;
    pageSize?: number;
  }) {
    const where: Prisma.SysJobLogWhereInput = {};
    if (query.jobName) where.jobName = { contains: query.jobName };
    if (query.jobGroup) where.jobGroup = query.jobGroup;
    if (query.status) where.status = query.status;

    const pageNum = Number(query.pageNum ?? 1);
    const pageSize = Number(query.pageSize ?? 20);

    const [total, rows] = await Promise.all([
      this.prisma.sysJobLog.count({ where }),
      this.prisma.sysJobLog.findMany({
        where,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
        orderBy: { createTime: 'desc' },
      }),
    ]);

    const safeRows = rows.map((row) => ({
      ...row,
      jobLogId: row.jobLogId.toString(),
    }));

    return { total, rows: safeRows };
  }

  /**
   * 清空任务日志
   */
  async cleanJobLogs() {
    await this.prisma.sysJobLog.deleteMany({});
    return { msg: '清空成功' };
  }
}

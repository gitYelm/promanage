import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { ExportTaskService } from '../../common/export/export-task.service';

interface JobTask {
  jobId: string;
  jobName: string;
  jobGroup: string;
  invokeTarget: string;
  cronExpression: string;
  status: string;
  concurrent: string;
}

interface JobLogData {
  jobName: string;
  jobGroup: string;
  invokeTarget: string;
  jobMessage: string;
  status: string;
  exceptionInfo?: string;
  startTime: Date;
  stopTime?: Date;
}

@Injectable()
export class JobExecutorService implements OnModuleInit, OnModuleDestroy {
  // 记录正在执行的任务，用于并发控制
  private runningJobs = new Set<string>();

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private prisma: PrismaService,
    private logger: LoggerService,
    private exportTaskService: ExportTaskService,
  ) {}

  async onModuleInit() {
    // 启动时加载所有启用的定时任务
    await this.loadAllJobs();
  }

  onModuleDestroy() {
    // 停止所有任务
    this.stopAllJobs();
  }

  /**
   * 加载所有启用的定时任务
   */
  async loadAllJobs() {
    try {
      const jobs = await this.prisma.sysJob.findMany({
        where: { status: '0' }, // 0=正常
      });

      for (const job of jobs) {
        await this.addJob({
          jobId: job.jobId.toString(),
          jobName: job.jobName ?? '',
          jobGroup: job.jobGroup ?? 'DEFAULT',
          invokeTarget: job.invokeTarget ?? '',
          cronExpression: job.cronExpression ?? '',
          status: job.status ?? '1',
          concurrent: job.concurrent ?? '1',
        });
      }

      this.logger.log(`已加载 ${jobs.length} 个定时任务`, 'JobExecutor');
    } catch (error) {
      this.logger.error(
        '加载定时任务失败',
        (error as Error).stack,
        'JobExecutor',
      );
    }
  }

  /**
   * 添加定时任务
   */
  async addJob(task: JobTask): Promise<boolean> {
    const jobKey = this.getJobKey(task.jobId);

    try {
      // 如果任务已存在，先删除
      if (this.schedulerRegistry.doesExist('cron', jobKey)) {
        this.schedulerRegistry.deleteCronJob(jobKey);
      }

      // 创建 CronJob
      const cronJob = new CronJob(
        task.cronExpression,
        () => void this.executeJob(task),
        null,
        false, // 不自动启动
        'Asia/Shanghai',
      );

      this.schedulerRegistry.addCronJob(jobKey, cronJob);

      // 如果状态为启用，则启动任务
      if (task.status === '0') {
        cronJob.start();
        this.logger.log(
          `定时任务已启动: ${task.jobName} (${task.cronExpression})`,
          'JobExecutor',
        );
      }

      return true;
    } catch (error) {
      this.logger.error(
        `添加定时任务失败: ${task.jobName}`,
        (error as Error).stack,
        'JobExecutor',
      );
      return false;
    }
  }

  /**
   * 执行任务
   */
  private async executeJob(task: JobTask) {
    const jobKey = this.getJobKey(task.jobId);
    const startTime = new Date();

    // 并发控制：如果不允许并发且任务正在执行，则跳过
    if (task.concurrent === '1' && this.runningJobs.has(jobKey)) {
      this.logger.warn(
        `任务 ${task.jobName} 正在执行中，跳过本次调度`,
        'JobExecutor',
      );
      return;
    }

    this.runningJobs.add(jobKey);

    const logData: JobLogData = {
      jobName: task.jobName,
      jobGroup: task.jobGroup,
      invokeTarget: task.invokeTarget,
      jobMessage: '',
      status: '0',
      startTime,
    };

    try {
      this.logger.log(`开始执行任务: ${task.jobName}`, 'JobExecutor');

      // 解析并执行目标方法
      await this.invokeTarget(task.invokeTarget);

      logData.status = '0'; // 成功
      logData.jobMessage = '执行成功';
      logData.stopTime = new Date();

      this.logger.log(
        `任务执行成功: ${task.jobName}, 耗时: ${logData.stopTime.getTime() - startTime.getTime()}ms`,
        'JobExecutor',
      );
    } catch (error) {
      logData.status = '1'; // 失败
      logData.jobMessage = '执行失败';
      logData.exceptionInfo = (error as Error).message;
      logData.stopTime = new Date();

      this.logger.error(
        `任务执行失败: ${task.jobName}`,
        (error as Error).stack,
        'JobExecutor',
      );
    } finally {
      this.runningJobs.delete(jobKey);
      // 记录执行日志
      await this.saveJobLog(logData);
    }
  }

  /**
   * 解析并执行目标方法
   * 支持格式：
   * - http://xxx 或 https://xxx - HTTP 请求
   * - shell:command - Shell 命令
   * - log:message - 记录日志（测试用）
   * - export:cleanExpiredTasks - 清理过期导出任务
   */
  private async invokeTarget(target: string): Promise<void> {
    if (!target) {
      throw new Error('调用目标不能为空');
    }

    // HTTP 请求
    if (target.startsWith('http://') || target.startsWith('https://')) {
      const response = await fetch(target, { method: 'GET' });
      if (!response.ok) {
        throw new Error(
          `HTTP 请求失败: ${response.status} ${response.statusText}`,
        );
      }
      return;
    }

    // Shell 命令（生产环境慎用）
    if (target.startsWith('shell:')) {
      const command = target.substring(6);
      const { exec } = await import('child_process');
      return new Promise((resolve, reject) => {
        exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Shell 执行失败: ${stderr || error.message}`));
          } else {
            this.logger.debug(`Shell 输出: ${stdout}`, 'JobExecutor');
            resolve();
          }
        });
      });
    }

    // 日志记录（测试用）
    if (target.startsWith('log:')) {
      const message = target.substring(4);
      this.logger.log(`定时任务日志: ${message}`, 'JobExecutor');
      return;
    }

    // 导出任务相关
    if (target.startsWith('export:')) {
      const method = target.substring(7);
      if (method === 'cleanExpiredTasks') {
        await this.exportTaskService.cleanExpiredTasks();
        return;
      }
      throw new Error(`不支持的导出任务方法: ${method}`);
    }

    throw new Error(`不支持的调用目标格式: ${target}`);
  }

  /**
   * 保存任务执行日志
   */
  private async saveJobLog(data: JobLogData) {
    try {
      await this.prisma.sysJobLog.create({
        data: {
          jobName: data.jobName,
          jobGroup: data.jobGroup,
          invokeTarget: data.invokeTarget,
          jobMessage: data.jobMessage,
          status: data.status,
          exceptionInfo: data.exceptionInfo,
          createTime: data.startTime,
        },
      });
    } catch (error) {
      this.logger.error(
        '保存任务日志失败',
        (error as Error).stack,
        'JobExecutor',
      );
    }
  }

  /**
   * 立即执行一次任务，返回执行结果
   */
  async runJobOnce(jobId: string): Promise<JobLogData> {
    const job = await this.prisma.sysJob.findUnique({
      where: { jobId: BigInt(jobId) },
    });

    if (!job) {
      throw new Error('任务不存在');
    }

    return this.executeJobWithResult({
      jobId: job.jobId.toString(),
      jobName: job.jobName ?? '',
      jobGroup: job.jobGroup ?? 'DEFAULT',
      invokeTarget: job.invokeTarget ?? '',
      cronExpression: job.cronExpression ?? '',
      status: job.status ?? '1',
      concurrent: job.concurrent ?? '1',
    });
  }

  /**
   * 执行任务并返回结果（用于手动执行）
   */
  private async executeJobWithResult(task: JobTask): Promise<JobLogData> {
    const jobKey = this.getJobKey(task.jobId);
    const startTime = new Date();

    // 并发控制：如果不允许并发且任务正在执行，则跳过
    if (task.concurrent === '1' && this.runningJobs.has(jobKey)) {
      return {
        jobName: task.jobName,
        jobGroup: task.jobGroup,
        invokeTarget: task.invokeTarget,
        jobMessage: '任务正在执行中，跳过本次调度',
        status: '1',
        startTime,
        stopTime: new Date(),
      };
    }

    this.runningJobs.add(jobKey);

    const logData: JobLogData = {
      jobName: task.jobName,
      jobGroup: task.jobGroup,
      invokeTarget: task.invokeTarget,
      jobMessage: '',
      status: '0',
      startTime,
    };

    try {
      this.logger.log(`开始执行任务: ${task.jobName}`, 'JobExecutor');

      // 解析并执行目标方法
      await this.invokeTarget(task.invokeTarget);

      logData.status = '0'; // 成功
      logData.jobMessage = '执行成功';
      logData.stopTime = new Date();

      this.logger.log(
        `任务执行成功: ${task.jobName}, 耗时: ${logData.stopTime.getTime() - startTime.getTime()}ms`,
        'JobExecutor',
      );
    } catch (error) {
      logData.status = '1'; // 失败
      logData.jobMessage = '执行失败';
      logData.exceptionInfo = (error as Error).message;
      logData.stopTime = new Date();

      this.logger.error(
        `任务执行失败: ${task.jobName}`,
        (error as Error).stack,
        'JobExecutor',
      );
    } finally {
      this.runningJobs.delete(jobKey);
      // 记录执行日志
      await this.saveJobLog(logData);
    }

    return logData;
  }

  /**
   * 启动任务
   */
  startJob(jobId: string): boolean {
    const jobKey = this.getJobKey(jobId);
    try {
      const job = this.schedulerRegistry.getCronJob(jobKey);
      job.start();
      this.logger.log(`任务已启动: ${jobKey}`, 'JobExecutor');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 停止任务
   */
  stopJob(jobId: string): boolean {
    const jobKey = this.getJobKey(jobId);
    try {
      const job = this.schedulerRegistry.getCronJob(jobKey);
      void job.stop();
      this.logger.log(`任务已停止: ${jobKey}`, 'JobExecutor');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 删除任务
   */
  removeJob(jobId: string): boolean {
    const jobKey = this.getJobKey(jobId);
    try {
      if (this.schedulerRegistry.doesExist('cron', jobKey)) {
        this.schedulerRegistry.deleteCronJob(jobKey);
        this.logger.log(`任务已删除: ${jobKey}`, 'JobExecutor');
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 停止所有任务
   */
  private stopAllJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((job, key) => {
      void job.stop();
      this.logger.debug(`停止任务: ${key}`, 'JobExecutor');
    });
  }

  /**
   * 获取任务唯一标识
   */
  private getJobKey(jobId: string): string {
    return `job_${jobId}`;
  }
}

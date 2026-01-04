/**
 * 日志系统使用示例
 * 此文件仅供参考,不会被编译到生产代码中
 */

import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Injectable()
export class ExampleService {
  constructor(private readonly logger: LoggerService) {}

  /**
   * 示例 1: 记录普通信息
   */
  logInfo() {
    this.logger.log('Application started successfully', 'ExampleService');
    this.logger.log('User authentication completed', 'ExampleService');
  }

  /**
   * 示例 2: 记录错误信息
   */
  logError() {
    try {
      throw new Error('Database connection failed');
    } catch (error: unknown) {
      const err = error as { stack?: string };
      this.logger.error(
        'Failed to connect to database',
        err.stack,
        'ExampleService',
      );
    }
  }

  /**
   * 示例 3: 记录警告信息
   */
  logWarning() {
    this.logger.warn('API rate limit approaching', 'ExampleService');
    this.logger.warn('Cache miss, fetching from database', 'ExampleService');
  }

  /**
   * 示例 4: 记录调试信息
   */
  logDebug() {
    this.logger.debug('Request payload: {"userId": 123}', 'ExampleService');
    this.logger.debug('Cache hit for key: user:123', 'ExampleService');
  }

  /**
   * 示例 5: 记录详细信息
   */
  logVerbose() {
    this.logger.verbose('Processing batch job: 1/100', 'ExampleService');
  }

  /**
   * 示例 6: 记录 HTTP 请求(结构化日志)
   */
  logHttp() {
    this.logger.http('API request processed', {
      method: 'POST',
      url: '/api/users',
      statusCode: 201,
      responseTime: 45,
      userId: 123,
    });
  }

  /**
   * 示例 7: 业务流程日志
   */
  async processOrder(orderId: string) {
    this.logger.log(`Starting order processing: ${orderId}`, 'ExampleService');

    try {
      // 步骤 1
      this.logger.debug(`Validating order: ${orderId}`, 'ExampleService');

      // 步骤 2
      this.logger.debug(`Calculating total: ${orderId}`, 'ExampleService');

      // 步骤 3
      this.logger.log(
        `Order processed successfully: ${orderId}`,
        'ExampleService',
      );

      return { success: true };
    } catch (error: unknown) {
      const err = error as { stack?: string };
      this.logger.error(
        `Order processing failed: ${orderId}`,
        err.stack,
        'ExampleService',
      );
      throw error;
    }
  }

  /**
   * 示例 8: 性能监控日志
   */
  async performanceTracking() {
    const startTime = Date.now();

    // 执行业务逻辑
    await this.someExpensiveOperation();

    const duration = Date.now() - startTime;

    if (duration > 1000) {
      this.logger.warn(
        `Slow operation detected: ${duration}ms`,
        'ExampleService',
      );
    } else {
      this.logger.debug(
        `Operation completed in ${duration}ms`,
        'ExampleService',
      );
    }
  }

  private async someExpensiveOperation() {
    // 模拟耗时操作
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

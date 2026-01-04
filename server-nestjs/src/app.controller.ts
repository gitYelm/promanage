import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ErrorCode, ErrorCodeMessage } from './common/enums/error-code.enum';

@ApiTags('系统')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiExcludeEndpoint()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiExcludeEndpoint()
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('api-spec')
  @ApiOperation({ summary: '获取 API 规范说明（认证、响应格式、错误码）' })
  getApiSpec() {
    // 构建错误码分组
    const errorCodes = {
      通用错误: {} as Record<number, string>,
      认证授权: {} as Record<number, string>,
      用户管理: {} as Record<number, string>,
      角色管理: {} as Record<number, string>,
      部门管理: {} as Record<number, string>,
      菜单管理: {} as Record<number, string>,
      字典岗位: {} as Record<number, string>,
      系统配置: {} as Record<number, string>,
      监控日志: {} as Record<number, string>,
    };

    for (const key of Object.keys(ErrorCode)) {
      const code = ErrorCode[key as keyof typeof ErrorCode];
      if (typeof code !== 'number') continue;

      const message = ErrorCodeMessage[code];
      if (code === 200 || code === 500) {
        errorCodes['通用错误'][code] = message;
      } else if (code >= 10000 && code < 20000) {
        errorCodes['通用错误'][code] = message;
      } else if (code >= 20000 && code < 30000) {
        errorCodes['认证授权'][code] = message;
      } else if (code >= 30000 && code < 40000) {
        errorCodes['用户管理'][code] = message;
      } else if (code >= 40000 && code < 50000) {
        errorCodes['角色管理'][code] = message;
      } else if (code >= 50000 && code < 60000) {
        errorCodes['部门管理'][code] = message;
      } else if (code >= 60000 && code < 70000) {
        errorCodes['菜单管理'][code] = message;
      } else if (code >= 70000 && code < 80000) {
        errorCodes['字典岗位'][code] = message;
      } else if (code >= 80000 && code < 90000) {
        errorCodes['系统配置'][code] = message;
      } else if (code >= 90000) {
        errorCodes['监控日志'][code] = message;
      }
    }

    return {
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization',
        format: 'Bearer <token>',
        description: '通过 POST /auth/login 获取 token',
      },
      responseFormat: {
        success: { code: 200, msg: 'success', data: '...' },
        error: { code: '错误码', msg: '错误信息', data: null },
        pagination: {
          code: 200,
          msg: 'success',
          data: { rows: [], total: 0 },
        },
      },
      errorCodes,
    };
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './common/logger/logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded } from 'express';
import redoc from 'redoc-express';

// 全局 BigInt 序列化支持
// 解决 "TypeError: Do not know how to serialize a BigInt" 错误
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};
/* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true, // 缓冲日志直到自定义 logger 就绪
    bodyParser: true,
    rawBody: true,
  });

  // 使用自定义日志服务
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // 配置静态文件服务 (用于访问上传的文件)
  // 设置 CORS 头允许跨域访问
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res: { setHeader: (name: string, value: string) => void }) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    },
  });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 增加请求体大小限制 (支持文件上传,如 APK/IPA 包)
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb', extended: true }));

  // 全局参数校验管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剔除 DTO 中未定义的属性
      transform: true, // 自动类型转换
    }),
  );

  // 全局拦截器与过滤器
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // 启用 CORS (跨域资源共享)
  // 生产环境必须配置白名单，未配置则拒绝所有跨域请求
  // 开发环境允许所有来源
  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (isProduction && (!corsOrigins || corsOrigins.length === 0)) {
    logger.warn(
      '生产环境未配置 CORS_ORIGINS，将拒绝所有跨域请求！请在 .env 中配置允许的来源',
      'Bootstrap',
    );
  }

  app.enableCors({
    origin: isProduction ? corsOrigins || false : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-New-Token'], // 暴露滑动过期的新 Token 头
  });

  // 配置 Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('RBAC Admin Pro API')
    .setDescription('基于 RBAC 权限模型的企业级后台管理系统')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '请输入 JWT Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('系统', '系统信息与错误码')
    .addTag('认证', '用户认证相关接口')
    .addTag('用户管理', '系统用户管理')
    .addTag('角色管理', '角色权限管理')
    .addTag('菜单管理', '菜单权限管理')
    .addTag('部门管理', '组织部门管理')
    .addTag('岗位管理', '岗位信息管理')
    .addTag('字典类型', '字典类型管理')
    .addTag('字典数据', '字典数据管理')
    .addTag('参数配置', '系统参数配置')
    .addTag('通知公告', '系统通知公告')
    .addTag('操作日志', '操作日志记录')
    .addTag('登录日志', '登录日志记录')
    .addTag('在线用户', '在线用户管理')
    .addTag('服务器监控', '服务器状态监控')
    .addTag('缓存监控', 'Redis 缓存监控')
    .addTag('数据库监控', '数据库状态监控')
    .addTag('定时任务', '定时任务管理')
    .addTag('文件上传', '文件上传服务')
    .addTag('邮件服务', '邮件发送服务')
    .addTag('路由菜单', '前端路由获取')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 持久化认证信息
      docExpansion: 'list', // 默认展开所有接口列表（list=展开接口 full=展开全部 none=全部折叠）
      defaultModelsExpandDepth: 2, // Schema 模型默认展开深度
      defaultModelExpandDepth: 2, // 单个模型默认展开深度
    },
  });

  // 添加 Redoc API 文档
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(
    '/redoc',
    redoc({
      title: 'RBAC Admin Pro API',
      specUrl: '/api-docs-json',
      redocOptions: {
        theme: {
          colors: { primary: { main: '#1890ff' } },
        },
        hideDownloadButton: false,
        expandResponses: '200',
        pathInMiddlePanel: true,
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: http://0.0.0.0:${port}`, 'Bootstrap');
  logger.log(`Swagger API Docs: http://0.0.0.0:${port}/api-docs`, 'Bootstrap');
  logger.log(`Redoc API Docs: http://0.0.0.0:${port}/redoc`, 'Bootstrap');
}
void bootstrap();

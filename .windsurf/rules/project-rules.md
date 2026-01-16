---
trigger: always_on
---

# 项目开发规范

## 1. 项目结构
1. **web/**: Vue 3 + TypeScript + Vite + shadcn-vue
2. **server-nestjs/**: NestJS + PostgreSQL + Prisma
3. **docs/**: 项目文档

## 2. 前端规范

### 2.1 命名规范
1. 组件文件: `PascalCase` (如 `UserProfile.vue`)
2. 普通文件: `kebab-case` (如 `user-service.ts`)
3. 目录名称: `kebab-case` (如 `user-management/`)

### 2.2 开发规范
1. UI组件必须用 CLI 安装: `npx shadcn-vue@latest add <组件名>`
2. 页面统一用 `<script setup lang="ts">`,复杂逻辑抽取为 `useXxx`
3. API 保持响应结构 `{ code, msg, data }`,命名用动词开头

### 2.3 常用命令 (在 `web/` 目录)
1. 启动: `npm run dev`
2. 检查: `npm run type-check`
3. 构建: `npm run build`

## 3. 后端规范

### 3.1 架构分层
1. **Controller**: 仅路由定义和 DTO 校验,必须加 Swagger 装饰器 (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`)
2. **Service**: 核心业务逻辑,必须用 `LoggerService` 记录日志,必须用 `BusinessException` 抛异常
3. **DTO**: 必须用 `class-validator` 校验,必须加 JSDoc 注释 (如 `/** 用户名 */`)

### 3.2 数据库管理
1. Schema 文件: `server-nestjs/prisma/schema.prisma`
2. 修改后执行: `npx prisma migrate dev` (生成迁移)
3. 更新类型: `npx prisma generate`

### 3.3 常用命令 (在 `server-nestjs/` 目录)
1. 启动: `npm run start:dev`
2. 检查: `npm run lint` / `npm run check`
3. 数据库 UI: `npx prisma studio`

## 4. 错误处理规范

### 4.1 后端错误处理
1. 导入: `import { BusinessException } from '@/common/exceptions'; import { ErrorCode } from '@/common/enums'`
2. 抛异常: `throw new BusinessException(ErrorCode.USER_NOT_FOUND)` (必须使用错误码)
3. 返回格式: `{ code: 30001, msg: "用户不存在", data: null }`
4. HTTP 状态码映射:
   - 大部分业务异常: HTTP 200
   - `ErrorCode.UNAUTHORIZED`: HTTP 401
   - `ErrorCode.FORBIDDEN`: HTTP 403
   - `ErrorCode.INTERNAL_ERROR`: HTTP 500
5. 常见场景:
   - 数据不存在: `throw new BusinessException(ErrorCode.USER_NOT_FOUND)`
   - 未登录: `throw new BusinessException(ErrorCode.UNAUTHORIZED)` (HTTP 401)
   - 无权限: `throw new BusinessException(ErrorCode.FORBIDDEN)` (HTTP 403)

### 4.2 前端错误处理
1. 错误消息: 优先使用后端返回的 `msg`,如果没有则使用 `getErrorMessage(code)` 获取前端定义的错误消息
2. 两层拦截:
   - 成功拦截器 (HTTP 200): 检查业务错误码,使用 `shouldRedirectToLogin(code)` 和 `ErrorCode.SUCCESS`
   - 错误拦截器 (HTTP 非 200): 检查 HTTP 状态码 (400/401/403/500),统一显示错误提示
3. 组件中特殊处理: 导入 `import { ErrorCode } from '@/types/error-code'`,判断 `if (error.code === ErrorCode.CANNOT_DELETE_SELF)`

## 5. 日志规范

### 5.1 后端日志
1. 导入: `import { LoggerService } from '@/common/logger/logger.service'`
2. 级别使用:
   - DEBUG: `this.logger.debug('调试信息', 'ServiceName')`
   - INFO: `this.logger.log('一般信息', 'ServiceName')`
   - WARN: `this.logger.warn('警告信息', 'ServiceName')`
   - ERROR: `this.logger.error('错误信息', error.stack, 'ServiceName')`
3. 必须记录: 关键业务操作、外部调用、数据库失败、权限验证失败
4. 禁止记录: 密码等敏感信息

### 5.2 前端日志
1. 开发用 `console.log/warn/error`
2. 生产环境禁止提交 `console.log`

## 6. 通用规范

### 6.1 TypeScript
1. 前后端接口字段保持一致
2. 避免使用 `any`

### 6.2 Git 提交
1. 格式: `<type>(<scope>): <subject>`
2. 示例: `feat(auth): add login api`

### 6.3 注释规范
1. 统一使用中文
2. 关键逻辑必须注释,解释"为什么"而非"做什么"
3. 接口/方法必须 JSDoc 注释

## 7. AI 协作规范

### 7.1 开发流程
1. 先搜索已有代码,避免重复
2. 保持原有注释和代码风格
3. 破坏性变更必须先确认

### 7.2 代码质量
1. 复杂逻辑必须加中文注释
2. 后端 Service 禁止 `throw new Error()` 和 `console.log`
3. 后端 Controller 必须加 Swagger 装饰器
4. 后端 DTO 必须加 JSDoc 注释

### 7.3 验证要求
1. 修改后必须运行检查: 前端 `npm run type-check`,后端 `npm run check`
2. 完成后主动建议验证方式

## 8. 核心约束

1. 多字段对象用多行+尾逗号,单元素数组用单行
2. 后端 Service 必须: `BusinessException` + `LoggerService`
3. 后端 Controller 必须: Swagger 装饰器
4. 后端 DTO 必须: JSDoc 注释

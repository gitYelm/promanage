# 技术栈

## 架构
pnpm Monorepo：
- `web/` - 前端 Vue 3 SPA
- `server-nestjs/` - 后端 NestJS REST API

## 前端 (web/)
- Vue 3.5 + Composition API (`<script setup lang="ts">`)
- Vite 7.2 构建
- TypeScript 5.9
- shadcn-vue 2.4 (基于 Radix Vue 1.9 + Reka UI 2.6)
- Tailwind CSS 3.4
- Pinia 3 状态管理
- Vue Router 4.6
- Axios 1.13 HTTP 客户端
- VeeValidate 4.15 + Zod 3.25 表单验证
- Lucide Vue Next 图标
- Tiptap 3.15 富文本编辑器
- VueUse 14 工具库
- DOMPurify XSS 防护

## 后端 (server-nestjs/)
- NestJS 11
- TypeScript 5.7
- Prisma 7.1 ORM (PostgreSQL adapter)
- PostgreSQL 16
- Redis (ioredis 5.8) 缓存
- JWT + Passport 认证
- 两步验证 (otplib + qrcode)
- class-validator + class-transformer 验证
- Swagger 11 API 文档
- Winston 3.18 + daily-rotate-file 日志
- ExcelJS 4.4 导出
- AWS S3 文件存储 (可选)
- Nodemailer 7 邮件发送
- @nestjs/schedule 定时任务

## 常用命令

### 根目录 (推荐)
```bash
pnpm dev              # 同时启动前后端
pnpm dev:web          # 仅前端
pnpm dev:server       # 仅后端
pnpm build            # 构建所有
pnpm lint             # 检查所有
pnpm db:migrate       # Prisma 迁移
pnpm db:generate      # 生成 Prisma Client
pnpm db:seed          # 种子数据
pnpm db:studio        # Prisma Studio GUI
```

### 前端 (web/)
```bash
pnpm dev              # 开发服务器
pnpm build            # 生产构建
pnpm type-check       # TypeScript 检查
pnpm lint             # ESLint
pnpm format           # Prettier
```

### 后端 (server-nestjs/)
```bash
pnpm start:dev        # 开发服务器 (热重载)
pnpm build            # 编译
pnpm check            # tsc --noEmit
pnpm validate         # lint + check
pnpm test             # Jest 单元测试
pnpm test:e2e         # E2E 测试
```

### Docker
```bash
docker-compose up -d      # 启动 PostgreSQL + Redis
docker-compose down       # 停止服务
```

## API 规范

### 响应格式
```json
{
  "code": 200,
  "msg": "success",
  "data": { ... }
}
```

### 分页响应
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "rows": [...],
    "total": 100
  }
}
```

### 错误码范围
| 范围 | 模块 |
|------|------|
| 1xxxx | 通用错误 |
| 2xxxx | 认证授权 |
| 3xxxx | 用户管理 |
| 4xxxx | 角色管理 |
| 5xxxx | 部门管理 |
| 6xxxx | 菜单管理 |
| 7xxxx | 字典/岗位 |
| 8xxxx | 系统配置 |
| 9xxxx | 监控日志 |

详见 `server-nestjs/src/common/enums/error-code.enum.ts`

## 状态值约定
- `status`: "0" 正常/启用, "1" 停用/禁用
- `delFlag`: "0" 存在, "2" 已删除 (软删除)
- `visible`: "0" 显示, "1" 隐藏

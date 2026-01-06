<h1 align="center">RBAC Admin Pro</h1>

<p align="center">
  <strong>企业级全栈后台管理系统</strong>
</p>

<p align="center">
  基于 Vue 3 + NestJS + Prisma 的现代化 RBAC 权限管理系统
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js" alt="Vue">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs" alt="NestJS">
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

## ✨ 功能特性

| 模块 | 功能 |
|------|------|
| **权限管理** | 用户管理、角色管理、菜单管理、部门管理、岗位管理 |
| **系统功能** | 字典管理、参数配置、通知公告、定时任务 |
| **系统监控** | 操作日志、登录日志、在线用户、服务监控、缓存监控 |
| **安全特性** | JWT 认证、双因素认证 (TOTP)、图形验证码、Token 黑名单 |

## 🛠 技术栈

| 前端 | 后端 |
|------|------|
| Vue 3.5 + Composition API | NestJS 11 |
| Vite 7 + TypeScript 5.9 | Prisma 7 ORM |
| shadcn-vue 2.4 + Tailwind CSS 3.4 | PostgreSQL 16 + Redis 7 |
| Pinia 3 + Vue Router 4 | JWT + Passport |
| VeeValidate + Zod | Swagger + Winston |
| Tiptap 富文本编辑器 | AWS S3 文件存储 |
| VueUse 14 + Lucide Icons | Nodemailer 邮件服务 |

## 🚀 快速开始

### 方式一：Docker 一键部署

```bash
# 克隆项目
git clone https://github.com/lyfe2025/rbac-admin-pro.git
cd rbac-admin-pro

# 配置环境变量
cp .env.docker.example .env
# 编辑 .env，设置 POSTGRES_PASSWORD 和 JWT_SECRET

# 启动数据库和 Redis
docker-compose up -d postgres redis

# 初始化数据库（首次部署）
./db.sh  # 选择 11 执行迁移，选择 13 导入种子数据

# 启动全部服务
docker-compose up -d --build
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:8080 |
| 后端 API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/api-docs |
| Redoc | http://localhost:3000/redoc |
| PostgreSQL | localhost:5433 |

### 方式二：本地开发

**环境要求：** Node.js >= 18, PostgreSQL 16, Redis, pnpm

```bash
# 启动数据库
docker-compose up -d postgres redis

# 安装依赖
pnpm install

# 配置后端环境变量
cp server-nestjs/.env.example server-nestjs/.env

# 初始化数据库
pnpm db:migrate
pnpm db:seed

# 启动开发服务器
pnpm dev
```

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:5173 |
| 后端 API | http://localhost:3000 |

**默认账号：** `admin` / `admin123`

## 📦 项目结构

```
rbac-admin-pro/
├── web/                  # 前端 Vue 3
│   └── src/
│       ├── api/          # API 接口
│       ├── components/   # 组件 (ui/common/business)
│       ├── composables/  # 组合式函数
│       ├── views/        # 页面视图
│       ├── stores/       # Pinia 状态
│       ├── router/       # 路由配置
│       ├── directive/    # Vue 指令 (权限)
│       └── layout/       # 布局组件
├── server-nestjs/        # 后端 NestJS
│   ├── src/
│   │   ├── auth/         # 认证模块
│   │   ├── system/       # 系统管理
│   │   ├── monitor/      # 监控模块
│   │   └── common/       # 公共模块
│   └── prisma/           # 数据库 Schema
├── db/                   # SQL 脚本
├── docs/                 # 项目文档
├── monorepo.sh           # 服务管理脚本
└── db.sh                 # 数据库管理脚本
```

## 🔧 常用命令

### pnpm workspace（推荐）

```bash
pnpm dev              # 同时启动前后端
pnpm build            # 构建所有
pnpm lint             # 检查所有代码
pnpm db:migrate       # 数据库迁移
pnpm db:seed          # 种子数据
pnpm db:studio        # Prisma GUI
```

### 交互式脚本

项目提供两个交互式管理脚本：

```bash
./monorepo.sh         # 服务管理（启停、构建、Docker 部署）
./db.sh               # 数据库管理（Prisma 迁移、备份恢复）
```

<details>
<summary><b>monorepo.sh 功能菜单</b></summary>

运行 `./monorepo.sh` 会显示交互式控制台，包含前后端运行状态、PID、端口、Uptime 等信息。

**本地开发**
| 序号 | 功能 | 说明 |
|------|------|------|
| 1 | 一键启动前后端 | 启动后自动跟随日志输出 |
| 2 | 一键停止前后端 | - |
| 3 | 一键重启前后端 | 重启后自动跟随日志输出 |
| 4 | 同步数据库迁移 | `prisma migrate dev` |
| 5 | 打开 Prisma Studio | 数据库可视化管理 |
| 6 | 前端类型检查 | `pnpm type-check` |
| 7 | 后端代码校验 | `pnpm validate` |
| 8 | 后端快速 API 冒烟测试 | 执行登录、用户、角色等接口测试 |
| 9 | 重置数据库到初始状态 (危险) | `prisma migrate reset` + 重新 seed |

**Docker 部署**
| 序号 | 功能 | 命令 |
|------|------|------|
| 10 | 启动基础设施 (PG+Redis) | `docker-compose up -d postgres redis` |
| 11 | 启动全部服务 | `docker-compose up -d` |
| 12 | 构建并启动全部 | `docker-compose up -d --build` |
| 13 | 仅构建后端镜像 | `docker-compose build server` |
| 14 | 仅构建前端镜像 | `docker-compose build web` |
| 15 | 停止全部服务 | `docker-compose down` |
| 16 | 重启全部服务 | `docker-compose restart` |
| 17 | 重启指定服务 | 交互式选择 server/web/postgres/redis |
| 18 | 查看服务状态 | `docker-compose ps` |
| 19 | 查看服务日志 | 交互式选择服务日志 |

**特性说明**
- 支持环境变量覆盖端口：`WEB_PORT=3001 SERVER_PORT=4000 ./monorepo.sh`
- 自动读取 `.env` 文件中的端口配置
- Docker 构建时自动生成 Git 提交记录 JSON（用于更新日志页面）

</details>

<details>
<summary><b>db.sh 功能菜单</b></summary>

**本地开发**
| 序号 | 功能 | 命令 |
|------|------|------|
| 1 | 生成 Prisma Client | `pnpm prisma generate` |
| 2 | 创建开发迁移 | `pnpm prisma migrate dev --name xxx` |
| 3 | 查看迁移状态 | `pnpm prisma migrate status` |
| 4 | 重置数据库 (危险) | `pnpm prisma migrate reset` |
| 5 | 推送 Schema | `pnpm prisma db push` |
| 6 | 拉取数据库 Schema | `pnpm prisma db pull` |
| 7 | 导入种子数据 | `pnpm prisma db seed` |
| 8 | 启动 Prisma Studio | `pnpm prisma studio` |
| 9 | 格式化 Schema | `pnpm prisma format` |
| 10 | 验证 Schema | `pnpm prisma validate` |

**Docker / 生产环境**
| 序号 | 功能 | 命令 |
|------|------|------|
| 11 | 执行生产迁移 | `DATABASE_URL=... pnpm prisma migrate deploy` |
| 12 | 查看迁移状态 | `DATABASE_URL=... pnpm prisma migrate status` |
| 13 | 导入种子数据 | `DATABASE_URL=... pnpm prisma db seed` |
| 14 | 执行 SQL 文件 | `docker exec -i rbac-postgres psql < file.sql` |
| 15 | 备份数据库 | `docker exec rbac-postgres pg_dump > backup.sql` |
| 16 | 恢复数据库 | `docker exec -i rbac-postgres psql < backup.sql` |
| 17 | 连接 PostgreSQL | `docker exec -it rbac-postgres psql` |

</details>

## 🔌 MCP Server 配置

本项目前端使用 [shadcn-vue](https://www.shadcn-vue.com/) 组件库，支持通过 MCP 让 AI 助手更好地理解和使用组件。

<details>
<summary><b>配置方法</b></summary>

在 IDE 的 MCP 配置文件中添加：

```json
{
  "mcpServers": {
    "shadcn-vue": {
      "command": "npx",
      "args": ["-y", "@shadcn-vue/mcp@latest"]
    }
  }
}
```

配置文件位置：
- Kiro: `.kiro/settings/mcp.json`
- Cursor: `.cursor/mcp.json`
- VS Code: `.vscode/mcp.json`

</details>

## 📚 文档

| 分类 | 文档 |
|------|------|
| **入门** | [快速开始](docs/指南/快速开始.md) · [文档中心](docs/README.md) |
| **部署** | [宝塔Docker部署](docs/指南/宝塔Docker部署指南.md) · [Docker运维](docs/指南/Docker生产环境运维指南.md) |
| **开发** | [Prisma指南](docs/指南/Prisma使用指南.md) · [Swagger指南](docs/指南/Swagger使用指南.md) |
| **配置** | [文件存储](docs/指南/文件存储配置指南.md) · [SMTP邮件](docs/指南/SMTP邮件配置指南.md) |
| **脚手架** | [新项目初始化指南](docs/指南/新项目初始化指南.md) · [模块复用指南](docs/指南/模块复用指南.md) |

## 📄 License

[MIT](LICENSE)

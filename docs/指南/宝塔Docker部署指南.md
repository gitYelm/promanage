# RBAC Admin Pro 宝塔 Docker 部署指南

本文档介绍如何在宝塔面板上使用 Docker 方式部署 RBAC Admin Pro 项目。

## 环境要求

| 组件 | 版本要求 |
|------|----------|
| 操作系统 | CentOS 7+ / Ubuntu 18.04+ |
| Docker | 20.10+ |
| Docker Compose | 2.0+ |

## 一、准备工作

### 1.1 停止宝塔自带的数据库服务

如果之前在宝塔上安装过 PostgreSQL 或 Redis，需要先停止或卸载，避免端口冲突：

1. 进入宝塔面板「软件商店」→「已安装」
2. 找到 PostgreSQL，点击「停止」或「卸载」
3. 找到 Redis，点击「停止」或「卸载」

> Docker 容器会使用 5432（PostgreSQL）和 6379（Redis）端口，与宝塔自带服务冲突。

### 1.2 安装 Docker

**方式一：通过全站服务安装（推荐）**

1. 进入宝塔面板左侧菜单「Docker」
2. 如果未安装，会提示安装 Docker 服务
3. 点击安装，等待完成

**方式二：通过软件商店安装**

1. 进入宝塔面板「软件商店」
2. 搜索「Docker」，找到官方应用
3. 点击安装

> 注意：旧版「Docker管理器」已停止维护，请使用宝塔新版 Docker 功能。

### 1.3 验证安装

```bash
docker -v
# Docker version 24.x.x

docker compose version
# Docker Compose version v2.x.x
```

## 二、上传项目代码

### 方式一：Git 拉取（推荐）

```bash
cd /www/wwwroot
git clone <你的仓库地址> rbac-admin-pro
cd rbac-admin-pro
```

### 方式二：宝塔面板上传

1. 在「文件」中进入 `/www/wwwroot/`
2. 上传项目压缩包并解压

## 三、配置环境变量

```bash
cd /www/wwwroot/rbac-admin-pro

# 复制示例配置
cp .env.docker.example .env

# 编辑配置
vi .env
```

`.env` 文件内容：

```bash
# ==================== 数据库配置 ====================
POSTGRES_DB=rbac_admin
POSTGRES_USER=rbac_admin
# 请修改为强密码！
POSTGRES_PASSWORD=YourStrongPassword@2024

# ==================== JWT 配置 ====================
# 生成方法: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 或者: openssl rand -hex 32
JWT_SECRET=你的JWT密钥
```

> ⚠️ **重要**：密码中如果包含特殊字符（如 `@`），直接写原始字符，**不要** URL 编码。例如密码是 `RBAC Admin@2025`，就直接写 `POSTGRES_PASSWORD=RBAC Admin@2025`，不要写成 `RBAC Admin%402025`。

生成 JWT 密钥（二选一）：

```bash
# 方式一：使用 openssl
openssl rand -hex 32

# 方式二：使用 node（如果已安装）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 四、启动服务

### 方式一：使用管理脚本（推荐）

项目提供了 `monorepo.sh` 脚本，会自动生成更新日志数据：

```bash
cd /www/wwwroot/rbac-admin-pro

# 赋予执行权限
chmod +x monorepo.sh

# 交互式菜单
./monorepo.sh

# 或直接执行：构建并启动全部服务（选项 12）
./monorepo.sh --action 12
```

### 方式二：直接使用 docker compose

```bash
cd /www/wwwroot/rbac-admin-pro

# 首次启动（会自动构建镜像）
docker compose up -d

# 查看启动状态
docker compose ps

# 查看日志
docker compose logs -f
```

> 注意：直接使用 docker compose 不会更新提交记录，「更新日志」页面将使用仓库中已有的 `commits.json` 作为兜底数据。如需最新记录，可配置 GitHub API 或使用 `monorepo.sh` 部署。

首次启动需要构建镜像，可能需要 5-10 分钟，请耐心等待。

### 启动成功后的服务

| 服务 | 端口 | 说明 |
|------|------|------|
| web | 8080 | Vue 前端 |
| server | 3000 | NestJS 后端 |
| postgres | 5432 | PostgreSQL 数据库 |
| redis | 6379 | Redis 缓存 |

## 五、配置宝塔反向代理

### 5.1 添加反向代理

1. 进入宝塔面板「网站」→「反向代理」标签页
2. 点击「添加反代」
3. 填写配置：
   - **域名**：填写你的域名，如 `admin.example.com`（或 IP 地址）
   - **目标**：选择 `URL地址`，填写 `http://127.0.0.1:8080`
   - **发送域名(host)**：保持默认 `$http_host`
4. 点击「确定」

### 5.2 配置 SSL（可选）

添加反向代理后，点击域名进入设置：

1. 点击「SSL」标签
2. 选择「Let's Encrypt」
3. 勾选域名，点击申请
4. 开启「强制 HTTPS」

### 5.3 配置上传文件大小限制

1. 进入宝塔「软件商店」→「Nginx」→「设置」→「配置修改」
2. 在 `http {}` 块中添加或修改：

```nginx
client_max_body_size 100m;
```

3. 保存后重载 Nginx

> 默认限制较小，上传头像/附件时可能报 413 错误，建议设为 100m。

## 六、初始化数据库

> ✅ **自动初始化**：从 v2.x 版本开始，server 容器启动时会自动执行数据库迁移，首次部署还会自动导入种子数据，无需手动操作。

如果自动初始化失败，可以手动执行：

```bash
cd /www/wwwroot/rbac-admin-pro

# 执行数据库迁移
docker compose exec server npx prisma migrate deploy

# 导入种子数据
docker compose exec server npx prisma db seed
```

或使用管理脚本（选项 20）：

```bash
./monorepo.sh --action 20
```

如需完全重置数据库（⚠️ 会删除所有数据）：

```bash
docker compose exec server sh -c "npx prisma migrate reset --force && npx prisma db seed"

# 或使用管理脚本（选项 21）
./monorepo.sh --action 21
```

### 6.1 验证部署

初始化完成后，执行以下命令验证服务是否正常：

```bash
# 1. 检查所有容器状态（应显示 healthy 或 running）
docker compose ps

# 2. 检查后端健康状态
curl http://127.0.0.1:3000/api/health
# 预期返回: {"code":200,"msg":"success","data":{"status":"ok",...}}

# 3. 测试登录接口
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# 预期返回: {"code":200,"msg":"success","data":{"token":"..."}}

# 4. 检查前端是否可访问
curl -I http://127.0.0.1:8080
# 预期返回: HTTP/1.1 200 OK

# 5. 检查数据库连接
docker compose exec postgres psql -U rbac_admin -d rbac_admin -c "SELECT COUNT(*) FROM sys_user;"
# 预期返回用户数量
```

如果以上检查都通过，说明部署成功。

## 七、常用命令

### 服务管理

```bash
cd /www/wwwroot/rbac-admin-pro

# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 重启所有服务
docker compose restart

# 重启单个服务
docker compose restart server

# 查看服务状态
docker compose ps

# 查看所有日志
docker compose logs -f

# 查看单个服务日志
docker compose logs -f server
```

### 更新部署

**方式一：Git 拉取更新（推荐）**

```bash
cd /www/wwwroot/rbac-admin-pro

# 拉取最新代码
git pull origin main

# 重新构建并启动
docker compose up -d --build
```

**方式二：上传代码包更新**

1. 停止服务：`docker compose down`
2. 重命名旧目录：`mv rbac-admin-pro rbac-admin-pro-bak`
3. 上传新代码包到 `/www/wwwroot/` 并解压为 `rbac-admin-pro`
4. 从旧目录复制配置和数据：
```bash
cp rbac-admin-pro-bak/.env rbac-admin-pro/
cp -r rbac-admin-pro-bak/server-nestjs/uploads rbac-admin-pro/server-nestjs/
cp -r rbac-admin-pro-bak/server-nestjs/exports rbac-admin-pro/server-nestjs/
```
5. 启动服务：
```bash
cd /www/wwwroot/rbac-admin-pro
docker compose up -d --build
```
6. 确认服务正常后，删除旧目录：`rm -rf rbac-admin-pro-bak`

> ✅ **自动处理数据库变更**：容器启动时会自动检测并应用新的数据库迁移，现有数据不会丢失。只有首次部署（数据库为空）才会导入种子数据，后续更新不会重复导入。

### 完全重置部署

如需删除所有数据重新部署（⚠️ 会清空数据库）：

```bash
cd /www/wwwroot/rbac-admin-pro

# 拉取最新代码
git pull origin main

# 停止并删除容器和数据卷
docker compose down -v

# 重新构建并启动
docker compose up -d --build

# 查看状态
docker compose ps

# 清理旧镜像释放空间（可选）
docker image prune -f
```

### 进入容器调试

```bash
# 进入后端容器
docker compose exec server sh

# 进入数据库容器
docker compose exec postgres psql -U rbac_admin -d rbac_admin

# 进入 Redis 容器
docker compose exec redis redis-cli
```

### 清理资源

```bash
# 停止并删除容器（保留数据卷）
docker compose down

# 停止并删除容器和数据卷（⚠️ 会删除数据库数据）
docker compose down -v

# 清理未使用的镜像
docker image prune -f

# 清理所有未使用的资源
docker system prune -f
```

## 八、数据备份

### 8.1 手动备份数据库

```bash
# 备份到文件
docker compose exec postgres pg_dump -U rbac_admin rbac_admin > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
cat backup_xxx.sql | docker compose exec -T postgres psql -U rbac_admin -d rbac_admin
```

### 8.2 定时备份（宝塔计划任务）

在宝塔「计划任务」中添加 Shell 脚本：

```bash
#!/bin/bash
BACKUP_DIR=/www/backup/backupbee
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

cd /www/wwwroot/rbac-admin-pro
docker compose exec -T postgres pg_dump -U rbac_admin rbac_admin > $BACKUP_DIR/db_$DATE.sql

# 保留最近 7 天的备份
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

设置每天凌晨 3 点执行。

## 九、防火墙配置

在宝塔「安全」中放行端口：

| 端口 | 用途 | 是否公开 |
|------|------|----------|
| 80 | HTTP | ✓ |
| 443 | HTTPS | ✓ |
| 8080 | Docker Web | ✗（仅本地） |
| 3000 | Docker Server | ✗（仅本地） |
| 5432 | PostgreSQL | ✗ |
| 6379 | Redis | ✗ |

> 注意：8080、3000、5432、6379 端口不需要对外开放，Nginx 反代会通过本地访问。

## 十、常见问题

### Q1: 构建镜像失败

```bash
# 查看详细错误
docker compose build --no-cache

# 检查网络（可能需要配置镜像加速）
```

配置 Docker 镜像加速（如果网络慢）：

```bash
# 编辑 Docker 配置
vi /etc/docker/daemon.json
```

```json
{
  "registry-mirrors": [
    "https://docker.rainbond.cc",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ]
}
```

> 镜像加速源可能会失效，如遇问题可搜索「Docker 国内镜像源」获取最新可用地址。

```bash
# 重启 Docker
systemctl restart docker
```

### Q2: 容器启动后立即退出

```bash
# 查看容器日志
docker compose logs server

# 常见原因：
# 1. 数据库连接失败 - 等待 postgres 完全启动
# 2. 环境变量未配置 - 检查 .env 文件
```

### Q3: 访问 502 Bad Gateway

```bash
# 检查容器是否运行
docker compose ps

# 检查后端健康状态
curl http://127.0.0.1:3000/health

# 查看后端日志
docker compose logs server
```

### Q4: 数据库连接失败

```bash
# 检查 postgres 容器状态
docker compose ps postgres

# 查看 postgres 日志
docker compose logs postgres

# 测试连接
docker compose exec postgres psql -U rbac_admin -d rbac_admin -c "SELECT 1"
```

### Q5: 磁盘空间不足

```bash
# 查看 Docker 占用空间
docker system df

# 清理未使用的资源
docker system prune -a

# 清理构建缓存
docker builder prune
```

### Q6: Docker 网络创建失败（CentOS 7）

```
failed to create network: Error response from daemon: Failed to Setup IP tables
```

**解决**：重启 Docker 服务

```bash
systemctl restart docker
docker compose up -d
```

### Q7: 容器间网络不通

```bash
# 测试 server 容器能否访问 postgres
docker compose exec server sh -c "nc -zv postgres 5432"

# 如果显示 "Host is unreachable"，重启所有容器
docker compose down
systemctl restart docker
docker compose up -d
```

### Q8: Prisma 数据库认证失败

```
Error: P1000: Authentication failed against database server
```

**原因**：`.env` 中的密码可能被错误地 URL 编码了

**解决**：检查 `.env` 文件，确保密码是原始字符，不是编码后的。如果已经启动过，需要重建数据库：

```bash
docker compose down -v
docker compose up -d
```

## 十一、安全建议

1. 部署后立即修改 admin 密码（默认 `admin` / `admin123`）
2. 启用 HTTPS
3. 不要对外开放数据库和 Redis 端口
4. 定期备份数据库
5. 定期更新 Docker 镜像

---

## 快速检查清单

- [ ] Docker 和 Docker Compose 已安装
- [ ] 项目代码已上传到 `/www/wwwroot/rbac-admin-pro`
- [ ] `.env` 文件已配置（数据库密码、JWT 密钥）
- [ ] `docker compose up -d` 执行成功
- [ ] `docker compose ps` 显示所有服务 healthy
- [ ] 宝塔网站已创建并配置反向代理
- [ ] SSL 证书已配置
- [ ] 可正常访问管理后台
- [ ] 已修改默认管理员密码

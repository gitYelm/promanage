# Docker 持久化存储方案

本文档介绍 Docker 的两种持久化存储方案及其在本项目中的应用。

## 存储方案概述

Docker 提供了两种主要的持久存储方案：**绑定挂载（Bind Mount）** 和 **命名卷（Named Volume）**。

### 命名卷（Named Volume）

由 Docker 引擎管理的存储区域，数据存储在 Docker 的内部目录中。

```yaml
# 语法：卷名:容器路径
volumes:
  - postgres_data:/var/lib/postgresql/data
```

**特点：**
| 优势 | 劣势 |
|------|------|
| 性能优异（macOS/Windows 快 2-5 倍） | 不可见于项目目录 |
| Docker 统一管理 | 不便于直接编辑 |
| 权限自动处理 | 需要 `docker cp` 访问文件 |
| 便于迁移和备份 | |
| 容器删除后数据保留 | |

**存储位置：**
- Linux: `/var/lib/docker/volumes/<卷名>/_data`
- macOS/Windows: Docker Desktop 虚拟机内部

**适用场景：** 数据库、缓存、日志等不需要直接编辑的数据

### 绑定挂载（Bind Mount）

将宿主机的目录直接映射到容器内。

```yaml
# 语法：宿主机路径:容器路径
volumes:
  - ./server-nestjs/uploads:/app/uploads
```

**特点：**
| 优势 | 劣势 |
|------|------|
| 直接可见于项目目录 | macOS/Windows 性能较差 |
| 便于开发调试 | Linux 需处理权限问题 |
| 备份简单（直接复制） | 路径依赖宿主机结构 |
| 可纳入版本控制 | |

**适用场景：** 上传文件、导出文件、配置文件、开发环境源码

### 对比总结

| 特性 | 命名卷 | 绑定挂载 |
|------|--------|----------|
| 语法 | `volume_name:/path` | `./host/path:/path` |
| I/O 性能 | 优秀 | macOS/Windows 较差 |
| 可见于项目目录 | ❌ | ✅ |
| 权限处理 | 自动 | 需手动 |
| 迁移便利性 | 高 | 低 |

### 如何选择？

```
需要直接在宿主机访问/编辑文件？
├── 是 → Bind Mount
└── 否 → Named Volume（推荐）
```

## 本项目配置

### 命名卷

| 卷名 | 容器路径 | 用途 | 删除影响 |
|------|----------|------|----------|
| `postgres_data` | `/var/lib/postgresql/data` | 数据库文件 | 所有业务数据丢失 |
| `redis_data` | `/data` | 缓存数据 | 会话状态丢失 |
| `server_logs` | `/app/logs` | 应用日志 | 历史日志丢失 |

### 绑定挂载

| 宿主机路径 | 容器路径 | 用途 |
|------------|----------|------|
| `./server-nestjs/uploads` | `/app/uploads` | 上传文件（头像、图片） |
| `./server-nestjs/exports` | `/app/exports` | 导出文件（Excel、CSV） |

### 设计原则

- **数据库/Redis** → 命名卷（性能关键，无需直接编辑）
- **日志** → 命名卷（写入频繁，可通过 `docker logs` 查看）
- **上传/导出文件** → 绑定挂载（需直接访问或 Nginx 静态服务）

## 常用命令

### 卷管理

```bash
# 查看所有卷
docker volume ls

# 查看项目相关卷
docker volume ls | grep rbac

# 查看卷详情
docker volume inspect rbac-admin-pro_postgres_data

# 查看磁盘占用
docker system df -v
```

### 服务管理

```bash
# 停止服务（保留数据）
docker compose down

# 停止服务并删除所有卷（慎用！）
docker compose down -v

# 删除单个卷
docker compose down
docker volume rm rbac-admin-pro_server_logs
docker compose up -d
```

### 清理

```bash
# 清理未使用的卷（谨慎）
docker volume prune

# 清理所有未使用资源
docker system prune -a --volumes
```

## 日志查看

### 方式一：Docker 日志（推荐）

```bash
# 实时查看
docker logs -f rbac-server

# 最近 100 行
docker logs --tail 100 rbac-server

# 带时间戳
docker logs -t rbac-server
```

### 方式二：容器内日志文件

```bash
# 直接查看
docker exec rbac-server cat /app/logs/application-2026-01-16.log

# 实时跟踪
docker exec rbac-server tail -f /app/logs/error-2026-01-16.log
```

### 方式三：复制到宿主机

```bash
docker cp rbac-server:/app/logs ./docker-logs
```

## 数据备份与恢复

### PostgreSQL

```bash
# 备份
docker exec rbac-postgres pg_dump -U rbac_admin rbac_admin_pro > backup_$(date +%Y%m%d).sql

# 恢复
docker exec -i rbac-postgres psql -U rbac_admin rbac_admin_pro < backup.sql
```

### Redis

```bash
# 触发快照
docker exec rbac-redis redis-cli BGSAVE

# 复制 RDB 文件
docker cp rbac-redis:/data/dump.rdb ./redis-backup.rdb
```

### 通用卷备份

```bash
# 备份
docker run --rm \
  -v rbac-admin-pro_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar cvf /backup/postgres_backup.tar /data

# 恢复
docker run --rm \
  -v rbac-admin-pro_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xvf /backup/postgres_backup.tar -C /
```

### 迁移到其他服务器

```bash
# 1. 源服务器备份
docker exec rbac-postgres pg_dump -U rbac_admin rbac_admin_pro > backup.sql

# 2. 传输
scp backup.sql user@target-server:/path/

# 3. 目标服务器恢复
docker exec -i rbac-postgres psql -U rbac_admin rbac_admin_pro < backup.sql
```

## 完全重置

```bash
# 停止并删除所有容器和卷
docker compose down -v

# 重新启动（自动初始化）
docker compose up -d

# 确认启动成功
docker logs -f rbac-server
```

## 常见问题

### 容器重启后数据还在吗？

**在**。只要不删除卷：
- `docker compose restart` → 保留
- `docker compose down` → 保留
- `docker compose down -v` → **删除**

### macOS 性能优化

根据 [2025 年测试数据](https://www.paolomainardi.com/posts/docker-performance-macos-2025/)，Bind Mount 比 Named Volume 慢约 **3 倍**。

优化方案：
```yaml
volumes:
  # cached: 容器读取优先
  - ./uploads:/app/uploads:cached
  # delegated: 容器写入优先
  - ./logs:/app/logs:delegated
```

或改用命名卷获得更好性能。

### Linux 权限问题

```bash
# 修改目录所有者（推荐）
sudo chown -R 1000:1000 ./uploads

# 或在 docker-compose.yml 指定用户
services:
  server:
    user: "${UID}:${GID}"
```

### 性能基准数据

Linux 上 Named Volume vs Bind Mount（[来源](https://www.codegenes.net/blog/docker-bind-mount-directory-vs-named-volume-performance-comparison/)）：

| 数据库 | 吞吐量提升 | 延迟降低 |
|--------|-----------|----------|
| MySQL | +19.6% | -17% |
| Elasticsearch | +19.6% | -19% |
| MongoDB | +19% | -20% |

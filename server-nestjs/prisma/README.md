# Prisma 目录结构说明

```
prisma/
├── schema.prisma                    # 数据库模型定义（核心文件）
├── seed.ts                          # 种子数据脚本
├── README.md                        # 本文档
└── migrations/                      # 迁移历史目录
    ├── migration_lock.toml          # 迁移锁文件
    ├── 0_init/                      # 初始化迁移
    │   └── migration.sql            # 建表 SQL
    └── 1_add_table_comments/        # 添加注释迁移
        └── migration.sql            # 注释 SQL
```

## 文件关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        schema.prisma                            │
│                    （数据库模型定义源）                           │
│         定义所有表结构、字段、索引、关联关系                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────────┐ ┌───────────┐ ┌─────────────────┐
│   migrations/   │ │  seed.ts  │ │ Prisma Client   │
│   迁移文件目录   │ │  种子数据  │ │  (自动生成)     │
└────────┬────────┘ └─────┬─────┘ └─────────────────┘
         │                │
         │                │ npx prisma db seed
         │                ▼
         │         ┌─────────────────┐
         │         │   PostgreSQL    │
         │         │     数据库       │
         │         └─────────────────┘
         │                ▲
         │                │ npx prisma migrate
         └────────────────┘
```

## 为什么需要 schema.prisma 和 migration.sql 两个文件？

### 核心区别

| | schema.prisma | migration.sql |
|---|---|---|
| **是什么** | 模型定义（声明式） | SQL 执行脚本（命令式） |
| **作用** | 描述"数据库应该长什么样" | 记录"如何一步步变成这样" |
| **格式** | Prisma DSL | 原生 SQL |
| **可执行** | ❌ 不能直接执行 | ✅ 可直接在数据库执行 |

### 为什么需要 migration.sql？

**1. 版本控制与团队协作**
```
开发者A修改了 schema.prisma
    ↓
生成 migration_20241209_add_field.sql
    ↓
提交到 Git
    ↓
开发者B 拉取代码后执行 prisma migrate deploy
    ↓
B 的数据库自动同步变更
```

**2. 增量变更，保留数据**
```
schema.prisma 只描述最终状态，不知道：
- 旧表叫什么名字？
- 字段是新增还是重命名？
- 数据如何迁移？

migration.sql 明确记录每一步操作：
- ALTER TABLE ... ADD COLUMN
- ALTER TABLE ... RENAME COLUMN  
- UPDATE ... SET ...
```

**3. 生产环境安全**
```bash
# 开发环境：可以重建
npx prisma migrate reset  # 删库重建

# 生产环境：只能增量
npx prisma migrate deploy  # 只执行新的 migration.sql
```

### 简单类比

- `schema.prisma` = 建筑设计图（最终效果）
- `migration.sql` = 施工日志（每天干了什么）

设计图告诉你房子最终长什么样，但施工队需要日志知道：先打地基、再砌墙、最后装修。

---

## 各文件详细说明

### 1. schema.prisma（核心）

**作用**：定义数据库模型的唯一真实来源（Single Source of Truth）

**内容**：
- `generator`：配置 Prisma Client 生成器
- `datasource`：数据库连接配置
- `model`：表结构定义（字段、类型、默认值、注释）
- `@@index`：索引定义
- `@@unique`：唯一约束
- `@relation`：表关联关系

**示例**：
```prisma
model SysUser {
  userId   BigInt  @id @default(autoincrement()) @map("user_id")
  userName String  @map("user_name") @db.VarChar(30)
  // ...
  @@map("sys_user")  // 映射到数据库表名
}
```

### 2. seed.ts

**作用**：初始化数据库的种子数据

**执行时机**：
- `npx prisma migrate reset` 后自动执行
- `npx prisma db seed` 手动执行

**内容**：
- 部门层级数据（9个）
- 角色数据（4个）
- 用户数据（4个）
- 菜单权限数据
- 字典类型和数据
- 系统配置参数
- 示例公告、任务等

### 3. migrations/ 目录

**作用**：记录数据库结构变更历史，支持版本控制和团队协作

#### migration_lock.toml
锁定数据库提供者，防止跨数据库迁移冲突：
```toml
provider = "postgresql"
```

#### 0_init/migration.sql
初始化迁移，包含：
- 所有表的 CREATE TABLE 语句
- 外键约束 (AddForeignKey)
- 索引定义 (CREATE INDEX)

#### 1_add_table_comments/migration.sql
添加数据库注释：
- 表注释 (COMMENT ON TABLE)
- 字段注释 (COMMENT ON COLUMN)
- 索引注释 (COMMENT ON INDEX)

## 常用命令

| 命令 | 说明 |
|------|------|
| `npx prisma generate` | 根据 schema 生成 Prisma Client |
| `npx prisma migrate dev` | 创建并应用新迁移（开发环境） |
| `npx prisma migrate reset` | 重置数据库并重新应用所有迁移 + seed |
| `npx prisma db seed` | 仅执行种子脚本 |
| `npx prisma studio` | 打开数据库 GUI |
| `npx prisma db push` | 直接推送 schema 到数据库（不创建迁移） |

## 工作流程

### 开发新功能（需要修改表结构）

1. 修改 `schema.prisma`
2. 运行 `npx prisma migrate dev --name <迁移名称>`
3. Prisma 自动生成新的迁移文件
4. 更新 `seed.ts`（如需要）
5. 提交所有变更到 Git

### 重置开发数据库

```bash
npx prisma migrate reset --force
```
此命令会：
1. 删除所有表
2. 按顺序执行所有迁移
3. 执行 seed.ts

### 同步到生产环境

```bash
npx prisma migrate deploy
```
仅应用未执行的迁移，不会重置数据。

## 数据库管理说明

Prisma 是本项目数据库的唯一数据源 (Single Source of Truth)：

- **表结构**: `schema.prisma` 定义所有模型
- **迁移**: `migrations/` 记录变更历史
- **种子数据**: `seed.ts` 初始化数据

如需导出纯 SQL，可使用：
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql
```

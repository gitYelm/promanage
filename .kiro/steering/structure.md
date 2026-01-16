# 项目结构

```
rbac-admin-pro/
├── web/                          # 前端 Vue 3
│   └── src/
│       ├── api/                  # API 模块
│       │   ├── system/           # 系统管理 API
│       │   └── monitor/          # 监控模块 API
│       ├── assets/               # 静态资源 (图片、字体等)
│       ├── components/
│       │   ├── ui/               # shadcn-vue 基础组件
│       │   ├── common/           # 通用组件 (ImageUpload, TablePagination...)
│       │   └── business/         # 业务组件 (UserForm, DeptTreeSelect...)
│       ├── composables/          # Vue 组合式函数 (useXxx)
│       ├── views/                # 页面视图
│       │   ├── system/           # 系统管理页面
│       │   ├── monitor/          # 监控页面
│       │   └── tool/             # 工具页面
│       ├── stores/modules/       # Pinia stores
│       ├── router/               # 路由配置
│       ├── utils/                # 工具函数 (request, auth, format...)
│       ├── lib/                  # 第三方库封装 (shadcn-vue utils)
│       ├── types/                # TypeScript 类型
│       ├── directive/            # Vue 指令 (权限指令)
│       └── layout/               # 布局组件
│
├── server-nestjs/                # 后端 NestJS
│   ├── src/
│   │   ├── auth/                 # 认证模块 (JWT, 2FA, 验证码)
│   │   ├── system/               # 系统管理
│   │   │   ├── user/             # 用户管理
│   │   │   ├── role/             # 角色管理
│   │   │   ├── dept/             # 部门管理
│   │   │   ├── menu/             # 菜单管理
│   │   │   ├── dict/             # 字典管理
│   │   │   ├── config/           # 参数配置
│   │   │   ├── post/             # 岗位管理
│   │   │   └── notice/           # 通知公告
│   │   ├── monitor/              # 监控模块
│   │   │   ├── operlog/          # 操作日志
│   │   │   ├── logininfor/       # 登录日志
│   │   │   ├── online/           # 在线用户
│   │   │   ├── server/           # 服务器监控
│   │   │   ├── cache/            # 缓存监控
│   │   │   └── job/              # 定时任务
│   │   ├── common/               # 公共模块
│   │   │   ├── decorators/       # 装饰器 (@Log, @RequirePermission)
│   │   │   ├── enums/            # 枚举 (错误码)
│   │   │   ├── exceptions/       # 业务异常
│   │   │   ├── filters/          # 异常过滤器
│   │   │   ├── guards/           # 守卫 (权限)
│   │   │   ├── interceptors/     # 拦截器 (日志, 响应转换)
│   │   │   ├── logger/           # Winston 日志
│   │   │   ├── mail/             # 邮件服务
│   │   │   ├── upload/           # 文件上传
│   │   │   └── utils/            # 工具函数
│   │   ├── prisma/               # Prisma 服务
│   │   └── redis/                # Redis 服务
│   └── prisma/
│       ├── schema.prisma         # 数据库 Schema (唯一数据源)
│       ├── migrations/           # 迁移文件
│       └── seed.ts               # 种子数据 (幂等初始化)
│
├── docs/                         # 项目文档 (中文)
└── docker-compose.yml            # PostgreSQL + Redis
```

## 后端模块结构
```
module-name/
├── dto/
│   ├── create-xxx.dto.ts         # 创建 DTO
│   ├── update-xxx.dto.ts         # 更新 DTO
│   └── query-xxx.dto.ts          # 查询 DTO (分页/筛选)
├── xxx.controller.ts             # 控制器
├── xxx.service.ts                # 服务层
└── xxx.module.ts                 # 模块定义
```

## 前端页面结构
```
views/{domain}/
├── index.vue                     # 主页面 (列表 + 操作)
└── components/                   # 页面私有组件 (可选)
```

## 数据库命名规范
- 表名：`sys_` 前缀，snake_case
- 字段：snake_case
- Prisma Model：PascalCase (如 SysUser)
- 主键：`{entity}_id` (如 user_id, role_id)

### 核心表
| 表名 | 说明 |
|------|------|
| sys_user | 用户信息 |
| sys_role | 角色信息 |
| sys_dept | 部门信息 |
| sys_menu | 菜单权限 |
| sys_post | 岗位信息 |
| sys_dict_type | 字典类型 |
| sys_dict_data | 字典数据 |
| sys_config | 参数配置 |
| sys_notice | 通知公告 |

### 关联表
| 表名 | 说明 |
|------|------|
| sys_user_role | 用户-角色 |
| sys_user_post | 用户-岗位 |
| sys_role_menu | 角色-菜单 |
| sys_role_dept | 角色-部门 (数据权限) |

### 日志表
| 表名 | 说明 |
|------|------|
| sys_oper_log | 操作日志 |
| sys_login_log | 登录日志 |
| sys_job | 定时任务 |
| sys_job_log | 任务执行日志 |

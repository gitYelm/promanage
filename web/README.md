# RBAC Admin Pro - Frontend (Web)

基于 Vue 3 + TypeScript + Shadcn-Vue 的现代化后台管理前端。

## 技术栈

- **框架**: Vue 3.5 + Composition API (`<script setup lang="ts">`)
- **构建**: Vite 7
- **语言**: TypeScript 5.9
- **UI 组件**: Shadcn-Vue 2 (Radix Vue + Reka UI)
- **样式**: Tailwind CSS 3
- **状态管理**: Pinia 3
- **路由**: Vue Router 4
- **HTTP**: Axios
- **表单验证**: VeeValidate + Zod
- **图标**: Lucide Vue Next
- **富文本**: Tiptap
- **工具库**: VueUse

## 功能特性

- **权限控制**: 页面级路由守卫 + 按钮级指令 (`v-hasPermi`) + 动态路由
- **主题系统**: 多主题色切换 + 深色模式 + 圆角定制 + 持久化
- **响应式布局**: 适配移动端与桌面端
- **丰富组件**: 集成 45+ Shadcn-Vue 组件

## 开发指南

### 环境要求
Node.js >= 18

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:5173

### 常用命令
```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run type-check   # TypeScript 检查
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
```

## 目录结构

```
src/
├── api/                 # API 接口
│   ├── system/          # 系统管理 API
│   ├── monitor/         # 监控模块 API
│   └── tool/            # 工具模块 API
├── components/
│   ├── ui/              # Shadcn-Vue 组件 (45+)
│   ├── common/          # 通用组件
│   │   ├── IconPicker.vue
│   │   ├── ImageUpload.vue
│   │   ├── PasswordInput.vue
│   │   ├── RichTextEditor.vue
│   │   └── TablePagination.vue
│   └── business/        # 业务组件
│       ├── DeptTreeSelect.vue
│       ├── UserDetailDialog.vue
│       └── UserForm.vue
├── directive/           # 自定义指令 (权限等)
├── layout/              # 布局组件
├── lib/                 # 工具库
├── router/              # 路由配置
├── stores/modules/      # Pinia 状态
│   ├── app.ts           # 应用状态
│   ├── user.ts          # 用户状态
│   ├── menu.ts          # 菜单状态
│   └── permission.ts    # 权限状态
├── types/               # TypeScript 类型
├── utils/               # 工具函数
│   ├── request.ts       # Axios 封装
│   ├── auth.ts          # 认证工具
│   ├── format.ts        # 格式化工具
│   └── error-handler.ts # 错误处理
├── views/               # 页面视图
│   ├── dashboard/       # 首页
│   ├── system/          # 系统管理
│   ├── monitor/         # 系统监控
│   ├── tool/            # 系统工具
│   ├── login/           # 登录页
│   └── error/           # 错误页
└── permission.ts        # 路由权限控制
```

## 后端接口

项目已对接 NestJS 后端服务，API 基础路径配置在 `src/utils/request.ts`。

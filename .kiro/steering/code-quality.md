# 代码质量规范

## 修改代码后必须执行

每次修改 TypeScript、Vue、JavaScript 文件后，**必须**执行以下步骤：

### 1. ESLint 检查与自动修复

```bash
# 前端代码 (web/)
cd web && pnpm lint

# 后端代码 (server-nestjs/)
cd server-nestjs && pnpm lint

# 或在根目录执行全部检查
pnpm lint
```

> 注：前后端 lint 命令已内置 `--fix`，无需额外添加

### 2. 类型检查

```bash
# 前端
cd web && pnpm type-check

# 后端
cd server-nestjs && pnpm check
```

## 格式化规范

项目使用 Prettier 统一代码格式，关键配置：

- **无分号** (`semi: false`)
- **单引号** (`singleQuote: true`)
- **行宽 100** (`printWidth: 100`)
- **2 空格缩进** (`tabWidth: 2`)
- **尾随逗号** (`trailingComma: all`)
- **自动换行符** (`endOfLine: auto`)
- **箭头函数始终加括号** (`arrowParens: always`)

## 常见 ESLint 错误处理

| 错误类型 | 解决方案 |
|---------|---------|
| `prettier/prettier` | 运行 `pnpm lint` 自动修复 |
| `@typescript-eslint/no-unused-vars` | 删除未使用变量或添加 `_` 前缀 |
| `vue/html-self-closing` | 使用自闭合标签 `<Component />` |
| `@typescript-eslint/no-explicit-any` | 定义具体类型替代 any |

## 提交前检查清单

1. ✅ `pnpm lint` 无错误
2. ✅ `pnpm type-check` 通过 (前端)
3. ✅ `pnpm check` 通过 (后端)
4. ✅ 功能测试正常

## 代码风格约定

### Vue 组件
- 使用 `<script setup lang="ts">` 语法
- Props 使用 `defineProps<T>()` 泛型定义
- Emits 使用 `defineEmits<T>()` 泛型定义
- 组件名使用 PascalCase

### TypeScript
- 优先使用 `interface` 定义对象类型
- 避免使用 `any`，必要时使用 `unknown`
- 导出类型使用 `export type`

# 代码质量规范

## 修改代码后必须执行

每次修改 TypeScript、Vue、JavaScript 文件后，**必须**执行以下步骤：

### 1. ESLint 检查与自动修复

```bash
# 前端代码 (web/)
cd web && pnpm lint --fix

# 后端代码 (server-nestjs/)
cd server-nestjs && pnpm lint --fix

# 或在根目录执行全部检查
pnpm lint --fix
```

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

## 常见 ESLint 错误处理

| 错误类型 | 解决方案 |
|---------|---------|
| `prettier/prettier` | 运行 `pnpm lint --fix` 自动修复 |
| `@typescript-eslint/no-unused-vars` | 删除未使用变量或添加 `_` 前缀 |
| `vue/html-self-closing` | 使用自闭合标签 `<Component />` |

## 提交前检查清单

1. ✅ `pnpm lint --fix` 无错误
2. ✅ `pnpm type-check` 通过 (前端)
3. ✅ `pnpm check` 通过 (后端)
4. ✅ 功能测试正常

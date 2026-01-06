# ESLint 配置指南

## 本次问题分析

### 问题现象

修改代码后频繁出现 `prettier/prettier` 错误，特别是：
- `Delete ','` - 要求删除尾随逗号
- `Insert ';'` - 要求添加分号
- 空格、缩进相关的格式错误

### 根本原因

**ESLint 中的 Prettier 规则配置与 `.prettierrc.json` 文件配置不一致。**

```javascript
// ❌ 之前的配置 - 只设置了 endOfLine
rules: {
  'prettier/prettier': [
    'error',
    {
      endOfLine: 'auto',
    },
  ],
}
```

当 ESLint 运行时，`prettier/prettier` 规则会使用**内联配置**而非 `.prettierrc.json`，导致：
- 内联配置默认 `trailingComma: 'es5'`（ES5 兼容，对象/数组末尾不加逗号）
- `.prettierrc.json` 设置 `trailingComma: 'all'`（所有地方都加逗号）
- 两者冲突，ESLint 报错

### 解决方案

**方案一：内联完整配置（本项目采用）**

```javascript
// ✅ 修复后的配置 - 完整指定所有选项
rules: {
  'prettier/prettier': [
    'error',
    {
      semi: false,
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      trailingComma: 'all',
      bracketSpacing: true,
      arrowParens: 'always',
      endOfLine: 'auto',
    },
  ],
}
```

**方案二：让 ESLint 读取 Prettier 配置文件**

```javascript
// 使用空对象，让 Prettier 自动读取配置文件
rules: {
  'prettier/prettier': ['error', {}],
}
```

或者完全不传第二个参数：

```javascript
rules: {
  'prettier/prettier': 'error',
}
```

---

## ESLint 基础概念

### 什么是 ESLint？

ESLint 是 JavaScript/TypeScript 的静态代码分析工具，用于：
- 发现代码问题（语法错误、潜在 bug）
- 强制代码风格一致性
- 自动修复部分问题

### 配置文件格式

ESLint 9.x 使用 **Flat Config**（扁平配置），文件名为 `eslint.config.js`：

```javascript
export default [
  // 配置对象数组，按顺序合并
  { /* 配置1 */ },
  { /* 配置2 */ },
]
```

### 配置对象结构

```javascript
{
  // 1. 文件匹配
  files: ['**/*.ts', '**/*.vue'],  // 应用于哪些文件
  ignores: ['dist/**'],            // 忽略哪些文件

  // 2. 语言选项
  languageOptions: {
    parser: parserTypeScript,      // 解析器
    parserOptions: { /* ... */ },  // 解析器选项
    globals: { /* ... */ },        // 全局变量
  },

  // 3. 插件
  plugins: {
    '@typescript-eslint': pluginTypeScript,
  },

  // 4. 规则
  rules: {
    'rule-name': 'off' | 'warn' | 'error',
    'rule-name': ['error', { /* 选项 */ }],
  },
}
```

---

## ESLint + Prettier 集成

### 为什么需要集成？

| 工具 | 职责 |
|------|------|
| ESLint | 代码质量（未使用变量、潜在错误） |
| Prettier | 代码格式（缩进、引号、分号） |

两者职责有重叠，需要协调：

### 集成方式

```javascript
import configPrettier from 'eslint-config-prettier'    // 关闭冲突规则
import pluginPrettier from 'eslint-plugin-prettier'    // 将 Prettier 作为 ESLint 规则

export default [
  // ... 其他配置

  // 1. 关闭 ESLint 中与 Prettier 冲突的规则
  configPrettier,

  // 2. 将 Prettier 作为 ESLint 规则运行
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
]
```

### 配置优先级

`prettier/prettier` 规则的配置来源优先级：

1. **ESLint 规则内联配置**（最高优先级）
   ```javascript
   'prettier/prettier': ['error', { semi: false }]
   ```

2. **.prettierrc.json 文件**
   ```json
   { "semi": false }
   ```

3. **Prettier 默认值**（最低优先级）
   ```
   semi: true, singleQuote: false, ...
   ```

**关键点：** 如果内联配置只写了部分选项，其他选项会用 Prettier 默认值，而不是 `.prettierrc.json` 的值！

---

## 本项目 ESLint 配置解析

### 前端 (web/eslint.config.js)

```javascript
export default [
  // 1. 全局忽略
  {
    ignores: ['node_modules/**', 'dist/**'],
  },

  // 2. JS 基础规则
  js.configs.recommended,

  // 3. Vue 推荐规则
  ...pluginVue.configs['flat/recommended'],

  // 4. 全局变量定义
  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        // ...
      },
    },
  },

  // 5. TypeScript 文件配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parserTypeScript,
    },
    plugins: {
      '@typescript-eslint': pluginTypeScript,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
      }],
    },
  },

  // 6. Vue 文件配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: parserTypeScript,  // Vue 内部的 TS 解析
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': ['error', { /* ... */ }],
    },
  },

  // 7. Prettier 集成
  configPrettier,
  {
    plugins: { prettier: pluginPrettier },
    rules: {
      'prettier/prettier': ['error', {
        semi: false,
        singleQuote: true,
        // ... 完整配置
      }],
    },
  },
]
```

### 后端 (server-nestjs/eslint.config.mjs)

```javascript
export default tseslint.config(
  // 1. 忽略文件
  { ignores: ['dist/**'] },

  // 2. 基础规则
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // 3. Prettier 集成
  eslintPluginPrettierRecommended,

  // 4. 自定义规则
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
      }],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
)
```

---

## 常见问题排查

### 1. prettier/prettier 错误

**症状：** `Delete ','`、`Insert ';'`、空格错误

**原因：** ESLint Prettier 配置与 `.prettierrc.json` 不一致

**解决：**
```javascript
// 确保内联配置完整，或使用空对象让 Prettier 读取配置文件
'prettier/prettier': ['error', {}]
```

### 2. no-unused-vars 误报

**症状：** 明明用了的变量报未使用

**原因：** 使用了 JS 规则而非 TS 规则

**解决：**
```javascript
{
  rules: {
    'no-unused-vars': 'off',  // 关闭 JS 规则
    '@typescript-eslint/no-unused-vars': 'error',  // 使用 TS 规则
  },
}
```

### 3. Vue 文件解析错误

**症状：** `Parsing error: Unexpected token <`

**原因：** 没有使用 Vue 解析器

**解决：**
```javascript
// 确保引入了 Vue 插件配置
...pluginVue.configs['flat/recommended']
```

### 4. 全局变量未定义

**症状：** `'window' is not defined`

**原因：** 没有声明全局变量

**解决：**
```javascript
{
  languageOptions: {
    globals: {
      window: 'readonly',
    },
  },
}
```

---

## 最佳实践

### 1. 保持配置一致性

- 前后端使用相同的 Prettier 配置
- 根目录放置统一的 `.prettierrc.json` 和 `.editorconfig`

### 2. 使用 --fix 自动修复

```bash
pnpm lint --fix
```

### 3. 编辑器集成

VSCode 设置：
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### 4. Git Hooks

使用 husky + lint-staged 在提交前自动检查：
```json
{
  "lint-staged": {
    "*.{ts,vue}": ["eslint --fix"]
  }
}
```

---

## 参考资料

- [ESLint 官方文档](https://eslint.org/docs/latest/)
- [Prettier 官方文档](https://prettier.io/docs/en/)
- [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier)
- [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier)
- [typescript-eslint](https://typescript-eslint.io/)

# ============================================================================
# RBAC Admin Pro - 后端 Dockerfile
# ============================================================================

FROM node:20-alpine

# 安装必要的构建工具和 pnpm
RUN apk add --no-cache python3 make g++ tzdata && \
    corepack enable && corepack prepare pnpm@latest --activate

# 设置时区
ENV TZ=Asia/Shanghai

# 设置工作目录
WORKDIR /app

# 强制刷新缓存 - 更新此值可触发重新构建
ENV CACHE_BUST=20251210_v3

# 复制 package 文件
COPY package.json ./
COPY prisma ./prisma/

# 安装所有依赖（shamefully-hoist=true 会提升依赖到根目录）
RUN pnpm install

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN DATABASE_URL="postgresql://temp:temp@localhost:5432/temp" pnpm prisma generate

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动应用（注意：构建产物在 dist/src/ 目录下）
CMD ["node", "dist/src/main.js"]

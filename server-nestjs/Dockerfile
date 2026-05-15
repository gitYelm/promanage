# ============================================================================
# RBAC Admin Pro - 后端 Dockerfile
# ============================================================================

FROM node:22-alpine

# 安装必要的构建工具和 pnpm
RUN apk add --no-cache python3 make g++ tzdata && \
    corepack enable && corepack prepare pnpm@10.31.0 --activate

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

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 3000

# 使用启动脚本（自动执行迁移和种子数据）
ENTRYPOINT ["/docker-entrypoint.sh"]

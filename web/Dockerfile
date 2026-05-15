# ============================================================================
# RBAC Admin Pro - 前端 Dockerfile (多阶段构建)
# ============================================================================

# ==================== 构建阶段 ====================
FROM node:22-alpine AS builder

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@10.31.0 --activate

# 设置工作目录
WORKDIR /app

# 复制 package 文件（monorepo 的 lock 文件在根目录，这里不使用）
COPY package.json ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# ==================== 生产阶段 ====================
FROM nginx:alpine

# 安装 tzdata 用于时区设置
RUN apk add --no-cache tzdata

# 设置时区为上海
ENV TZ=Asia/Shanghai

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置（使用默认配置，适用于 Docker Compose 部署）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

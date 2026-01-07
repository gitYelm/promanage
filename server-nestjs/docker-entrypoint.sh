#!/bin/sh
set -e

echo "🚀 RBAC Admin Pro 后端启动中..."

# 等待数据库就绪（虽然 depends_on 有 healthcheck，但多等一下更稳妥）
echo "⏳ 等待数据库连接..."
sleep 2

# 执行数据库迁移
echo "📦 执行数据库迁移..."
npx prisma migrate deploy

# 检查是否需要初始化种子数据（通过检查 sys_user 表是否有数据）
USER_COUNT=$(echo "SELECT COUNT(*) FROM sys_user;" | npx prisma db execute --stdin 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  echo "🌱 首次部署，导入种子数据..."
  npx prisma db seed
else
  echo "✅ 数据库已有数据，跳过种子数据导入"
fi

echo "🎉 数据库准备完成，启动应用..."

# 启动应用
exec node dist/src/main.js

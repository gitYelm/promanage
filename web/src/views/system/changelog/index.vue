<script setup lang="ts">
import { Card, CardHeader, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Bug, Palette, RefreshCw, Rocket, FileText } from 'lucide-vue-next'

interface ChangeItem {
  type: 'feat' | 'fix' | 'style' | 'refactor' | 'perf' | 'docs'
  content: string
}

interface ChangelogEntry {
  version: string
  date: string
  description?: string
  changes: ChangeItem[]
}

const typeConfig = {
  feat: { label: '新功能', icon: Sparkles, variant: 'default' as const },
  fix: { label: '修复', icon: Bug, variant: 'destructive' as const },
  style: { label: '样式', icon: Palette, variant: 'secondary' as const },
  refactor: { label: '重构', icon: RefreshCw, variant: 'outline' as const },
  perf: { label: '优化', icon: Rocket, variant: 'secondary' as const },
  docs: { label: '文档', icon: FileText, variant: 'outline' as const },
}

const changelog: ChangelogEntry[] = [
  {
    version: 'v1.0.2',
    date: '2026-01-05',
    description: '体验优化和功能增强',
    changes: [
      { type: 'feat', content: '接口文档支持 Swagger / Redoc 双模式切换' },
      { type: 'feat', content: '新增统一状态切换组件，支持显示对象名称的提示' },
      { type: 'feat', content: '后端新增各模块状态切换接口' },
      { type: 'fix', content: '修复菜单、部门、定时任务状态切换无效的问题' },
      { type: 'fix', content: '修复系统设置、参数配置、通知公告未修改时误触发离开确认' },
      { type: 'fix', content: '修复开发环境上传图片无法显示的问题' },
      { type: 'perf', content: '分页列表默认每页 20 条数据' },
      { type: 'perf', content: '优化登录日志表格列宽和行高' },
      { type: 'perf', content: '优化字典管理页面交互体验' },
      { type: 'refactor', content: '统一所有页面的状态筛选下拉框' },
      { type: 'refactor', content: '接口文档路由改为 /tool/apidoc' },
    ],
  },
  {
    version: 'v1.0.1',
    date: '2025-12-26',
    description: 'Docker 部署优化和 Bug 修复',
    changes: [
      { type: 'fix', content: '修复页面刷新时动态路由失效导致 404 的问题' },
      { type: 'fix', content: '修复 Swagger 接口文档在 Docker 环境下无法加载' },
      { type: 'perf', content: '数据库改由 Prisma 统一管理，移除 SQL 文件初始化' },
      { type: 'perf', content: 'db.sh 脚本优化：端口配置、备份恢复交互式选择' },
      { type: 'perf', content: 'nginx 添加 /api-docs 代理支持 Swagger UI' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2024-12-18',
    description: '首个正式版本发布',
    changes: [
      { type: 'feat', content: '添加更新日志菜单和页面' },
      { type: 'feat', content: '添加 Prisma 数据库管理脚本 (db.sh)，支持本地开发和 Docker 环境' },
      { type: 'feat', content: '添加 Monorepo 交互式管理脚本 (monorepo.sh)' },
      { type: 'docs', content: '更新 README 和项目文档，添加交互式脚本使用说明' },
      { type: 'feat', content: '添加通用组件和优化表格页面' },
      { type: 'feat', content: '系统设置添加 SMTP 配置帮助提示和云存储配置说明' },
      { type: 'feat', content: '补充系统监控模块的按钮权限和系统设置按钮' },
      { type: 'feat', content: '添加 token 宽限期刷新机制' },
      { type: 'fix', content: '更新登录失效的错误提示信息' },
      { type: 'fix', content: '登录前清除旧 token 避免状态残留' },
      { type: 'style', content: '添加 destructive-foreground 颜色变量' },
      { type: 'style', content: '调整菜单项样式，增加图标大小和字体加粗' },
      { type: 'refactor', content: '改进动态路由管理逻辑' },
      { type: 'refactor', content: '优化 Docker 部署配置和文档' },
    ],
  },
]
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <div>
      <h2 class="text-xl sm:text-2xl font-bold tracking-tight">更新日志</h2>
      <p class="text-muted-foreground">查看系统的版本更新记录</p>
    </div>

    <div class="space-y-6">
      <Card v-for="entry in changelog" :key="entry.version">
        <CardHeader>
          <div class="flex items-center gap-3">
            <Badge variant="default" class="text-sm px-3 py-1">{{ entry.version }}</Badge>
            <span class="text-muted-foreground text-sm">{{ entry.date }}</span>
          </div>
          <CardDescription v-if="entry.description" class="mt-2">
            {{ entry.description }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul class="space-y-3">
            <li
              v-for="(change, idx) in entry.changes"
              :key="idx"
              class="flex items-start gap-3"
            >
              <Badge :variant="typeConfig[change.type].variant" class="shrink-0 mt-0.5">
                <component :is="typeConfig[change.type].icon" class="h-3 w-3 mr-1" />
                {{ typeConfig[change.type].label }}
              </Badge>
              <span class="text-sm">{{ change.content }}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

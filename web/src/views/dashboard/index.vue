<script setup lang="ts">
import { Bug, ClipboardList, FolderKanban, LayoutDashboard } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const quickEntries = [
  {
    title: '仪表盘',
    description: '查看项目进度、风险、未处理事项和下阶段安排。',
    path: '/project-management/executive-dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '需求管理',
    description: '维护需求、评审结论、优先级和关联迭代。',
    path: '/project-management/requirements',
    icon: ClipboardList,
  },
  {
    title: '缺陷管理',
    description: '跟踪缺陷提交、审核、分派、修复和验证闭环。',
    path: '/bug/tickets',
    icon: Bug,
  },
  {
    title: '项目管理',
    description: '维护项目、模块、版本、迭代和里程碑。',
    path: '/project-management/overview',
    icon: FolderKanban,
  },
]
</script>

<template>
  <main class="space-y-6 p-4 sm:p-6">
    <section class="rounded-xl border bg-card p-6 shadow-sm">
      <div class="max-w-3xl space-y-3">
        <p class="text-sm font-medium text-primary">业务首页</p>
        <h1 class="text-3xl font-bold tracking-tight">研发协作工作台</h1>
        <p class="text-muted-foreground">
          当前首页用于承载常用业务入口；项目进度、风险和待处理事项请进入“项目管理 > 仪表盘”查看。
        </p>
        <div class="flex flex-wrap gap-3 pt-2">
          <Button as-child>
            <RouterLink to="/project-management/executive-dashboard">进入仪表盘</RouterLink>
          </Button>
          <Button variant="outline" as-child>
            <RouterLink to="/bug/tickets">查看缺陷列表</RouterLink>
          </Button>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card v-for="entry in quickEntries" :key="entry.path">
        <CardHeader class="space-y-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <component :is="entry.icon" class="h-5 w-5" />
          </div>
          <div>
            <CardTitle class="text-base">{{ entry.title }}</CardTitle>
            <CardDescription>{{ entry.description }}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" class="w-full" as-child>
            <RouterLink :to="entry.path">打开</RouterLink>
          </Button>
        </CardContent>
      </Card>
    </section>
  </main>
</template>

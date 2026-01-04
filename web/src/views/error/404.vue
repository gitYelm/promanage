<script setup lang="ts">
import { FileQuestion } from 'lucide-vue-next'
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4"
  >
    <div class="text-center space-y-6 max-w-md">
      <!-- 图标 -->
      <div class="relative mx-auto w-32 h-32">
        <div class="absolute inset-0 bg-muted rounded-full animate-pulse" />
        <div class="absolute inset-2 bg-muted/50 rounded-full" />
        <div class="absolute inset-0 flex items-center justify-center">
          <FileQuestion class="w-16 h-16 text-muted-foreground" />
        </div>
      </div>

      <!-- 错误码 -->
      <div class="space-y-2">
        <h1
          class="text-8xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
        >
          404
        </h1>
        <div class="h-1 w-16 mx-auto bg-gradient-to-r from-primary to-primary/30 rounded-full" />
      </div>

      <!-- 描述 -->
      <div class="space-y-2">
        <h2 class="text-xl font-medium text-foreground">页面未找到</h2>
        <p class="text-muted-foreground text-sm leading-relaxed">您访问的页面不存在或已被移除</p>
      </div>
    </div>
  </div>
</template>

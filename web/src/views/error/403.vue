<script setup lang="ts">
import { ShieldX } from 'lucide-vue-next'
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4"
  >
    <div class="text-center space-y-6 max-w-md">
      <!-- 图标 -->
      <div class="relative mx-auto w-32 h-32">
        <div class="absolute inset-0 bg-destructive/10 rounded-full animate-pulse" />
        <div class="absolute inset-2 bg-destructive/5 rounded-full" />
        <div class="absolute inset-0 flex items-center justify-center">
          <ShieldX class="w-16 h-16 text-destructive/70" />
        </div>
      </div>

      <!-- 错误码 -->
      <div class="space-y-2">
        <h1
          class="text-8xl font-bold tracking-tighter bg-gradient-to-r from-destructive to-destructive/50 bg-clip-text text-transparent"
        >
          403
        </h1>
        <div
          class="h-1 w-16 mx-auto bg-gradient-to-r from-destructive to-destructive/30 rounded-full"
        />
      </div>

      <!-- 描述 -->
      <div class="space-y-2">
        <h2 class="text-xl font-medium text-foreground">访问被拒绝</h2>
        <p class="text-muted-foreground text-sm leading-relaxed">
          您没有权限访问此页面，请联系管理员
        </p>
      </div>
    </div>
  </div>
</template>

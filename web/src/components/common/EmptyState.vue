<script setup lang="ts">
import type { Component } from 'vue'
import { InboxIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { PermissionFlagInput } from '@/utils/permission-visibility'

interface Props {
  /** 标题 */
  title?: string
  /** 描述文字 */
  description?: string
  /** 自定义图标组件 */
  icon?: Component
  /** 操作按钮文字 */
  actionText?: string
  /** 操作按钮权限；不传时由 Button 按当前路由和 actionText 兜底推断 */
  permission?: PermissionFlagInput
}

interface Emits {
  (e: 'action'): void
}

withDefaults(defineProps<Props>(), {
  title: '暂无数据',
  description: '',
  icon: () => InboxIcon,
  actionText: '',
})

defineEmits<Emits>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="mb-4 rounded-full bg-muted p-4">
      <component :is="icon" class="h-10 w-10 text-muted-foreground" />
    </div>
    <h3 class="mb-1 text-lg font-medium text-foreground">{{ title }}</h3>
    <p v-if="description" class="mb-4 max-w-sm text-sm text-muted-foreground">
      {{ description }}
    </p>
    <slot name="action">
      <Button v-if="actionText" :permission="permission" @click="$emit('action')">
        {{ actionText }}
      </Button>
    </slot>
  </div>
</template>

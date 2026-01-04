<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle.vue'
import ThemeCustomizer from '@/components/ThemeCustomizer.vue'

interface Props {
  open: boolean
}

const _props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>系统设置</DialogTitle>
        <DialogDescription> 自定义您的系统偏好设置 </DialogDescription>
      </DialogHeader>
      <div class="space-y-6 py-4">
        <div class="space-y-4">
          <div>
            <h4 class="font-medium mb-3">外观设置</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p class="font-medium text-sm">主题模式</p>
                  <p class="text-xs text-muted-foreground">切换亮色/暗色主题</p>
                </div>
                <ThemeToggle />
              </div>
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p class="font-medium text-sm">主题定制</p>
                  <p class="text-xs text-muted-foreground">自定义主题颜色</p>
                </div>
                <ThemeCustomizer />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="emit('update:open', false)">关闭</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

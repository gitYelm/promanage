<script setup lang="ts">
import { Button } from '@/components/ui/button'

defineProps<{
  visible: boolean
  selectedCount: number
}>()

const emit = defineEmits<{
  batchAssign: []
  clear: []
}>()
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="visible"
      class="flex items-center gap-4 rounded-lg border bg-muted/50 px-4 py-3"
    >
      <span class="text-sm">
        已选择 <span class="font-medium">{{ selectedCount }}</span> 项
      </span>
      <Button size="sm" variant="outline" @click="emit('batchAssign')">批量修改负责人/开发/测试</Button>
      <Button size="sm" variant="ghost" @click="emit('clear')">清空选择</Button>
    </div>
  </Transition>
</template>

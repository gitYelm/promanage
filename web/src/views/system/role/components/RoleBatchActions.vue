<script setup lang="ts">
import { Button } from '@/components/ui/button'

defineProps<{
  selectedCount: number
}>()

const emit = defineEmits<{
  status: [status: '0' | '1']
  delete: []
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
      v-if="selectedCount > 0"
      class="flex items-center gap-4 px-4 py-3 bg-muted/50 border rounded-lg"
    >
      <span class="text-sm">
        已选择 <span class="font-medium">{{ selectedCount }}</span> 项
      </span>
      <Button variant="outline" size="sm" @click="emit('status', '0')"> 批量启用 </Button>
      <Button variant="outline" size="sm" @click="emit('status', '1')"> 批量停用 </Button>
      <Button variant="destructive" size="sm" @click="emit('delete')"> 批量删除 </Button>
    </div>
  </Transition>
</template>

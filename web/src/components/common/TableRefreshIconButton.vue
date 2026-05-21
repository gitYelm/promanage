<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <Button
    variant="outline"
    size="icon"
    class="h-9 w-9"
    title="刷新"
    :disabled="loading"
    @click="emit('refresh')"
  >
    <RefreshCw class="h-4 w-4" :class="loading && 'animate-spin'" />
  </Button>
</template>

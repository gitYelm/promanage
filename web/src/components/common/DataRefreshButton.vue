<script setup lang="ts">
import { RefreshCw, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

withDefaults(
  defineProps<{
    loading?: boolean
    label?: string
  }>(),
  {
    loading: false,
    label: '刷新',
  },
)

const emit = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <Button variant="outline" size="sm" :disabled="loading" @click="emit('refresh')">
    <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
    <RefreshCw v-else class="mr-2 h-4 w-4" />
    {{ label }}
  </Button>
</template>

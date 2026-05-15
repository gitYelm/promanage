<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import type { BugActionOption, BugTicket } from '@/api/bug/types'

const props = defineProps<{
  ticket: BugTicket
}>()

const emit = defineEmits<{
  (event: 'detail', ticket: BugTicket): void
  (event: 'run', action: BugActionOption, ticket: BugTicket): void
}>()

const primaryActions = computed(() => (props.ticket.availableActions || []).slice(0, 3))
</script>

<template>
  <div class="flex flex-wrap items-center gap-1" @click.stop>
    <Button size="sm" variant="outline" @click="emit('detail', ticket)">详情</Button>
    <Button
      v-for="action in primaryActions"
      :key="action.action"
      size="sm"
      variant="secondary"
      @click="emit('run', action, ticket)"
    >
      {{ action.label }}
    </Button>
  </div>
</template>

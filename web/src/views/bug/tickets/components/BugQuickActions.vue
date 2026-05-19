<script setup lang="ts">
import { computed } from 'vue'
import SemanticActionButton from '@/components/common/SemanticActionButton.vue'
import { hasAnyPermission } from '@/composables/usePermission'
import type { BugActionOption, BugTicket } from '@/api/bug/types'

const props = defineProps<{
  ticket: BugTicket
}>()

const emit = defineEmits<{
  (event: 'run', action: BugActionOption, ticket: BugTicket): void
}>()

const primaryActions = computed(() =>
  (props.ticket.availableActions || [])
    .filter((action) => !action.permissions?.length || hasAnyPermission(action.permissions))
    .slice(0, 3),
)
</script>

<template>
  <div class="flex flex-wrap items-center gap-1" @click.stop>
    <SemanticActionButton
      v-for="action in primaryActions"
      :key="action.action"
      :action="action.action"
      :permissions="action.permissions"
      @click="emit('run', action, ticket)"
    >
      {{ action.label }}
    </SemanticActionButton>
    <span v-if="!primaryActions.length" class="text-sm text-muted-foreground">-</span>
  </div>
</template>

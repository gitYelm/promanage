<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Button } from '@/components/ui/button'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import ProjectBadge from '@/components/common/ProjectBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { cn } from '@/lib/utils'
import type { BugTicket } from '@/api/bug/types'

type BugLike = BugTicket | Record<string, unknown>

const props = withDefaults(
  defineProps<{
    row: BugLike
    metaText?: string
    secondaryText?: string
    interactive?: boolean
    showTicketNo?: boolean
    cardClass?: HTMLAttributes['class']
  }>(),
  {
    metaText: '',
    secondaryText: '',
    interactive: false,
    showTicketNo: true,
    cardClass: undefined,
  },
)

const emit = defineEmits<{
  detail: [row: BugLike]
}>()

function bugTitle() {
  return String(props.row.title || props.row.ticketNo || '-')
}

function bugTicketNo() {
  return typeof props.row.ticketNo === 'string' ? props.row.ticketNo : ''
}

function itemStatus() {
  return typeof props.row.status === 'string' ? props.row.status : undefined
}

function itemPriority() {
  return typeof props.row.priority === 'string' ? props.row.priority : undefined
}

function itemProject() {
  return props.row.project as { projectName?: string; projectKey?: string } | undefined
}

function openDetail() {
  if (!props.interactive) return
  emit('detail', props.row)
}
</script>

<template>
  <div
    :class="
      cn(
        'rounded-md border bg-background p-3 text-sm shadow-sm transition hover:shadow-md',
        props.cardClass,
      )
    "
    :title="props.interactive ? '双击查看缺陷详情' : undefined"
    @dblclick="openDetail"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <div v-if="props.showTicketNo && bugTicketNo()" class="text-xs text-muted-foreground">
          {{ bugTicketNo() }}
        </div>
        <div class="line-clamp-2 font-medium">{{ bugTitle() }}</div>
      </div>
      <Button
        v-if="props.interactive"
        permission="bug:ticket:query"
        size="xs"
        variant="outline"
        @click.stop="openDetail"
      >
        详情
      </Button>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2">
      <StatusBadge domain="bug" :value="itemStatus()" />
      <PriorityBadge :value="itemPriority()" />
      <ProjectBadge
        v-if="itemProject()"
        :name="itemProject()?.projectName"
        :code="itemProject()?.projectKey"
        compact
      />
    </div>
    <div v-if="props.metaText" class="mt-2 text-xs text-muted-foreground">
      {{ props.metaText }}
    </div>
    <div v-if="props.secondaryText" class="mt-1 text-xs text-muted-foreground">
      {{ props.secondaryText }}
    </div>
  </div>
</template>

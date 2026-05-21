<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-vue-next'
import { TableHead } from '@/components/ui/table'

type SortOrder = 'asc' | 'desc' | ''

const props = withDefaults(
  defineProps<{
    label: string
    sortKey: string
    sortBy?: string
    sortOrder?: SortOrder
    align?: 'left' | 'center' | 'right'
    sortable?: boolean
    class?: string
  }>(),
  {
    sortOrder: '',
    align: 'left',
    sortable: true,
    class: '',
  },
)

const emit = defineEmits<{ sort: [key: string] }>()

function sortLabel() {
  if (!props.sortable) return props.label
  if (props.sortBy !== props.sortKey) return `${props.label}未排序，点击升序排序`
  return props.sortOrder === 'asc'
    ? `${props.label}升序，点击降序排序`
    : `${props.label}降序，点击取消排序`
}

function alignClass() {
  if (props.align === 'center') return 'justify-center'
  if (props.align === 'right') return 'justify-end'
  return ''
}
</script>

<template>
  <TableHead :class="props.class">
    <button
      v-if="props.sortable"
      type="button"
      class="inline-flex w-full items-center gap-1 rounded-sm text-sm font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      :class="alignClass()"
      :aria-label="sortLabel()"
      @click="emit('sort', props.sortKey)"
    >
      <slot name="label"><span>{{ props.label }}</span></slot>
      <ArrowUp v-if="props.sortBy === props.sortKey && props.sortOrder === 'asc'" class="h-3.5 w-3.5 text-primary" />
      <ArrowDown v-else-if="props.sortBy === props.sortKey && props.sortOrder === 'desc'" class="h-3.5 w-3.5 text-primary" />
      <ChevronsUpDown v-else class="h-3.5 w-3.5 text-muted-foreground/60" />
    </button>
    <span v-else>{{ props.label }}</span>
  </TableHead>
</template>

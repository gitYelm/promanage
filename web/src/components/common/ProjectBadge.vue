<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { FolderKanban } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    name?: string
    code?: string
    compact?: boolean
    class?: HTMLAttributes['class']
  }>(),
  {
    name: undefined,
    code: undefined,
    compact: false,
  },
)
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex min-w-0 max-w-full cursor-default items-center whitespace-nowrap gap-1 rounded-full border px-2 py-0 text-[11px] font-medium leading-5 shadow-none',
        'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300',
        props.class,
      )
    "
  >
    <FolderKanban class="size-3.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
    <span class="min-w-0 truncate">{{ name || '未关联项目' }}</span>
    <span v-if="code && !compact" class="shrink-0 text-[10px] font-normal text-muted-foreground">#{{ code }}</span>
  </span>
</template>

<script setup lang="ts">
import { Columns3 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { RequirementColumnConfig } from '../useRequirementColumns'

defineProps<{
  columns: RequirementColumnConfig[]
}>()

const emit = defineEmits<{
  toggle: [key: string]
  reset: []
}>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon" class="h-9 w-9" title="字段设置">
        <Columns3 class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel>显示字段</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="column in columns"
        :key="column.key"
        class="flex items-center justify-between gap-3"
        @select.prevent="!column.fixed && emit('toggle', column.key)"
      >
        <span class="text-sm">{{ column.label }}</span>
        <Checkbox :model-value="column.visible" :disabled="column.fixed" />
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @select.prevent="emit('reset')">恢复默认</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  /** 列数 */
  columns?: number
  /** 行数 */
  rows?: number
  /** 是否显示复选框列 */
  showCheckbox?: boolean
  /** 是否显示操作列 */
  showActions?: boolean
}

withDefaults(defineProps<Props>(), {
  columns: 5,
  rows: 10,
  showCheckbox: false,
  showActions: true,
})
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead v-if="showCheckbox" class="w-12">
          <Skeleton class="h-4 w-4" />
        </TableHead>
        <TableHead v-for="i in columns" :key="i">
          <Skeleton class="h-4 w-20" />
        </TableHead>
        <TableHead v-if="showActions" class="w-32 text-right">
          <Skeleton class="ml-auto h-4 w-12" />
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="row in rows" :key="row">
        <TableCell v-if="showCheckbox">
          <Skeleton class="h-4 w-4" />
        </TableCell>
        <TableCell v-for="col in columns" :key="col">
          <Skeleton class="h-4" :class="col === 1 ? 'w-16' : 'w-24'" />
        </TableCell>
        <TableCell v-if="showActions">
          <div class="flex justify-end gap-2">
            <Skeleton class="h-8 w-14" />
            <Skeleton class="h-8 w-14" />
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

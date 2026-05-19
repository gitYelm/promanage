<script setup lang="ts">
import { computed } from 'vue'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePermission } from '@/composables/usePermission'
import { actionColumnPermissionsForPath } from '@/components/ui/table/table-align'

interface Props {
  /** 列数 */
  columns?: number
  /** 行数 */
  rows?: number
  /** 是否显示复选框列 */
  showCheckbox?: boolean
  /** 是否显示操作列 */
  showActions?: boolean
  /** 操作列权限；不传时按当前路由兜底推断 */
  actionPermissions?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  columns: 5,
  rows: 10,
  showCheckbox: false,
  showActions: true,
})

const effectiveActionPermissions = computed(() => props.actionPermissions ?? actionColumnPermissionsForPath())
const canShowInferredActionColumn = usePermission(effectiveActionPermissions)
const showActionColumn = computed(
  () =>
    props.showActions &&
    (effectiveActionPermissions.value.length === 0 || canShowInferredActionColumn.value),
)
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
        <TableHead v-if="showActionColumn" class="w-32 text-right">
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
        <TableCell v-if="showActionColumn">
          <div class="flex justify-end gap-2">
            <Skeleton class="h-8 w-14" />
            <Skeleton class="h-8 w-14" />
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

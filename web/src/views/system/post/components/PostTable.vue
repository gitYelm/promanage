<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit, Trash2 } from 'lucide-vue-next'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import { formatDate } from '@/utils/format'
import type { SysPost } from '@/api/system/types'

defineProps<{
  rows: SysPost[]
  selectedIds: string[]
  selectAll: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc' | ''
}>()

const emit = defineEmits<{
  'update:selectAll': [value: boolean]
  toggleSelect: [postId: string]
  edit: [row: SysPost]
  remove: [row: SysPost]
  changeStatus: [postId: string, status: string]
  sort: [key: string]
}>()

function changeStatus(postId: string, status: string) {
  emit('changeStatus', postId, status)
  return Promise.resolve()
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="w-[50px]">
          <Checkbox
            :model-value="selectAll"
            :disabled="rows.length === 0"
            @update:model-value="emit('update:selectAll', Boolean($event))"
          />
        </TableHead>
        <SortableTableHead label="岗位编号" sort-key="postId" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <SortableTableHead label="岗位编码" sort-key="postCode" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <SortableTableHead label="岗位名称" sort-key="postName" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <SortableTableHead label="排序" sort-key="postSort" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <SortableTableHead label="状态" sort-key="status" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <SortableTableHead label="创建时间" sort-key="createTime" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <TableHead class="text-right">操作</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="item in rows" :key="item.postId">
        <TableCell>
          <Checkbox
            :model-value="selectedIds.includes(item.postId)"
            @update:model-value="emit('toggleSelect', item.postId)"
          />
        </TableCell>
        <TableCell>{{ item.postId }}</TableCell>
        <TableCell><Badge variant="outline">{{ item.postCode }}</Badge></TableCell>
        <TableCell>{{ item.postName }}</TableCell>
        <TableCell>{{ item.postSort }}</TableCell>
        <TableCell>
          <StatusSwitch
            :status="item.status"
            :name="item.postName"
            :on-toggle="(status) => changeStatus(item.postId, status)"
          />
        </TableCell>
        <TableCell>{{ formatDate(item.createTime) }}</TableCell>
        <TableCell class="text-right space-x-2">
          <Button variant="ghost" size="icon" @click="emit('edit', item)"><Edit class="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" class="text-destructive" @click="emit('remove', item)">
            <Trash2 class="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

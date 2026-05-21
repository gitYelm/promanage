<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit, Eye, Trash2 } from 'lucide-vue-next'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import { formatDate } from '@/utils/format'
import type { SysNotice } from '@/api/system/notice'

defineProps<{
  rows: SysNotice[]
  selectedIds: string[]
  selectAll: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc' | ''
}>()

const emit = defineEmits<{
  'update:selectAll': [value: boolean]
  toggleSelect: [noticeId: string]
  preview: [row: SysNotice]
  edit: [row: SysNotice]
  remove: [row: SysNotice]
  changeStatus: [noticeId: string, status: string]
  sort: [key: string]
}>()

function changeStatus(noticeId: string, status: string) {
  emit('changeStatus', noticeId, status)
  return Promise.resolve()
}

function getNoticeTypeLabel(type: string) {
  return type === '1' ? '通知' : type === '2' ? '公告' : '未知'
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
        <SortableTableHead label="序号" sort-key="noticeId" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <SortableTableHead label="公告标题" sort-key="noticeTitle" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <SortableTableHead label="公告类型" sort-key="noticeType" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <SortableTableHead label="状态" sort-key="status" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <SortableTableHead label="创建者" sort-key="createBy" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <SortableTableHead label="创建时间" sort-key="createTime" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        <TableHead class="text-right">操作</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="item in rows" :key="item.noticeId">
        <TableCell>
          <Checkbox
            :model-value="selectedIds.includes(item.noticeId)"
            @update:model-value="emit('toggleSelect', item.noticeId)"
          />
        </TableCell>
        <TableCell>{{ item.noticeId }}</TableCell>
        <TableCell>{{ item.noticeTitle }}</TableCell>
        <TableCell><Badge variant="outline">{{ getNoticeTypeLabel(item.noticeType) }}</Badge></TableCell>
        <TableCell>
          <StatusSwitch
            :status="item.status"
            :name="item.noticeTitle"
            :on-toggle="(status) => changeStatus(item.noticeId, status)"
          />
        </TableCell>
        <TableCell>{{ item.createBy }}</TableCell>
        <TableCell>{{ formatDate(item.createTime) }}</TableCell>
        <TableCell class="text-right space-x-2">
          <Button variant="ghost" size="icon" title="预览" @click="emit('preview', item)"><Eye class="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" title="编辑" @click="emit('edit', item)"><Edit class="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" class="text-destructive" title="删除" @click="emit('remove', item)">
            <Trash2 class="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

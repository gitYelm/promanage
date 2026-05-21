<script setup lang="ts">
import { computed } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import SemanticActionButton from '@/components/common/SemanticActionButton.vue'
import ProjectBadge from '@/components/common/ProjectBadge.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import type { Requirement } from '@/api/project-management/types'

interface QuickActionItem {
  action: string
  label: string
  permissions?: string[]
}

const emit = defineEmits<{
  toggleSelectAll: [checked: boolean]
  toggleSelect: [requirementId: string]
  openDetail: [row: Requirement]
  edit: [row: Requirement]
  remove: [row: Requirement]
  action: [row: Requirement, action: string]
  sort: [key: string]
}>()

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '-'
}

const props = defineProps<{
  rows: Requirement[]
  selectedIds: string[]
  selectAll: boolean
  canSelectRows: boolean
  canShowQuickActionColumn: boolean
  canShowOperationColumn: boolean
  quickActions: (row: Requirement) => QuickActionItem[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc' | ''
  visibleColumns: Record<string, boolean>
}>()


const emptyColspan = computed(() => {
  let count = [
    props.visibleColumns.requirementNo,
    props.visibleColumns.title,
    props.visibleColumns.project,
    props.visibleColumns.owner,
    props.visibleColumns.status,
    props.visibleColumns.priority,
    props.visibleColumns.plannedEndTime,
  ].filter(Boolean).length
  if (props.canSelectRows) count += 1
  if (props.canShowQuickActionColumn && props.visibleColumns.quickActions) count += 1
  if (props.canShowOperationColumn && props.visibleColumns.actions) count += 1
  return count
})
</script>

<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead v-if="canSelectRows" class="w-[50px]">
            <Checkbox
              :model-value="selectAll"
              :disabled="rows.length === 0"
              @update:model-value="(value) => emit('toggleSelectAll', Boolean(value))"
            />
          </TableHead>
          <SortableTableHead v-if="visibleColumns.requirementNo" label="编号" sort-key="requirementNo" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <TableHead v-if="visibleColumns.title">标题</TableHead>
          <SortableTableHead v-if="visibleColumns.project" label="项目" sort-key="projectId" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="visibleColumns.owner" label="负责人" sort-key="ownerId" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="visibleColumns.status" label="状态" sort-key="status" align="center" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="visibleColumns.priority" label="优先级" sort-key="priority" align="center" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="visibleColumns.plannedEndTime" label="计划完成" sort-key="plannedEndTime" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <TableHead v-if="canShowQuickActionColumn && visibleColumns.quickActions" class="min-w-48 text-left">快捷操作</TableHead>
          <TableHead v-if="canShowOperationColumn && visibleColumns.actions" class="min-w-56 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableEmpty v-if="!rows.length" :colspan="emptyColspan" class="py-16">
          <slot name="empty">
            暂无数据
          </slot>
        </TableEmpty>
        <TableRow
          v-for="row in rows"
          :key="row.requirementId"
          :class="canShowOperationColumn && 'cursor-pointer'"
          title="双击查看需求详情"
          @dblclick="canShowOperationColumn && emit('openDetail', row)"
        >
          <TableCell v-if="canSelectRows">
            <Checkbox
              :model-value="selectedIds.includes(row.requirementId)"
              @update:model-value="() => emit('toggleSelect', row.requirementId)"
            />
          </TableCell>
          <TableCell v-if="visibleColumns.requirementNo">{{ row.requirementNo }}</TableCell>
          <TableCell v-if="visibleColumns.title">{{ row.title }}</TableCell>
          <TableCell v-if="visibleColumns.project">
            <ProjectBadge :name="row.project?.projectName" :code="row.project?.projectKey" />
          </TableCell>
          <TableCell v-if="visibleColumns.owner">{{ row.owner?.nickName || row.developer?.nickName || '-' }}</TableCell>
          <TableCell v-if="visibleColumns.status" class="text-center">
            <StatusBadge domain="requirement" :value="row.status" />
          </TableCell>
          <TableCell v-if="visibleColumns.priority" class="text-center"><PriorityBadge :value="row.priority" /></TableCell>
          <TableCell v-if="visibleColumns.plannedEndTime" class="text-left">{{ formatDate(row.plannedEndTime) }}</TableCell>
          <TableCell v-if="canShowQuickActionColumn && visibleColumns.quickActions" class="text-left">
            <div v-if="quickActions(row).length" class="flex flex-wrap gap-2">
              <SemanticActionButton
                v-for="item in quickActions(row)"
                :key="item.action"
                :permissions="item.permissions"
                :action="item.action"
                @click="emit('action', row, item.action)"
              >
                {{ item.label }}
              </SemanticActionButton>
            </div>
            <span v-else class="text-sm text-muted-foreground">-</span>
          </TableCell>
          <TableCell v-if="canShowOperationColumn && visibleColumns.actions" class="text-right">
            <div class="flex justify-end gap-2">
              <Button permission="pm:requirement:view" size="sm" variant="outline" @click.stop="emit('openDetail', row)">详情</Button>
              <Button v-hasPermi="['pm:requirement:update']" size="sm" variant="outline" @click.stop="emit('edit', row)">编辑</Button>
              <Button v-hasPermi="['pm:requirement:update']" size="sm" variant="destructive" @click.stop="emit('remove', row)">删除</Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

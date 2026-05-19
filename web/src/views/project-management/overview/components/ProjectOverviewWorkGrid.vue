<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import EmptyState from '@/components/common/EmptyState.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { usePermission } from '@/composables/usePermission'
import type { ProjectOverview, Requirement } from '@/api/project-management/types'
import { formatDate } from '../../shared/options'

const props = defineProps<{
  overview: ProjectOverview
}>()
const emit = defineEmits<{
  requirementDetail: [row: Requirement]
}>()
const canViewRequirementDetail = usePermission(['pm:requirement:view'])

function bugTitle(item: Record<string, unknown>) {
  return String(item.ticketNo || item.title || '-')
}
function itemStatus(item: Record<string, unknown>) {
  return typeof item.status === 'string' ? item.status : undefined
}
function itemPriority(item: Record<string, unknown>) {
  return typeof item.priority === 'string' ? item.priority : undefined
}
function ownerName(row: Requirement) {
  return row.developer?.nickName || row.owner?.nickName || row.owner?.userName || '-'
}
function openRequirementDetail(row: Requirement) {
  emit('requirementDetail', row)
}
function activityText(item: {
  targetType: string
  action: string
  fromValue?: string
  toValue?: string
}) {
  return `${item.targetType} ${item.action}${item.toValue ? `：${item.fromValue || '-'} → ${item.toValue}` : ''}`
}
</script>

<template>
  <div class="grid gap-4 xl:grid-cols-2">
    <Card>
      <CardHeader><CardTitle>当前处理需求</CardTitle></CardHeader>
      <CardContent class="max-h-[30rem] overflow-y-auto overscroll-contain pr-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>需求</TableHead><TableHead>负责人</TableHead>
              <TableHead class="text-center">状态</TableHead><TableHead>计划完成</TableHead>
              <TableHead v-if="canViewRequirementDetail" class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="row in props.overview.currentRequirements"
              :key="row.requirementId"
              class="cursor-pointer"
              title="双击查看需求详情"
              @dblclick="canViewRequirementDetail && openRequirementDetail(row)"
            >
              <TableCell>{{ row.title }}</TableCell
              ><TableCell>{{ ownerName(row) }}</TableCell>
              <TableCell class="text-center"
                ><StatusBadge domain="requirement" :value="row.status"
              /></TableCell>
              <TableCell>{{ formatDate(row.plannedEndTime) }}</TableCell>
              <TableCell v-if="canViewRequirementDetail" class="text-right">
                <Button
                  permission="pm:requirement:view"
                  size="xs"
                  variant="outline"
                  @click.stop="openRequirementDetail(row)"
                  >详情</Button
                >
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <EmptyState v-if="!props.overview.currentRequirements.length" />
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>当前修复缺陷</CardTitle></CardHeader>
      <CardContent class="max-h-[30rem] overflow-y-auto overscroll-contain pr-3">
        <div class="space-y-2">
          <div
            v-for="row in props.overview.currentBugs"
            :key="String(row.ticketId)"
            class="rounded-md border p-3 text-sm"
          >
            <div class="font-medium">{{ bugTitle(row) }}</div>
            <div class="mt-2 flex flex-wrap gap-1">
              <StatusBadge domain="bug" :value="itemStatus(row)" /><PriorityBadge
                :value="itemPriority(row)"
              />
            </div>
          </div>
          <EmptyState v-if="!props.overview.currentBugs.length" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>未处理需求</CardTitle></CardHeader>
      <CardContent class="max-h-[30rem] overflow-y-auto overscroll-contain pr-3">
        <div class="space-y-2">
          <div
            v-for="row in props.overview.pendingRequirements"
            :key="row.requirementId"
            class="rounded-md border p-3 text-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="font-medium">{{ row.title }}</div>
              <Button
                v-if="canViewRequirementDetail"
                permission="pm:requirement:view"
                size="xs"
                variant="outline"
                @click="openRequirementDetail(row)"
                >详情</Button
              >
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge domain="requirement" :value="row.status" /><span
                class="text-xs text-muted-foreground"
                >{{ ownerName(row) }}</span
              >
            </div>
          </div>
          <EmptyState v-if="!props.overview.pendingRequirements.length" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>未处理缺陷</CardTitle></CardHeader>
      <CardContent class="max-h-[30rem] overflow-y-auto overscroll-contain pr-3">
        <div class="space-y-2">
          <div
            v-for="row in props.overview.pendingBugs"
            :key="String(row.ticketId)"
            class="rounded-md border p-3 text-sm"
          >
            <div class="font-medium">{{ bugTitle(row) }}</div>
            <div class="mt-2 flex flex-wrap gap-1">
              <StatusBadge domain="bug" :value="itemStatus(row)" /><PriorityBadge
                :value="itemPriority(row)"
              />
            </div>
          </div>
          <EmptyState v-if="!props.overview.pendingBugs.length" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>历史完成需求</CardTitle></CardHeader>
      <CardContent class="max-h-[30rem] overflow-y-auto overscroll-contain pr-3">
        <div class="space-y-2">
          <div
            v-for="row in props.overview.completedRequirements"
            :key="row.requirementId"
            class="rounded-md border p-3 text-sm"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="font-medium">{{ row.title }}</div>
              <Button
                v-if="canViewRequirementDetail"
                permission="pm:requirement:view"
                size="xs"
                variant="outline"
                @click="openRequirementDetail(row)"
                >详情</Button
              >
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge domain="requirement" :value="row.status" /><span
                class="text-xs text-muted-foreground"
                >{{ formatDate(row.actualEndTime || row.updateTime) }}</span
              >
            </div>
          </div>
          <EmptyState v-if="!props.overview.completedRequirements.length" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>历史修复缺陷</CardTitle></CardHeader>
      <CardContent class="max-h-[30rem] overflow-y-auto overscroll-contain pr-3">
        <div class="space-y-2">
          <div
            v-for="row in props.overview.completedBugs"
            :key="String(row.ticketId)"
            class="rounded-md border p-3 text-sm"
          >
            <div class="font-medium">{{ bugTitle(row) }}</div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge domain="bug" :value="itemStatus(row)" /><span
                class="text-xs text-muted-foreground"
                >{{ String(row.updateTime || '-') }}</span
              >
            </div>
          </div>
          <EmptyState v-if="!props.overview.completedBugs.length" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>项目动态</CardTitle></CardHeader>
      <CardContent class="max-h-[30rem] overflow-y-auto overscroll-contain pr-3">
        <div class="space-y-2">
          <div
            v-for="item in props.overview.activities"
            :key="item.activityId"
            class="rounded-md border p-3 text-sm"
          >
            <div>{{ activityText(item) }}</div>
            <div class="text-muted-foreground">
              {{ item.operator?.nickName || '-' }} · {{ formatDate(item.createTime) }}
            </div>
          </div>
          <EmptyState v-if="!props.overview.activities.length" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>

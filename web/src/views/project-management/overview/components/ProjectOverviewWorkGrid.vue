<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue'
import PmBugSummaryCard from '../../components/PmBugSummaryCard.vue'
import PmRequirementSummaryCard from '../../components/PmRequirementSummaryCard.vue'
import PmScrollableSectionCard from '../../components/PmScrollableSectionCard.vue'
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

function ownerName(row: Requirement) {
  return row.developer?.nickName || row.owner?.nickName || row.owner?.userName || '-'
}
function openRequirementDetail(row: Requirement) {
  emit('requirementDetail', row)
}
function requirementMeta(row: Requirement) {
  return `${row.project?.projectName || '-'} · ${ownerName(row)}`
}
function bugMeta(row: Record<string, unknown>) {
  const project = (row.project as { projectName?: string } | undefined)?.projectName || '-'
  return project
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
  <div class="grid gap-4 xl:grid-cols-3">
    <PmScrollableSectionCard
      title="当前处理需求"
      :count="props.overview.currentRequirements.length"
      content-class="space-y-2"
    >
      <PmRequirementSummaryCard
        v-for="row in props.overview.currentRequirements"
        :key="row.requirementId"
        :row="row"
        :show-priority="false"
        :interactive="canViewRequirementDetail"
        :meta-text="requirementMeta(row)"
        :secondary-text="`计划完成：${formatDate(row.plannedEndTime)}`"
        @detail="openRequirementDetail"
      />
      <EmptyState v-if="!props.overview.currentRequirements.length" />
    </PmScrollableSectionCard>
    <PmScrollableSectionCard
      title="当前修复缺陷"
      :count="props.overview.currentBugs.length"
      content-class="space-y-2"
    >
      <PmBugSummaryCard
        v-for="row in props.overview.currentBugs"
        :key="String(row.ticketId)"
        :row="row"
        :show-ticket-no="false"
        :meta-text="bugMeta(row)"
      />
      <EmptyState v-if="!props.overview.currentBugs.length" />
    </PmScrollableSectionCard>
    <PmScrollableSectionCard
      title="未处理需求"
      :count="props.overview.pendingRequirements.length"
      content-class="space-y-2"
    >
      <PmRequirementSummaryCard
        v-for="row in props.overview.pendingRequirements"
        :key="row.requirementId"
        :row="row"
        :show-priority="false"
        :interactive="canViewRequirementDetail"
        :meta-text="ownerName(row)"
        @detail="openRequirementDetail"
      />
      <EmptyState v-if="!props.overview.pendingRequirements.length" />
    </PmScrollableSectionCard>
    <PmScrollableSectionCard
      title="未处理缺陷"
      :count="props.overview.pendingBugs.length"
      content-class="space-y-2"
    >
      <PmBugSummaryCard
        v-for="row in props.overview.pendingBugs"
        :key="String(row.ticketId)"
        :row="row"
        :show-ticket-no="false"
        :meta-text="bugMeta(row)"
      />
      <EmptyState v-if="!props.overview.pendingBugs.length" />
    </PmScrollableSectionCard>
    <PmScrollableSectionCard
      title="历史完成需求"
      :count="props.overview.completedRequirements.length"
      content-class="space-y-2"
    >
      <PmRequirementSummaryCard
        v-for="row in props.overview.completedRequirements"
        :key="row.requirementId"
        :row="row"
        :show-priority="false"
        :interactive="canViewRequirementDetail"
        :meta-text="requirementMeta(row)"
        :secondary-text="formatDate(row.actualEndTime || row.updateTime)"
        @detail="openRequirementDetail"
      />
      <EmptyState v-if="!props.overview.completedRequirements.length" />
    </PmScrollableSectionCard>
    <PmScrollableSectionCard
      title="历史修复缺陷"
      :count="props.overview.completedBugs.length"
      content-class="space-y-2"
    >
      <PmBugSummaryCard
        v-for="row in props.overview.completedBugs"
        :key="String(row.ticketId)"
        :row="row"
        :show-ticket-no="false"
        :secondary-text="String(row.updateTime || '-')"
      />
      <EmptyState v-if="!props.overview.completedBugs.length" />
    </PmScrollableSectionCard>
    <PmScrollableSectionCard
      title="项目动态"
      :count="props.overview.activities.length"
      content-class="space-y-2"
    >
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
    </PmScrollableSectionCard>
  </div>
</template>

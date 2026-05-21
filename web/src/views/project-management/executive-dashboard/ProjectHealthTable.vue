<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import EmptyState from '@/components/common/EmptyState.vue'
import ProjectBadge from '@/components/common/ProjectBadge.vue'
import RiskBadge from '@/components/common/RiskBadge.vue'
import SemanticProgress from '@/components/common/SemanticProgress.vue'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProjectHealth } from '@/api/project-management/types'
import type { SortOrder } from '@/utils/table-sort'
import { getRiskStyle } from '@/utils/semantic-styles'

defineProps<{ rows: ProjectHealth[]; sortBy: string; sortOrder: SortOrder }>()
const emit = defineEmits<{ sort: [key: string] }>()
</script>

<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHead label="项目" sort-key="projectName" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead label="阶段" sort-key="projectStage" align="center" class="text-center" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead label="进度" sort-key="progress" align="right" class="min-w-36 text-right" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)">
            <template #label>
              <span>进度</span><HeaderTip>项目负责人手动维护的整体推进进度，用来表达项目当前推进到什么程度。</HeaderTip>
            </template>
          </SortableTableHead>
          <SortableTableHead label="需求完成率" sort-key="requirementDoneRate" align="right" class="text-right" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)">
            <template #label>
              <span>需求完成率</span><HeaderTip>当前项目里已完成需求的占比，按“已完成数量 ÷ 需求总数”计算。</HeaderTip>
            </template>
          </SortableTableHead>
          <SortableTableHead label="缺陷关闭率" sort-key="bugCloseRate" align="right" class="text-right" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead label="风险" sort-key="health" align="center" class="text-center" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="item in rows" :key="item.project.projectId">
          <TableCell><ProjectBadge :name="item.project.projectName" :code="item.project.projectKey" /></TableCell>
          <TableCell class="text-center"><StatusBadge domain="projectStage" :value="item.project.projectStage" /></TableCell>
          <TableCell class="min-w-36"><div class="ml-auto flex max-w-44 items-center justify-end gap-2"><SemanticProgress :model-value="item.progress" :tone="getRiskStyle(item.health).tone" class="h-2" /><span class="w-10 text-right text-xs tabular-nums">{{ item.progress }}%</span></div></TableCell>
          <TableCell class="text-right tabular-nums">{{ item.requirementDoneRate }}%</TableCell>
          <TableCell class="text-right tabular-nums">{{ item.bugCloseRate }}%</TableCell>
          <TableCell class="text-center"><RiskBadge :value="item.health" /></TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <EmptyState v-if="!rows.length" />
  </div>
</template>

<script lang="ts">
const HeaderTip = {
  components: { Info, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger },
  template: `<TooltipProvider :delay-duration="0"><Tooltip><TooltipTrigger as-child><button type="button" class="text-muted-foreground transition-colors hover:text-foreground"><Info class="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent class="max-w-xs text-left"><slot /></TooltipContent></Tooltip></TooltipProvider>`,
}
</script>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import ProjectBadge from '@/components/common/ProjectBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { Requirement } from '@/api/project-management/types'
import { formatDate } from '../../shared/options'

const open = defineModel<boolean>('open', { required: true })
defineProps<{
  detail: Requirement | null
}>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ detail?.requirementNo }} {{ detail?.title }}</DialogTitle>
        <DialogDescription>查看需求基础信息、人员分工、排期和验收标准。</DialogDescription>
      </DialogHeader>
      <div v-if="detail" class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <StatusBadge domain="requirement" :value="detail.status" />
          <PriorityBadge :value="detail.priority" />
          <ProjectBadge :name="detail.project?.projectName" :code="detail.project?.projectKey" />
          <span
            v-if="detail.module?.moduleName"
            class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300"
          >
            {{ detail.module.moduleName }}
          </span>
        </div>
        <div class="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <span class="text-muted-foreground">需求负责人：</span
            >{{ detail.owner?.nickName || detail.owner?.userName || '-' }}
          </div>
          <div>
            <span class="text-muted-foreground">开发负责人：</span
            >{{ detail.developer?.nickName || detail.developer?.userName || '-' }}
          </div>
          <div>
            <span class="text-muted-foreground">测试负责人：</span
            >{{ detail.tester?.nickName || detail.tester?.userName || '-' }}
          </div>
          <div>
            <span class="text-muted-foreground">目标版本：</span
            >{{ detail.version?.versionName || detail.version?.versionNo || '-' }}
          </div>
          <div>
            <span class="text-muted-foreground">计划开始：</span
            >{{ formatDate(detail.plannedStartTime) }}
          </div>
          <div>
            <span class="text-muted-foreground">计划完成：</span
            >{{ formatDate(detail.plannedEndTime) }}
          </div>
          <div>
            <span class="text-muted-foreground">迭代：</span
            >{{ detail.iteration?.iterationName || '-' }}
          </div>
          <div>
            <span class="text-muted-foreground">里程碑：</span
            >{{ detail.milestone?.milestoneName || '-' }}
          </div>
        </div>
        <div>
          <h4 class="font-medium">需求描述</h4>
          <p class="whitespace-pre-wrap text-sm text-muted-foreground">
            {{ detail.description || '暂无描述' }}
          </p>
        </div>
        <div>
          <h4 class="font-medium">验收标准</h4>
          <p class="whitespace-pre-wrap text-sm text-muted-foreground">
            {{ detail.acceptanceCriteria || '暂无验收标准' }}
          </p>
        </div>
        <div v-if="detail.remark">
          <h4 class="font-medium">备注</h4>
          <p class="whitespace-pre-wrap text-sm text-muted-foreground">{{ detail.remark }}</p>
        </div>
      </div>
      <DialogFooter>
        <Button data-permission-neutral variant="outline" @click="open = false">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

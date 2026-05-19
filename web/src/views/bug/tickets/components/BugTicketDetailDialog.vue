<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
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
import SeverityBadge from '@/components/common/SeverityBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { BugTicket } from '@/api/bug/types'
import { formatDate } from '@/utils/format'
import { actionLabel } from '../../shared/bug-options'
import AttachmentList from './AttachmentList.vue'

const open = defineModel<boolean>('open', { required: true })
defineProps<{
  detail: BugTicket | null
}>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[90vh] max-w-5xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ detail?.ticketNo }} {{ detail?.title }}</DialogTitle>
        <DialogDescription>查看缺陷基础信息、复现内容、附件、评论和操作历史。</DialogDescription>
      </DialogHeader>
      <div v-if="detail" class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <StatusBadge domain="bug" :value="detail.status" />
          <PriorityBadge :value="detail.priority" />
          <SeverityBadge :value="detail.severity" />
          <Badge variant="outline">{{ detail.project?.projectName || '-' }}</Badge>
          <Badge v-if="detail.module?.moduleName" variant="outline">{{
            detail.module.moduleName
          }}</Badge>
        </div>
        <div class="grid gap-3 text-sm md:grid-cols-2">
          <div><span class="text-muted-foreground">提交人：</span>{{ detail.submitter?.nickName || detail.submitter?.userName || '-' }}</div>
          <div><span class="text-muted-foreground">负责人：</span>{{ detail.assignee?.nickName || detail.assignee?.userName || '-' }}</div>
          <div><span class="text-muted-foreground">验证人：</span>{{ detail.verifier?.nickName || detail.verifier?.userName || '-' }}</div>
          <div><span class="text-muted-foreground">期望完成：</span>{{ formatDate(detail.dueTime) }}</div>
          <div><span class="text-muted-foreground">版本：</span>{{ detail.version?.versionName || detail.version?.versionNo || '-' }}</div>
          <div><span class="text-muted-foreground">环境：</span>{{ detail.environment || '-' }}</div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h4 class="font-medium">问题描述</h4>
            <p class="whitespace-pre-wrap text-sm text-muted-foreground">
              {{ detail.description || '暂无问题描述' }}
            </p>
          </div>
          <div>
            <h4 class="font-medium">复现步骤</h4>
            <p class="whitespace-pre-wrap text-sm text-muted-foreground">
              {{ detail.reproduceSteps || '暂无复现步骤' }}
            </p>
          </div>
          <div>
            <h4 class="font-medium">期望结果</h4>
            <p class="whitespace-pre-wrap text-sm text-muted-foreground">
              {{ detail.expectedResult || '暂无期望结果' }}
            </p>
          </div>
          <div>
            <h4 class="font-medium">实际结果</h4>
            <p class="whitespace-pre-wrap text-sm text-muted-foreground">
              {{ detail.actualResult || '暂无实际结果' }}
            </p>
          </div>
        </div>
        <div v-if="detail.fixNote || detail.verifyNote" class="grid gap-4 md:grid-cols-2">
          <div v-if="detail.fixNote">
            <h4 class="font-medium">修复说明</h4>
            <p class="whitespace-pre-wrap text-sm text-muted-foreground">{{ detail.fixNote }}</p>
          </div>
          <div v-if="detail.verifyNote">
            <h4 class="font-medium">验证说明</h4>
            <p class="whitespace-pre-wrap text-sm text-muted-foreground">{{ detail.verifyNote }}</p>
          </div>
        </div>
        <div>
          <h4 class="mb-2 font-medium">附件</h4>
          <AttachmentList :attachments="detail.attachments || []" empty-text="暂无附件" />
        </div>
        <div>
          <h4 class="font-medium">评论</h4>
          <div v-if="detail.comments?.length" class="divide-y rounded-md border">
            <div v-for="comment in detail.comments" :key="comment.commentId" class="p-3 text-sm">
              <b>{{ comment.user?.nickName || comment.user?.userName || '-' }}</b>
              ：{{ comment.content }}
              <span class="text-muted-foreground">{{ formatDate(comment.createTime) }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">暂无评论</p>
        </div>
        <div>
          <h4 class="font-medium">操作历史</h4>
          <div v-if="detail.histories?.length" class="space-y-2">
            <div
              v-for="history in detail.histories"
              :key="history.historyId"
              class="text-sm text-muted-foreground"
            >
              {{ formatDate(history.createTime) }}
              {{ history.operator?.nickName || history.operator?.userName || '-' }}
              {{ actionLabel(history.action) }} {{ history.fromValue || '-' }} →
              {{ history.toValue || '-' }} {{ history.remark || '' }}
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">暂无操作历史</p>
        </div>
      </div>
      <DialogFooter>
        <Button data-permission-neutral variant="outline" @click="open = false">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/format'
import { sanitizeHtml } from '@/utils/sanitize'
import type { SysNotice } from '@/api/system/notice'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  notice: SysNotice | null
}>()

function getNoticeTypeLabel(type: string) {
  const map: Record<string, string> = { '1': '通知', '2': '公告' }
  return map[type] || '未知'
}

const sanitizedPreviewContent = computed(() => sanitizeHtml(props.notice?.noticeContent))
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="grid max-h-[90vh] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 sm:max-w-[600px]">
      <DialogHeader class="border-b bg-background px-6 py-4 pr-14">
        <DialogTitle>{{ props.notice?.noticeTitle }}</DialogTitle>
        <DialogDescription>
          <Badge variant="outline" class="mr-2">{{ getNoticeTypeLabel(props.notice?.noticeType || '1') }}</Badge>
          <span class="text-muted-foreground">{{ props.notice?.createBy }} 发布于 {{ formatDate(props.notice?.createTime) }}</span>
        </DialogDescription>
      </DialogHeader>
      <div class="prose prose-sm min-h-0 max-w-none overflow-y-auto overscroll-contain px-6 py-4 dark:prose-invert" v-html="sanitizedPreviewContent" />
      <DialogFooter class="border-t bg-background px-6 py-4">
        <Button variant="outline" @click="open = false">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

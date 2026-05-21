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
    <DialogContent class="sm:max-w-[600px] max-h-[90vh] flex flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle>{{ props.notice?.noticeTitle }}</DialogTitle>
        <DialogDescription>
          <Badge variant="outline" class="mr-2">{{ getNoticeTypeLabel(props.notice?.noticeType || '1') }}</Badge>
          <span class="text-muted-foreground">{{ props.notice?.createBy }} 发布于 {{ formatDate(props.notice?.createTime) }}</span>
        </DialogDescription>
      </DialogHeader>
      <div class="flex-1 overflow-y-auto py-4 prose prose-sm dark:prose-invert max-w-none" v-html="sanitizedPreviewContent" />
      <DialogFooter class="flex-shrink-0">
        <Button variant="outline" @click="open = false">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

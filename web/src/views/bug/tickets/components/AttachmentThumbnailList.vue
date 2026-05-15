<script setup lang="ts">
import type { BugAttachment } from '@/api/bug/types'
import { attachmentTypeLabel, attachmentUrl, formatFileSize, isImageAttachment, isVideoAttachment } from './attachment-utils'

const props = defineProps<{
  attachments: BugAttachment[]
  selectedIndex: number
  uploadable?: boolean
  uploading?: boolean
}>()

const emit = defineEmits<{
  (event: 'select', index: number): void
  (event: 'upload'): void
}>()
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between text-sm font-medium">
      <span>附件列表</span>
      <span class="text-xs text-muted-foreground">{{ attachments.length }} 个</span>
    </div>
    <div class="flex max-w-full gap-2 overflow-x-auto overflow-y-hidden pb-1">
      <button
        v-for="(item, index) in attachments"
        :key="item.attachmentId"
        type="button"
        class="h-28 w-32 shrink-0 rounded-lg border bg-background p-2 text-left transition hover:border-primary/60 hover:bg-muted/40"
        :class="index === selectedIndex ? 'border-primary ring-2 ring-primary/20' : ''"
        @click="emit('select', index)"
      >
        <div class="space-y-1">
          <div class="relative flex h-16 items-center justify-center overflow-hidden rounded bg-muted text-xs text-muted-foreground">
            <img v-if="isImageAttachment(item)" :src="attachmentUrl(item)" :alt="item.originalName" class="h-full w-full object-cover">
            <span v-else-if="isVideoAttachment(item)">视频</span>
            <span v-else>文件</span>
            <span v-if="index === selectedIndex" class="absolute right-1 top-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">✓</span>
          </div>
          <div class="flex items-center justify-between gap-1">
            <span class="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{{ attachmentTypeLabel(item) }}</span>
            <span class="text-[10px] text-muted-foreground">{{ formatFileSize(item.fileSize) || '-' }}</span>
          </div>
          <div class="truncate text-xs font-medium" :title="item.originalName">{{ item.originalName }}</div>
        </div>
      </button>
      <button
        v-if="props.uploadable"
        type="button"
        class="flex h-28 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-muted-foreground transition hover:border-primary/60 hover:bg-muted/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="props.uploading"
        @click="emit('upload')"
      >
        <span class="text-3xl leading-none">+</span>
        <span class="text-xs">{{ props.uploading ? '上传中...' : '添加附件' }}</span>
      </button>
    </div>
  </div>
</template>

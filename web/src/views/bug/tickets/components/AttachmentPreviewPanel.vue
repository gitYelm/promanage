<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import type { BugAttachment } from '@/api/bug/types'
import { attachmentTypeLabel, attachmentUrl, formatFileSize, isImageAttachment, isVideoAttachment } from './attachment-utils'

const props = withDefaults(defineProps<{
  attachments: BugAttachment[]
  selectedIndex: number
  removable?: boolean
}>(), {
  removable: false,
})

const emit = defineEmits<{
  (event: 'select', index: number): void
  (event: 'fullscreen'): void
  (event: 'remove', attachmentId: string): void
}>()

const current = computed(() => props.attachments[props.selectedIndex])
const hasMultiple = computed(() => props.attachments.length > 1)

function move(step: number) {
  if (!props.attachments.length) return
  const nextIndex = (props.selectedIndex + step + props.attachments.length) % props.attachments.length
  emit('select', nextIndex)
}

function openFullscreen() {
  if (current.value) emit('fullscreen')
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border bg-card">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span class="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">{{ attachmentTypeLabel(current) }}</span>
          <span class="text-xs text-muted-foreground">{{ selectedIndex + 1 }} / {{ attachments.length }}</span>
        </div>
        <div class="mt-1 truncate text-sm font-medium" :title="current?.originalName">{{ current?.originalName || '暂无附件' }}</div>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <button v-if="hasMultiple" type="button" class="rounded-md border px-2 py-1 hover:bg-muted" @click="move(-1)">‹</button>
        <button v-if="hasMultiple" type="button" class="rounded-md border px-2 py-1 hover:bg-muted" @click="move(1)">›</button>
      </div>
    </div>

    <div
      v-if="current"
      class="group relative flex min-h-[26rem] cursor-zoom-in items-center justify-center bg-muted/40 p-3 outline-none"
      role="button"
      tabindex="0"
      title="点击打开全屏预览"
      @click="openFullscreen"
      @keydown.enter.prevent="openFullscreen"
      @keydown.space.prevent="openFullscreen"
    >
      <button v-if="hasMultiple" type="button" class="absolute left-3 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full bg-background/90 text-xl shadow hover:bg-background" @click.stop="move(-1)">‹</button>
      <img v-if="isImageAttachment(current)" :src="attachmentUrl(current)" :alt="current.originalName" class="max-h-[32rem] max-w-full object-contain">
      <video v-else-if="isVideoAttachment(current)" :src="attachmentUrl(current)" controls class="max-h-[32rem] max-w-full object-contain" @click.stop />
      <div v-else class="space-y-3 text-center">
        <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-background text-sm text-muted-foreground shadow">文件</div>
        <div class="text-sm font-medium">{{ current.originalName }}</div>
        <a :href="attachmentUrl(current)" target="_blank" class="text-primary underline" @click.stop>打开附件</a>
      </div>
      <button v-if="hasMultiple" type="button" class="absolute right-3 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full bg-background/90 text-xl shadow hover:bg-background" @click.stop="move(1)">›</button>
      <div class="pointer-events-none absolute bottom-3 rounded bg-background/90 px-3 py-1 text-xs opacity-0 shadow transition group-hover:opacity-100">点击全屏预览</div>
    </div>

    <div v-if="current" class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <div class="min-w-0 text-muted-foreground">
        <span>类型：{{ attachmentTypeLabel(current) }}</span>
        <span class="mx-2">·</span>
        <span>大小：{{ formatFileSize(current.fileSize) || '未知' }}</span>
        <span class="mx-2">·</span>
        <span>状态：已上传</span>
      </div>
      <div class="flex shrink-0 items-center gap-3">
        <button type="button" class="text-primary underline" @click="openFullscreen">查看全屏</button>
        <a :href="attachmentUrl(current)" target="_blank" class="text-primary underline">打开原文件</a>
        <Button v-if="removable" type="button" variant="link" class="h-auto p-0 text-destructive" permission="bug:attachment:remove" @click="emit('remove', current.attachmentId)">移除</Button>
      </div>
    </div>
  </div>
</template>

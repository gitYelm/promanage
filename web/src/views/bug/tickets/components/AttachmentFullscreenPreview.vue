<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import type { BugAttachment } from '@/api/bug/types'
import { attachmentTypeLabel, attachmentUrl, formatFileSize, isImageAttachment, isVideoAttachment } from './attachment-utils'

const props = defineProps<{
  open: boolean
  attachments: BugAttachment[]
  selectedIndex: number
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'select', index: number): void
}>()

const current = computed(() => props.attachments[props.selectedIndex])
const hasMultiple = computed(() => props.attachments.length > 1)

function move(step: number) {
  if (!props.attachments.length) return
  const nextIndex = (props.selectedIndex + step + props.attachments.length) % props.attachments.length
  emit('select', nextIndex)
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.open || !current.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
  }
  if (event.key === 'ArrowLeft' && hasMultiple.value) {
    event.preventDefault()
    move(-1)
  }
  if (event.key === 'ArrowRight' && hasMultiple.value) {
    event.preventDefault()
    move(1)
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="open && current" class="fixed inset-0 z-[110] flex flex-col bg-black/95 text-slate-200" @click.self="emit('close')">
      <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div class="min-w-0">
          <div class="text-sm text-slate-400">全屏预览 {{ selectedIndex + 1 }} / {{ attachments.length }}</div>
          <div class="truncate font-medium" :title="current.originalName">{{ current.originalName }}</div>
        </div>
        <button type="button" class="rounded px-3 py-1 text-2xl leading-none hover:bg-white/10" aria-label="关闭全屏预览" @click="emit('close')">×</button>
      </div>

      <div class="relative flex min-h-0 flex-1 items-center justify-center p-4">
        <button v-if="hasMultiple" type="button" class="absolute left-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-3xl hover:bg-white/20" @click="move(-1)">‹</button>
        <img v-if="isImageAttachment(current)" :src="attachmentUrl(current)" :alt="current.originalName" class="max-h-full max-w-full object-contain">
        <video v-else-if="isVideoAttachment(current)" :src="attachmentUrl(current)" controls autoplay class="max-h-full max-w-full object-contain" />
        <div v-else class="space-y-4 text-center">
          <div class="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-white/10 text-slate-400">文件</div>
          <a :href="attachmentUrl(current)" target="_blank" class="text-slate-200 underline">打开附件</a>
        </div>
        <button v-if="hasMultiple" type="button" class="absolute right-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-3xl hover:bg-white/20" @click="move(1)">›</button>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-sm text-slate-300">
        <div>{{ attachmentTypeLabel(current) }} · {{ formatFileSize(current.fileSize) || '未知大小' }}</div>
        <a :href="attachmentUrl(current)" target="_blank" class="underline">下载/打开原文件</a>
      </div>
    </div>
  </Teleport>
</template>

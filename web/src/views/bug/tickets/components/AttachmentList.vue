<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { BugAttachment } from '@/api/bug/types'
import { hasAnyPermission } from '@/composables/usePermission'
import AttachmentFullscreenPreview from './AttachmentFullscreenPreview.vue'
import AttachmentPreviewPanel from './AttachmentPreviewPanel.vue'
import AttachmentThumbnailList from './AttachmentThumbnailList.vue'

const props = withDefaults(defineProps<{
  attachments: BugAttachment[]
  removable?: boolean
  uploadable?: boolean
  uploading?: boolean
  emptyText?: string
}>(), {
  removable: false,
  uploadable: false,
  uploading: false,
  emptyText: '还没有上传附件',
})

const emit = defineEmits<{
  (event: 'remove', attachmentId: string): void
  (event: 'upload'): void
}>()

const selectedIndex = ref(0)
const fullscreenOpen = ref(false)
const canUpload = computed(() => props.uploadable && hasAnyPermission(['bug:attachment:upload']))
const canRemove = computed(() => props.removable && hasAnyPermission(['bug:attachment:remove']))

watch(
  () => props.attachments.length,
  (length) => {
    if (!length) selectedIndex.value = 0
    else if (selectedIndex.value > length - 1) selectedIndex.value = length - 1
  },
  { immediate: true },
)

function selectAttachment(index: number) {
  if (index < 0 || index >= props.attachments.length) return
  selectedIndex.value = index
}
</script>

<template>
  <div v-if="attachments.length || canUpload" class="rounded-xl border bg-background p-3 sm:p-4">
    <div v-if="attachments.length" class="space-y-4">
      <AttachmentPreviewPanel
        :attachments="attachments"
        :selected-index="selectedIndex"
        :removable="canRemove"
        @select="selectAttachment"
        @fullscreen="fullscreenOpen = true"
        @remove="emit('remove', $event)"
      />
      <AttachmentThumbnailList
        :attachments="attachments"
        :selected-index="selectedIndex"
        :uploadable="canUpload"
        :uploading="uploading"
        @select="selectAttachment"
        @upload="emit('upload')"
      />
    </div>
    <div v-else class="space-y-4">
      <div class="flex min-h-[18rem] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-4 text-center text-sm text-muted-foreground">
        {{ emptyText }}，点击下方 + 添加附件
      </div>
      <AttachmentThumbnailList
        :attachments="attachments"
        :selected-index="selectedIndex"
        :uploadable="canUpload"
        :uploading="uploading"
        @select="selectAttachment"
        @upload="emit('upload')"
      />
    </div>
    <AttachmentFullscreenPreview
      :open="fullscreenOpen"
      :attachments="attachments"
      :selected-index="selectedIndex"
      @select="selectAttachment"
      @close="fullscreenOpen = false"
    />
  </div>
  <p v-else class="rounded-xl border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">{{ emptyText }}</p>
</template>

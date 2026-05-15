<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast/use-toast'
import { uploadBugAttachment } from '@/api/bug'
import type { BugAttachment } from '@/api/bug/types'
import ImageAnnotator from './ImageAnnotator.vue'
import AttachmentList from './AttachmentList.vue'

const props = defineProps<{
  modelValue: BugAttachment[]
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: BugAttachment[]): void
  (event: 'uploading-change', value: boolean): void
}>()

const { toast } = useToast()
const annotatorRef = ref<InstanceType<typeof ImageAnnotator> | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const fileInputKey = ref(0)
const uploading = ref(false)
const processing = ref(false)
const showAnnotator = ref(false)
const pendingImage = ref<File | null>(null)
const pendingQueue = ref<File[]>([])
const keepOriginalImage = ref(false)

const attachments = computed({
  get: () => props.modelValue,
  set: (value: BugAttachment[]) => emit('update:modelValue', value),
})

const pendingCount = computed(() => pendingQueue.value.length + (pendingImage.value ? 1 : 0))

function setUploading(value: boolean) {
  uploading.value = value
  emit('uploading-change', value)
}

function appendAttachments(items: BugAttachment[]) {
  attachments.value = [...attachments.value, ...items]
}

async function handleFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) return
  pendingQueue.value.push(...files)
  resetFileInput(input)
  await processNextFile()
}

function openFilePicker() {
  if (uploading.value) return
  fileInputRef.value?.click()
}

async function processNextFile() {
  if (processing.value || showAnnotator.value || pendingImage.value) return
  const file = pendingQueue.value.shift()
  if (!file) return

  if (file.type.startsWith('image/')) {
    keepOriginalImage.value = false
    pendingImage.value = file
    showAnnotator.value = true
    await nextTick()
    annotatorRef.value?.loadFile(file)
    return
  }

  processing.value = true
  setUploading(true)
  try {
    const attachment = await uploadBugAttachment(file)
    appendAttachments([attachment])
    toast({ title: '附件已上传', description: file.name })
  } catch {
    toast({ title: '上传失败', description: `${file.name} 上传失败，请重新选择文件`, variant: 'destructive' })
  } finally {
    processing.value = false
    setUploading(false)
    resetFileInput()
    await processNextFile()
  }
}

async function saveAnnotated(file: File & { annotationData?: string }) {
  const sourceImage = pendingImage.value
  showAnnotator.value = false
  pendingImage.value = null
  processing.value = true
  setUploading(true)

  try {
    const uploadedItems: BugAttachment[] = []
    // 默认只上传标注图；只有用户明确勾选时才额外保留原图，避免附件列表重复干扰问题定位。
    const original = sourceImage && keepOriginalImage.value ? await uploadBugAttachment(sourceImage) : null
    if (original) uploadedItems.push(original)

    const annotated = await uploadBugAttachment(file, {
      attachmentType: 'annotated_image',
      ...(original ? { originalAttachmentId: original.attachmentId } : {}),
      ...(file.annotationData ? { annotationData: file.annotationData } : {}),
    })
    uploadedItems.push(annotated)
    appendAttachments(uploadedItems)
    toast({
      title: '截图已上传',
      description: original ? '原图和标注图已保存为附件' : '已保存标注图，如需原图请在标注窗口勾选保留原图',
    })
  } catch {
    toast({ title: '上传失败', description: '截图标注图上传失败，请重新选择图片上传', variant: 'destructive' })
  } finally {
    processing.value = false
    setUploading(false)
    keepOriginalImage.value = false
    resetFileInput()
    await processNextFile()
  }
}

function cancelAnnotator() {
  showAnnotator.value = false
  pendingImage.value = null
  keepOriginalImage.value = false
  // 用户主动关闭时清空本轮待处理队列，避免关闭后多图队列继续弹窗造成“关不掉”的体验。
  pendingQueue.value = []
  processing.value = false
  setUploading(false)
  resetFileInput()
}

function resetFileInput(input?: HTMLInputElement) {
  if (input) input.value = ''
  fileInputKey.value += 1
}

function removeAttachment(id: string) {
  attachments.value = attachments.value.filter((item) => item.attachmentId !== id)
}

</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <Label>附件</Label>
      <span v-if="uploading" class="text-xs text-muted-foreground">正在上传，请稍候...</span>
      <span v-else-if="pendingCount" class="text-xs text-muted-foreground">待处理 {{ pendingCount }} 个文件</span>
    </div>

    <input
      ref="fileInputRef"
      :key="fileInputKey"
      type="file"
      multiple
      accept="image/*,video/mp4,video/webm,video/ogg,.txt,.log,.json"
      :disabled="uploading"
      class="sr-only"
      aria-hidden="true"
      tabindex="-1"
      @change="handleFiles"
    >
    <p class="text-xs text-muted-foreground">图片会先进入标注窗口，默认只上传标注图；点击附件列表末尾的 + 可继续添加附件。</p>

    <AttachmentList
      :attachments="attachments"
      :uploading="uploading"
      removable
      uploadable
      @remove="removeAttachment"
      @upload="openFilePicker"
    />

    <Teleport to="body">
      <div v-if="showAnnotator" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" @click.self="cancelAnnotator">
        <div class="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg border bg-background p-6 shadow-lg" role="dialog" aria-modal="true" aria-labelledby="bug-annotator-title">
          <div class="mb-4 flex items-center justify-between gap-4">
            <h3 id="bug-annotator-title" class="text-lg font-semibold leading-none">截图标注</h3>
            <button type="button" class="rounded-sm px-2 py-1 text-xl leading-none opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring" aria-label="关闭截图标注窗口" @click.stop="cancelAnnotator">
              ×
            </button>
          </div>
          <div class="mb-3 rounded-md border border-dashed p-3 text-sm">
            <label class="flex cursor-pointer items-center gap-2">
              <input v-model="keepOriginalImage" type="checkbox" class="h-4 w-4 rounded border-input">
              <span>同时保留原图</span>
            </label>
            <p class="mt-1 text-xs text-muted-foreground">默认只上传标注后的图片，勾选后会额外上传未标注原图。</p>
          </div>
          <ImageAnnotator ref="annotatorRef" @save="saveAnnotated" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

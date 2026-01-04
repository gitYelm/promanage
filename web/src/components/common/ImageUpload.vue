<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import request from '@/utils/request'

const props = defineProps<{
  modelValue: string
  accept?: string
  maxSize?: number // MB
  uploadUrl?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { toast } = useToast()
const uploading = ref(false)
const fileInput = ref<HTMLInputElement>()

const accept = computed(() => props.accept || 'image/*,.ico')
const maxSize = computed(() => props.maxSize || 2)
const uploadUrl = computed(() => props.uploadUrl || '/upload/system')

const previewUrl = computed(() => {
  if (!props.modelValue) return ''
  // 如果是相对路径，加上 API 前缀
  if (props.modelValue.startsWith('/')) {
    return import.meta.env.VITE_API_URL + props.modelValue
  }
  return props.modelValue
})

function triggerUpload() {
  fileInput.value?.click()
}

// 根据 accept 属性解析允许的格式
function parseAcceptFormats(): { mimes: string[]; exts: string[]; desc: string } {
  const acceptStr = accept.value
  const mimes: string[] = []
  const exts: string[] = []
  const descParts: string[] = []

  // 如果是 image/* 通配符，允许所有图片
  if (acceptStr.includes('image/*')) {
    mimes.push('image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml')
    exts.push('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg')
    descParts.push('JPG', 'PNG', 'GIF', 'WebP', 'SVG')
  } else {
    // 解析具体的 MIME 类型和扩展名
    if (
      acceptStr.includes('image/jpeg') ||
      acceptStr.includes('.jpg') ||
      acceptStr.includes('.jpeg')
    ) {
      mimes.push('image/jpeg')
      exts.push('jpg', 'jpeg')
      if (!descParts.includes('JPG')) descParts.push('JPG')
    }
    if (acceptStr.includes('image/png') || acceptStr.includes('.png')) {
      mimes.push('image/png')
      exts.push('png')
      if (!descParts.includes('PNG')) descParts.push('PNG')
    }
    if (acceptStr.includes('image/gif') || acceptStr.includes('.gif')) {
      mimes.push('image/gif')
      exts.push('gif')
      descParts.push('GIF')
    }
    if (acceptStr.includes('image/webp') || acceptStr.includes('.webp')) {
      mimes.push('image/webp')
      exts.push('webp')
      descParts.push('WebP')
    }
    if (acceptStr.includes('image/svg') || acceptStr.includes('.svg')) {
      mimes.push('image/svg+xml')
      exts.push('svg')
      descParts.push('SVG')
    }
  }

  // ICO 格式
  if (acceptStr.includes('.ico') || acceptStr.includes('image/x-icon')) {
    mimes.push('image/x-icon', 'image/vnd.microsoft.icon')
    exts.push('ico')
    descParts.push('ICO')
  }

  return { mimes, exts, desc: descParts.join('、') }
}

// 校验文件格式
function validateFileType(file: File): { valid: boolean; desc: string } {
  const { mimes, exts, desc } = parseAcceptFormats()

  // 检查 MIME 类型
  if (mimes.includes(file.type)) {
    return { valid: true, desc }
  }

  // 检查文件扩展名（兜底）
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext && exts.includes(ext)) {
    return { valid: true, desc }
  }

  return { valid: false, desc }
}

async function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 检查文件格式
  const { valid, desc } = validateFileType(file)
  if (!valid) {
    toast({
      title: '格式不支持',
      description: `请上传 ${desc} 格式的文件`,
      variant: 'destructive',
    })
    target.value = ''
    return
  }

  // 检查文件大小
  if (file.size > maxSize.value * 1024 * 1024) {
    toast({
      title: '文件过大',
      description: `文件大小不能超过 ${maxSize.value}MB`,
      variant: 'destructive',
    })
    target.value = ''
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await request.post(uploadUrl.value, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    emit('update:modelValue', res.data.url)
    toast({ title: '上传成功' })
  } catch {
    toast({ title: '上传失败', description: '请稍后重试', variant: 'destructive' })
  } finally {
    uploading.value = false
    // 清空 input，允许重复上传同一文件
    target.value = ''
  }
}

function handleRemove() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="space-y-2">
    <input ref="fileInput" type="file" :accept="accept" class="hidden" @change="handleFileChange" />

    <!-- 预览区域 -->
    <div v-if="modelValue" class="relative inline-block rounded-lg border bg-muted/50 p-2">
      <img :src="previewUrl" alt="preview" class="h-16 w-auto object-contain" />
      <button
        type="button"
        class="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
        @click="handleRemove"
      >
        <X class="h-3 w-3" />
      </button>
    </div>

    <!-- 上传按钮 -->
    <Button type="button" variant="outline" size="sm" :disabled="uploading" @click="triggerUpload">
      <Loader2 v-if="uploading" class="mr-2 h-4 w-4 animate-spin" />
      <Upload v-else class="mr-2 h-4 w-4" />
      {{ uploading ? '上传中...' : '选择文件' }}
    </Button>
  </div>
</template>

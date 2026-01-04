<script setup lang="ts">
import { ref } from 'vue'
import { DownloadIcon, Loader2Icon, CheckIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ExportFormat = 'xlsx' | 'csv' | 'json'

interface Props {
  /** 按钮文字 */
  text?: string
  /** 支持的导出格式 */
  formats?: ExportFormat[]
  /** 是否禁用 */
  disabled?: boolean
  /** 按钮变体 */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  /** 按钮大小 */
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

interface Emits {
  (e: 'export', format: ExportFormat): Promise<void> | void
}

const props = withDefaults(defineProps<Props>(), {
  text: '导出',
  formats: () => ['xlsx'],
  disabled: false,
  variant: 'outline',
  size: 'default',
})

const emit = defineEmits<Emits>()

const loading = ref(false)
const success = ref(false)

const formatLabels: Record<ExportFormat, string> = {
  xlsx: 'Excel (.xlsx)',
  csv: 'CSV (.csv)',
  json: 'JSON (.json)',
}

async function handleExport(format: ExportFormat) {
  if (loading.value || props.disabled) return

  loading.value = true
  success.value = false

  try {
    await emit('export', format)
    success.value = true
    setTimeout(() => {
      success.value = false
    }, 2000)
  } finally {
    loading.value = false
  }
}

// 单一格式直接导出，多格式显示下拉菜单
const isSingleFormat = props.formats.length === 1
</script>

<template>
  <!-- 单一格式：直接按钮 -->
  <Button
    v-if="isSingleFormat"
    :variant="variant"
    :size="size"
    :disabled="disabled || loading"
    @click="handleExport(formats[0]!)"
  >
    <Loader2Icon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
    <CheckIcon v-else-if="success" class="mr-2 h-4 w-4 text-green-500" />
    <DownloadIcon v-else class="mr-2 h-4 w-4" />
    {{ text }}
  </Button>

  <!-- 多格式：下拉菜单 -->
  <DropdownMenu v-else>
    <DropdownMenuTrigger as-child>
      <Button :variant="variant" :size="size" :disabled="disabled || loading">
        <Loader2Icon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        <CheckIcon v-else-if="success" class="mr-2 h-4 w-4 text-green-500" />
        <DownloadIcon v-else class="mr-2 h-4 w-4" />
        {{ text }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem v-for="format in formats" :key="format" @click="handleExport(format)">
        {{ formatLabels[format] }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AlertTriangleIcon } from 'lucide-vue-next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  /** 是否显示 */
  open: boolean
  /** 标题 */
  title?: string
  /** 描述内容 */
  description?: string
  /** 确认按钮文字 */
  confirmText?: string
  /** 取消按钮文字 */
  cancelText?: string
  /** 是否为危险操作 */
  destructive?: boolean
  /** 敏感操作需要输入的确认文字 */
  confirmInput?: string
  /** 确认输入提示 */
  confirmInputPlaceholder?: string
  /** 是否加载中 */
  loading?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  description: '确定要执行此操作吗？',
  confirmText: '确认',
  cancelText: '取消',
  destructive: false,
  confirmInput: '',
  confirmInputPlaceholder: '',
  loading: false,
})

const emit = defineEmits<Emits>()

const inputValue = ref('')

// 是否需要输入确认
const needConfirmInput = computed(() => !!props.confirmInput)

// 确认按钮是否可用
const canConfirm = computed(() => {
  if (props.loading) return false
  if (needConfirmInput.value) {
    return inputValue.value === props.confirmInput
  }
  return true
})

// 重置输入
watch(
  () => props.open,
  (val) => {
    if (!val) {
      inputValue.value = ''
    }
  },
)

function handleConfirm() {
  if (!canConfirm.value) return
  emit('confirm')
}

function handleCancel() {
  emit('update:open', false)
  emit('cancel')
}

function handleOpenChange(val: boolean) {
  emit('update:open', val)
}
</script>

<template>
  <AlertDialog :open="open" @update:open="handleOpenChange">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2">
          <AlertTriangleIcon v-if="destructive" class="h-5 w-5 text-destructive" />
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ description }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <!-- 敏感操作确认输入 -->
      <div v-if="needConfirmInput" class="space-y-2 py-2">
        <Label class="text-sm text-muted-foreground">
          请输入 <span class="font-medium text-foreground">{{ confirmInput }}</span> 以确认操作
        </Label>
        <Input
          v-model="inputValue"
          :placeholder="confirmInputPlaceholder || `请输入 ${confirmInput}`"
          :disabled="loading"
        />
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="loading" @click="handleCancel">
          {{ cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction
          :disabled="!canConfirm"
          :class="
            destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''
          "
          @click="handleConfirm"
        >
          <span
            v-if="loading"
            class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {{ confirmText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

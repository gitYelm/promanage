<script setup lang="ts">
import { ref } from 'vue'
import { Switch } from '@/components/ui/switch'
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
import { useToast } from '@/components/ui/toast/use-toast'

const props = withDefaults(
  defineProps<{
    /** 当前状态值 "0"=启用 "1"=停用 */
    status: string
    /** 切换状态的 API 调用 */
    onToggle: (newStatus: string) => Promise<unknown>
    /** 操作对象名称，用于 toast 提示，如"用户"、"部门" */
    name?: string
    /** 自定义提示文案 */
    labels?: { enable: string; disable: string }
    /** 是否禁用 */
    disabled?: boolean
    /** 是否需要确认弹窗 */
    confirm?: boolean
    /** 确认弹窗标题（支持 {action} 占位符） */
    confirmTitle?: string
    /** 确认弹窗描述（支持 {action} 占位符） */
    confirmDescription?: string
  }>(),
  {
    name: '',
    labels: () => ({ enable: '启用', disable: '停用' }),
    disabled: false,
    confirm: false,
    confirmTitle: '确认{action}',
    confirmDescription: '确定要{action}吗？',
  },
)

const emit = defineEmits<{
  'update:status': [status: string]
}>()

const { toast } = useToast()
const loading = ref(false)
const showConfirm = ref(false)
const pendingStatus = ref('')

function getActionText(newStatus: string) {
  return newStatus === '0' ? props.labels.enable : props.labels.disable
}

function handleClick() {
  if (loading.value || props.disabled) return

  const newStatus = props.status === '0' ? '1' : '0'

  if (props.confirm) {
    pendingStatus.value = newStatus
    showConfirm.value = true
  } else {
    doToggle(newStatus)
  }
}

async function doToggle(newStatus: string) {
  loading.value = true

  try {
    await props.onToggle(newStatus)
    emit('update:status', newStatus)
    const label = newStatus === '0' ? props.labels.enable : props.labels.disable
    const desc = props.name ? `${props.name}已${label}` : `已${label}`
    toast({ title: '操作成功', description: desc })
  } catch (error) {
    console.error('状态切换失败:', error)
  } finally {
    loading.value = false
  }
}

async function handleConfirm() {
  showConfirm.value = false
  await doToggle(pendingStatus.value)
}

function handleCancel() {
  showConfirm.value = false
  pendingStatus.value = ''
}

function formatText(template: string, action: string) {
  return template.replace('{action}', action)
}
</script>

<template>
  <div>
    <Switch
      :checked="status === '0'"
      :disabled="loading || disabled"
      @click.prevent="handleClick"
    />

    <AlertDialog :open="showConfirm" @update:open="(v) => !v && handleCancel()">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{
            formatText(confirmTitle, getActionText(pendingStatus))
          }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ formatText(confirmDescription, getActionText(pendingStatus)) }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="handleCancel">取消</AlertDialogCancel>
          <AlertDialogAction @click="handleConfirm">确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

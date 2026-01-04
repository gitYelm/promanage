<script setup lang="ts">
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

interface Props {
  open: boolean
  title?: string
  description?: string
  cancelText?: string
  confirmText?: string
}

withDefaults(defineProps<Props>(), {
  title: '确认离开？',
  description: '您有未保存的更改，离开后将丢失这些修改。',
  cancelText: '继续编辑',
  confirmText: '放弃更改',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

const handleCancel = () => {
  emit('update:open', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('update:open', false)
  emit('confirm')
}
</script>

<template>
  <AlertDialog :open="open" @update:open="$emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ description }}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="handleCancel">{{ cancelText }}</AlertDialogCancel>
        <AlertDialogAction @click="handleConfirm">{{ confirmText }}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

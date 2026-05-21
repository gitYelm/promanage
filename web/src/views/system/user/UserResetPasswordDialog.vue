<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import PasswordInput from '@/components/common/PasswordInput.vue'
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
import type { SysUser } from '@/api/system/types'

const open = defineModel<boolean>('open', { required: true })
const password = defineModel<string>('password', { required: true })
defineProps<{ user: SysUser | null }>()
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>重置密码</AlertDialogTitle>
        <AlertDialogDescription>为用户 "{{ user?.userName }}" 重置密码</AlertDialogDescription>
      </AlertDialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="newPassword">新密码</Label>
          <PasswordInput v-model="password" placeholder="请输入新密码" />
        </div>
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction @click="emit('confirm')"> 确定 </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Settings } from 'lucide-vue-next'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'open-settings': []
  'open-edit-dialog': [userId: string]
}>()

const userStore = useUserStore()

// 监听对话框打开，确保用户信息已加载
watch(
  () => props.open,
  async (newVal) => {
    if (newVal && !userStore.userId) {
      try {
        await userStore.getInfo()
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }
  }
)

// 获取完整的头像URL
function getAvatarUrl(avatar: string | undefined | null): string {
  if (!avatar) return ''
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  return `${import.meta.env.VITE_API_URL}${avatar}`
}

// 编辑资料 - 触发父组件打开编辑对话框
const handleEdit = () => {
  if (!userStore.userId) {
    console.error('用户ID不存在，无法编辑资料')
    return
  }
  emit('update:open', false)
  emit('open-edit-dialog', userStore.userId)
}

// 打开设置
const handleSettings = () => {
  emit('update:open', false)
  emit('open-settings')
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>个人资料</DialogTitle>
        <DialogDescription> 查看和管理您的个人信息 </DialogDescription>
      </DialogHeader>
      <div class="space-y-6 py-4">
        <!-- 头像和基本信息 -->
        <div class="flex items-start gap-6 p-4 border rounded-lg">
          <Avatar class="h-20 w-20">
            <AvatarImage :src="getAvatarUrl(userStore.avatar)" />
            <AvatarFallback>{{ userStore.name?.slice(0, 2).toUpperCase() }}</AvatarFallback>
          </Avatar>
          <div class="flex-1 space-y-3">
            <div>
              <h3 class="text-lg font-semibold">{{ userStore.name }}</h3>
              <p class="text-sm text-muted-foreground">{{ userStore.email || '未设置邮箱' }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Badge v-for="role in userStore.roleList" :key="role.roleId" variant="secondary">
                {{ role.roleName }}
              </Badge>
              <span v-if="userStore.roleList.length === 0" class="text-sm text-muted-foreground">
                暂无角色
              </span>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="grid grid-cols-2 gap-4">
          <Button variant="outline" @click="handleEdit">
            <User class="mr-2 h-4 w-4" />
            编辑资料
          </Button>
          <Button variant="outline" @click="handleSettings">
            <Settings class="mr-2 h-4 w-4" />
            系统设置
          </Button>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="emit('update:open', false)">关闭</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

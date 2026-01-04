<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast/use-toast'
import { useUserStore } from '@/stores/modules/user'
import { useAppStore } from '@/stores/modules/app'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut } from 'lucide-vue-next'

const router = useRouter()
const { toast } = useToast()
const userStore = useUserStore()

const showLogoutDialog = ref(false)

const handleLogoutClick = () => {
  showLogoutDialog.value = true
}

const confirmLogout = async () => {
  const appStore = useAppStore()
  const loginPath = appStore.siteConfig.loginPath || '/login'
  await userStore.logout()
  toast({ title: '退出成功', description: '您已安全退出系统' })
  router.push(loginPath)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="hidden p-0 h-8 w-8 rounded-lg">
        <Avatar class="h-8 w-8 rounded-lg">
          <AvatarImage :src="userStore.avatar" :alt="userStore.name" />
          <AvatarFallback class="rounded-lg">{{
            userStore.name ? userStore.name.slice(0, 2).toUpperCase() : 'AD'
          }}</AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-40">
      <DropdownMenuLabel class="p-0 font-normal">
        <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar class="h-8 w-8 rounded-lg">
            <AvatarImage :src="userStore.avatar" :alt="userStore.name" />
            <AvatarFallback class="rounded-lg">{{
              userStore.name ? userStore.name.slice(0, 2).toUpperCase() : 'AD'
            }}</AvatarFallback>
          </Avatar>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-semibold">{{ userStore.name || 'Admin' }}</span>
            <span class="truncate text-xs text-muted-foreground">admin@example.com</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem>个人中心</DropdownMenuItem>
      <DropdownMenuItem>设置</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogoutClick">
        <LogOut class="mr-2 h-4 w-4" />
        退出登录
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <!-- 退出登录确认对话框 -->
  <AlertDialog :open="showLogoutDialog" @update:open="showLogoutDialog = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认退出</AlertDialogTitle>
        <AlertDialogDescription>
          您确定要退出登录吗？退出后需要重新登录才能访问系统。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction @click="confirmLogout">确认退出</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

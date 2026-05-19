<script setup lang="ts">
import { ChevronsUpDown, LogOut, User } from 'lucide-vue-next'
import { useUserStore } from '@/stores/modules/user'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useLayoutHelpers } from '../composables/useLayoutHelpers'

defineProps<{ collapsed?: boolean; mobile?: boolean }>()
const emit = defineEmits<{ profile: []; logout: [] }>()
const userStore = useUserStore()
const { getAvatarUrl } = useLayoutHelpers()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        :class="
          cn(
            'flex w-full items-center gap-2 h-auto py-2',
            mobile ? 'justify-between px-2' : collapsed ? 'justify-center px-0' : 'justify-between px-2',
          )
        "
      >
        <div :class="cn('flex items-center overflow-hidden', mobile ? 'gap-3' : 'gap-2')">
          <Avatar :class="cn(mobile ? 'h-9 w-9' : 'h-8 w-8', 'rounded-lg')">
            <AvatarImage :src="getAvatarUrl(userStore.avatar)" :alt="userStore.name" />
            <AvatarFallback class="rounded-lg">{{ userStore.name ? userStore.name.slice(0, 2).toUpperCase() : 'AD' }}</AvatarFallback>
          </Avatar>
          <div v-if="!collapsed" class="flex min-w-0 flex-col items-start text-left text-sm leading-tight">
            <span class="w-full truncate font-semibold">{{ userStore.name || 'Admin' }}</span>
            <span class="w-full truncate text-xs text-muted-foreground">{{ userStore.email || '暂无邮箱' }}</span>
          </div>
        </div>
        <ChevronsUpDown v-if="!collapsed" class="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-[--radix-dropdown-menu-trigger-width] min-w-48 rounded-lg" :side="mobile ? 'top' : 'bottom'" :align="mobile ? 'start' : 'end'" :side-offset="4">
      <DropdownMenuLabel class="p-0 font-normal">
        <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar class="h-8 w-8 rounded-lg">
            <AvatarImage :src="getAvatarUrl(userStore.avatar)" :alt="userStore.name" />
            <AvatarFallback class="rounded-lg">{{ userStore.name ? userStore.name.slice(0, 2).toUpperCase() : 'AD' }}</AvatarFallback>
          </Avatar>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-semibold">{{ userStore.name || 'Admin' }}</span>
            <span class="truncate text-xs text-muted-foreground">{{ userStore.email || '暂无邮箱' }}</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem data-permission-neutral @click="emit('profile')"><User class="mr-2 h-4 w-4" />个人中心</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem data-permission-neutral class="text-destructive focus:text-destructive" @click="emit('logout')">
        <LogOut class="mr-2 h-4 w-4" />退出登录
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

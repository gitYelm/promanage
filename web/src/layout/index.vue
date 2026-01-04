<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import ThemeCustomizer from '@/components/ThemeCustomizer.vue'
import ProfileDialog from '@/components/ProfileDialog.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import { useUserStore } from '@/stores/modules/user'
import { useAppStore } from '@/stores/modules/app'
import { useMenuStore } from '@/stores/modules/menu'
import { useThemeStore } from '@/stores/theme'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  User,
  PanelLeft,
  Package2,
  LogOut,
  ChevronsUpDown
} from 'lucide-vue-next'
import * as icons from 'lucide-vue-next'
import UserMenuButton from '@/components/UserMenuButton.vue'
import DynamicMenu from '@/components/DynamicMenu.vue'
import TabsView from '@/components/TabsView.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const menuStore = useMenuStore()
const themeStore = useThemeStore()
const { toast } = useToast()

// 使用 store 的折叠状态（持久化）
const isCollapsed = computed({
  get: () => appStore.sidebarCollapsed,
  set: (val) => appStore.setSidebarCollapsed(val)
})

// 菜单模式
const isNormalMode = computed(() => themeStore.menuMode === 'normal')
const isTopMode = computed(() => themeStore.menuMode === 'top')
const isMixedMode = computed(() => themeStore.menuMode === 'mixed')

// 混合模式下当前选中的一级菜单
const activeTopMenu = ref<string>('')

// 混合模式下的二级菜单
const mixedSubMenus = computed(() => {
  if (!isMixedMode.value || !activeTopMenu.value) return []
  const topMenu = menuStore.menuList.find(m => m.path === activeTopMenu.value)
  return topMenu?.children || []
})

// 监听路由变化，更新混合模式下的一级菜单选中状态
watch(() => route.path, (path) => {
  if (isMixedMode.value) {
    const topMenu = menuStore.menuList.find(m => 
      path.startsWith(m.path) || m.children?.some(c => path === (c.path.startsWith('/') ? c.path : `${m.path}/${c.path}`))
    )
    if (topMenu) {
      activeTopMenu.value = topMenu.path
    }
  }
}, { immediate: true })

// 图标工具函数
function toPascalCase(str: string): string {
  if (!str) return ''
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
}

function getIcon(iconName: string) {
  if (!iconName) return icons.Settings
  const pascalName = toPascalCase(iconName)
  return (icons as any)[pascalName] || icons.Settings
}

// 侧边栏宽度样式
const sidebarStyle = computed(() => ({
  width: isCollapsed.value 
    ? `${themeStore.sidebarCollapsedWidth}px` 
    : `${themeStore.sidebarExpandedWidth}px`
}))

// 页面切换动画类名
const transitionName = computed(() => {
  const map = {
    slide: 'slide-fade',
    fade: 'fade',
    scale: 'scale',
    none: ''
  }
  return map[themeStore.pageTransition] || ''
})

// 网站配置
const siteName = computed(() => appStore.siteConfig.name || 'RBAC Admin')
const siteLogo = computed(() => {
  const logo = appStore.siteConfig.logo
  if (!logo) return ''
  // 相对路径加上 API 前缀
  if (logo.startsWith('/')) {
    return import.meta.env.VITE_API_URL + logo
  }
  return logo
})

// 加载网站配置
onMounted(() => {
  appStore.loadSiteConfig()
})

// 获取完整的头像URL
function getAvatarUrl(avatar: string | undefined | null): string {
  if (!avatar) return ''
  // 如果已经是完整URL,直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  // 如果是相对路径,拼接后端地址
  return `${import.meta.env.VITE_API_URL}${avatar}`
}

const isActive = (path: string) => route.path === path

const toggleSidebar = () => {
  appStore.toggleSidebar()
}

// 退出登录确认对话框
const showLogoutDialog = ref(false)
const handleLogoutClick = () => {
  showLogoutDialog.value = true
}
const confirmLogout = async () => {
  const loginPath = appStore.siteConfig.loginPath || '/login'
  await userStore.logout()
  toast({
    title: "退出成功",
    description: "您已安全退出系统",
  })
  router.push(loginPath)
}

// 个人中心 - 跳转到个人中心页面
const showProfile = ref(false)
const handleProfile = () => {
  router.push('/user/profile')
}

// 打开设置
const showSettings = ref(false)

// 打开编辑用户对话框
const handleOpenEditDialog = (userId: string) => {
  showProfile.value = false
  router.push(`/system/user?edit=${userId}`)
}
</script>

<template>
  <div class="flex min-h-screen w-full flex-col bg-muted/40">
    <!-- Desktop Sidebar (normal 和 mixed 模式) -->
    <aside 
      v-if="isNormalMode || isMixedMode"
      :class="cn('fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300')"
      :style="sidebarStyle"
    >
      <nav class="flex flex-col gap-4 px-2 sm:py-5">
        <div :class="cn('flex items-center px-2', isCollapsed ? 'justify-center' : 'gap-2')">
          <router-link to="/" class="flex items-center gap-2">
            <template v-if="siteLogo">
              <img :src="siteLogo" :alt="siteName" class="h-8 max-w-[160px] object-contain" />
            </template>
            <template v-else>
              <div class="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
                <Package2 class="h-4 w-4 transition-all group-hover:scale-110" />
              </div>
            </template>
            <span v-if="!isCollapsed" class="font-semibold text-lg">{{ siteName }}</span>
          </router-link>
        </div>

        <TooltipProvider>
          <!-- Normal 模式：完整菜单 -->
          <template v-if="isNormalMode">
            <div v-if="!isCollapsed" class="space-y-1">
              <Tooltip :delay-duration="0">
                <TooltipTrigger as-child>
                  <router-link
                    to="/dashboard"
                    :class="cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                      isActive('/dashboard') ? 'bg-muted text-primary' : 'text-muted-foreground',
                      isCollapsed ? 'justify-center h-9 w-9 p-0' : ''
                    )"
                  >
                    <LayoutDashboard class="h-4 w-4" />
                    <span v-if="!isCollapsed">仪表盘</span>
                    <span v-else class="sr-only">仪表盘</span>
                  </router-link>
                </TooltipTrigger>
                <TooltipContent side="right" v-if="isCollapsed">仪表盘</TooltipContent>
              </Tooltip>
              <DynamicMenu />
            </div>
            <div v-else class="flex flex-col gap-1 items-center">
              <!-- 仪表盘 -->
              <Tooltip :delay-duration="0">
                <TooltipTrigger as-child>
                  <router-link
                    to="/dashboard"
                    :class="cn(
                      'h-9 w-9 flex items-center justify-center rounded-lg transition-colors',
                      isActive('/dashboard') ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary hover:bg-muted'
                    )"
                  >
                    <LayoutDashboard class="h-4 w-4" />
                  </router-link>
                </TooltipTrigger>
                <TooltipContent side="right">仪表盘</TooltipContent>
              </Tooltip>
              
              <!-- 动态菜单 - 使用 HoverCard 显示子菜单 -->
              <HoverCard 
                v-for="menu in menuStore.menuList" 
                :key="menu.path" 
                :open-delay="0" 
                :close-delay="100"
              >
                <HoverCardTrigger as-child>
                  <button
                    :class="cn(
                      'h-9 w-9 flex items-center justify-center rounded-lg transition-colors',
                      route.path.startsWith(menu.path) ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary hover:bg-muted'
                    )"
                  >
                    <component :is="getIcon(menu.meta?.icon)" class="h-4 w-4" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent 
                  side="right" 
                  align="start" 
                  :side-offset="8" 
                  class="w-48 p-2"
                  @pointerDownOutside="(e: Event) => e.preventDefault()"
                >
                  <div class="text-sm font-medium mb-2 px-2 text-foreground">{{ menu.meta?.title }}</div>
                  <div class="space-y-1">
                    <router-link 
                      v-for="child in menu.children" 
                      :key="child.path"
                      :to="child.path.startsWith('/') ? child.path : `${menu.path}/${child.path}`"
                      :class="cn(
                        'flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors',
                        isActive(child.path.startsWith('/') ? child.path : `${menu.path}/${child.path}`) 
                          ? 'bg-muted text-primary' 
                          : 'text-muted-foreground hover:bg-muted hover:text-primary'
                      )"
                    >
                      <component :is="getIcon(child.meta?.icon)" class="h-4 w-4" />
                      {{ child.meta?.title }}
                    </router-link>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </template>

          <!-- Mixed 模式：只显示二级菜单 -->
          <template v-if="isMixedMode">
            <div v-if="!isCollapsed && mixedSubMenus.length" class="space-y-1">
              <router-link 
                v-for="child in mixedSubMenus" 
                :key="child.path"
                :to="child.path.startsWith('/') ? child.path : `${activeTopMenu}/${child.path}`" 
                :class="cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary', 
                  isActive(child.path.startsWith('/') ? child.path : `${activeTopMenu}/${child.path}`) ? 'bg-muted text-primary' : 'text-muted-foreground'
                )"
              >
                <component :is="getIcon(child.meta?.icon)" class="h-4 w-4" />
                {{ child.meta?.title }}
              </router-link>
            </div>
            <div v-else-if="isCollapsed" class="flex flex-col gap-2 items-center">
              <Tooltip v-for="child in mixedSubMenus" :key="child.path" :delay-duration="0">
                <TooltipTrigger as-child>
                  <router-link 
                    :to="child.path.startsWith('/') ? child.path : `${activeTopMenu}/${child.path}`"
                    :class="cn(
                      'h-9 w-9 flex items-center justify-center rounded-lg transition-colors',
                      isActive(child.path.startsWith('/') ? child.path : `${activeTopMenu}/${child.path}`) ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary'
                    )"
                  >
                    <component :is="getIcon(child.meta?.icon)" class="h-4 w-4" />
                  </router-link>
                </TooltipTrigger>
                <TooltipContent side="right">{{ child.meta?.title }}</TooltipContent>
              </Tooltip>
            </div>
          </template>
        </TooltipProvider>
      </nav>
      
      <!-- User Profile & Footer -->
      <div class="mt-auto p-4">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" :class="cn('flex items-center gap-2 w-full h-auto py-2', isCollapsed ? 'justify-center px-0' : 'justify-between px-2')">
              <div class="flex items-center gap-2 overflow-hidden">
                <Avatar class="h-8 w-8 rounded-lg">
                  <AvatarImage :src="getAvatarUrl(userStore.avatar)" :alt="userStore.name" />
                  <AvatarFallback class="rounded-lg">{{ userStore.name ? userStore.name.slice(0, 2).toUpperCase() : 'AD' }}</AvatarFallback>
                </Avatar>
                <div v-if="!isCollapsed" class="flex flex-col items-start text-left text-sm leading-tight overflow-hidden">
                  <span class="font-semibold truncate w-full">{{ userStore.name || 'Admin' }}</span>
                  <span class="text-xs text-muted-foreground truncate w-full">{{ userStore.email || '暂无邮箱' }}</span>
                </div>
              </div>
              <ChevronsUpDown v-if="!isCollapsed" class="ml-auto h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="bottom" align="end" :side-offset="4">
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
            <DropdownMenuItem @click="handleProfile">
              <User class="mr-2 h-4 w-4" />
              个人中心
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogoutClick">
              <LogOut class="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>

    <!-- Main Content -->
    <div 
      class="flex flex-col sm:py-4 transition-all duration-300"
      :class="{ 'sm:pl-[var(--sidebar-width)]': isNormalMode || isMixedMode }"
      :style="{ '--sidebar-width': (isNormalMode || isMixedMode) ? `${isCollapsed ? themeStore.sidebarCollapsedWidth : themeStore.sidebarExpandedWidth}px` : '0' } as any"
    >
       <header class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <!-- Mobile Toggle -->
          <Sheet>
            <SheetTrigger as-child>
              <Button size="icon" variant="outline" class="sm:hidden">
                <PanelLeft class="h-5 w-5" />
                <span class="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" class="w-64 p-0 flex flex-col h-full">
               <nav class="flex flex-col h-full">
                <!-- Logo -->
                <div class="flex items-center gap-2 px-4 py-4 border-b">
                  <router-link to="/" class="flex items-center gap-2">
                    <template v-if="siteLogo">
                      <img :src="siteLogo" :alt="siteName" class="h-8 max-w-[160px] object-contain" />
                    </template>
                    <template v-else>
                      <div class="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                        <Package2 class="h-4 w-4 transition-all group-hover:scale-110" />
                      </div>
                    </template>
                    <span class="font-semibold text-lg">{{ siteName }}</span>
                  </router-link>
                </div>

                <!-- 菜单区域 -->
                <div class="flex-1 overflow-y-auto px-2 py-4 space-y-1">
                  <!-- 仪表盘 -->
                  <router-link
                    to="/dashboard"
                    :class="cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary',
                      isActive('/dashboard') ? 'bg-muted text-primary' : 'text-muted-foreground'
                    )"
                  >
                    <LayoutDashboard class="h-4 w-4" />
                    <span>仪表盘</span>
                  </router-link>

                  <!-- 动态菜单 -->
                  <Accordion type="single" collapsible class="w-full" default-value="item-0">
                    <AccordionItem 
                      v-for="(item, index) in menuStore.menuList" 
                      :key="item.path" 
                      :value="`item-${index}`" 
                      class="border-b-0"
                    >
                      <AccordionTrigger class="py-2 hover:no-underline hover:text-primary text-muted-foreground px-3 rounded-lg hover:bg-muted/50">
                        <div class="flex items-center gap-3">
                          <component :is="getIcon(item.meta?.icon)" class="h-4 w-4" />
                          {{ item.meta?.title }}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent class="pb-0 pl-4 space-y-1 mt-1">
                        <router-link 
                          v-for="child in item.children" 
                          :key="child.path"
                          :to="child.path.startsWith('/') ? child.path : `${item.path}/${child.path}`" 
                          :class="cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary', 
                            isActive(child.path.startsWith('/') ? child.path : `${item.path}/${child.path}`) ? 'bg-muted text-primary' : 'text-muted-foreground'
                          )"
                        >
                          <component :is="getIcon(child.meta?.icon)" class="h-4 w-4" />
                          {{ child.meta?.title }}
                        </router-link>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <!-- 用户信息 -->
                <div class="mt-auto shrink-0 border-t p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" class="flex items-center gap-3 w-full h-auto py-2 px-2 justify-between">
                        <div class="flex items-center gap-3 overflow-hidden">
                          <Avatar class="h-9 w-9 rounded-lg">
                            <AvatarImage :src="getAvatarUrl(userStore.avatar)" :alt="userStore.name" />
                            <AvatarFallback class="rounded-lg">{{ userStore.name ? userStore.name.slice(0, 2).toUpperCase() : 'AD' }}</AvatarFallback>
                          </Avatar>
                          <div class="flex-1 min-w-0 text-left">
                            <p class="text-sm font-medium truncate">{{ userStore.name || 'Admin' }}</p>
                            <p class="text-xs text-muted-foreground truncate">{{ userStore.email || '暂无邮箱' }}</p>
                          </div>
                        </div>
                        <ChevronsUpDown class="h-4 w-4 text-muted-foreground shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="w-[--radix-dropdown-menu-trigger-width] min-w-48 rounded-lg" side="top" align="start" :side-offset="4">
                      <DropdownMenuItem @click="handleProfile">
                        <User class="mr-2 h-4 w-4" />
                        个人中心
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="text-destructive focus:text-destructive" @click="handleLogoutClick">
                        <LogOut class="mr-2 h-4 w-4" />
                        退出登录
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          <!-- Desktop Collapse Toggle (normal 和 mixed 模式) -->
          <Button v-if="isNormalMode || isMixedMode" size="icon" variant="outline" class="hidden sm:flex" @click="toggleSidebar">
             <PanelLeft class="h-5 w-5" />
             <span class="sr-only">Toggle Sidebar</span>
          </Button>

          <!-- Top 模式：Logo -->
          <div v-if="isTopMode" class="hidden sm:flex items-center gap-2 shrink-0">
            <router-link to="/" class="flex items-center gap-2">
              <template v-if="siteLogo">
                <img :src="siteLogo" :alt="siteName" class="h-8 max-w-[160px] object-contain" />
              </template>
              <template v-else>
                <div class="group flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Package2 class="h-4 w-4" />
                </div>
              </template>
              <span class="font-semibold text-lg whitespace-nowrap">{{ siteName }}</span>
            </router-link>
          </div>

          <!-- Top 模式 / Mixed 模式：顶部菜单 -->
          <NavigationMenu v-if="isTopMode || isMixedMode" class="hidden sm:flex">
            <NavigationMenuList>
              <!-- 仪表盘 -->
              <NavigationMenuItem>
                <router-link to="/dashboard">
                  <NavigationMenuLink 
                    :class="cn(
                      'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                      isActive('/dashboard') && 'bg-accent text-accent-foreground'
                    )"
                  >
                    <LayoutDashboard class="mr-2 h-4 w-4" />
                    仪表盘
                  </NavigationMenuLink>
                </router-link>
              </NavigationMenuItem>

              <!-- Top 模式：展开子菜单 -->
              <template v-if="isTopMode">
                <NavigationMenuItem v-for="menu in menuStore.menuList" :key="menu.path">
                  <NavigationMenuTrigger class="h-9">
                    <component :is="getIcon(menu.meta?.icon)" class="mr-2 h-4 w-4" />
                    {{ menu.meta?.title }}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul class="grid w-[200px] gap-1 p-2">
                      <li v-for="child in menu.children" :key="child.path">
                        <router-link :to="child.path.startsWith('/') ? child.path : `${menu.path}/${child.path}`">
                          <NavigationMenuLink 
                            :class="cn(
                              'block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                              isActive(child.path.startsWith('/') ? child.path : `${menu.path}/${child.path}`) && 'bg-accent'
                            )"
                          >
                            <div class="flex items-center gap-2">
                              <component :is="getIcon(child.meta?.icon)" class="h-4 w-4" />
                              {{ child.meta?.title }}
                            </div>
                          </NavigationMenuLink>
                        </router-link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </template>

              <!-- Mixed 模式：一级菜单作为切换按钮 -->
              <template v-if="isMixedMode">
                <NavigationMenuItem v-for="menu in menuStore.menuList" :key="menu.path">
                  <NavigationMenuLink 
                    :class="cn(
                      'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
                      activeTopMenu === menu.path && 'bg-accent text-accent-foreground'
                    )"
                    @click="activeTopMenu = menu.path"
                  >
                    <component :is="getIcon(menu.meta?.icon)" class="mr-2 h-4 w-4" />
                    {{ menu.meta?.title }}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </template>
            </NavigationMenuList>
          </NavigationMenu>

          <div class="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div class="ml-auto flex-1 sm:flex-initial">
            </div>
            <ThemeCustomizer />
            <ThemeToggle />
            <UserMenuButton />
          </div>
       </header>
       
       <!-- 标签页 -->
       <TabsView v-if="themeStore.showTabs" />
       
       <main class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
         <RouterView v-slot="{ Component }">
           <Transition :name="transitionName" mode="out-in">
             <component :is="Component" />
           </Transition>
         </RouterView>
       </main>
    </div>

    <!-- 个人资料对话框 -->
    <ProfileDialog 
      v-model:open="showProfile" 
      @open-settings="showSettings = true"
      @open-edit-dialog="handleOpenEditDialog"
    />

    <!-- 设置对话框 -->
    <SettingsDialog v-model:open="showSettings" />

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
  </div>
</template>

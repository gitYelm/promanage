<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDashboard, PanelLeft } from 'lucide-vue-next'
import ThemeToggle from '@/components/ThemeToggle.vue'
import ThemeCustomizer from '@/components/ThemeCustomizer.vue'
import UserMenuButton from '@/components/UserMenuButton.vue'
import NotificationBell from '@/components/notification/NotificationBell.vue'
import { useAppStore } from '@/stores/modules/app'
import { useMenuStore } from '@/stores/modules/menu'
import { useThemeStore } from '@/stores/theme'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'
import { useLayoutHelpers } from '../composables/useLayoutHelpers'
import LayoutLogo from './LayoutLogo.vue'
import MobileSidebar from './MobileSidebar.vue'

const emit = defineEmits<{ profile: []; logout: [] }>()
const appStore = useAppStore()
const menuStore = useMenuStore()
const themeStore = useThemeStore()
const { siteName, siteLogo, getIcon, isActive, childPath } = useLayoutHelpers()
const activeTopMenu = defineModel<string>('activeTopMenu', { default: '' })
const isNormalMode = computed(() => themeStore.menuMode === 'normal')
const isTopMode = computed(() => themeStore.menuMode === 'top')
const isMixedMode = computed(() => themeStore.menuMode === 'mixed')
</script>

<template>
  <header class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
    <MobileSidebar @profile="emit('profile')" @logout="emit('logout')" />

    <Button v-if="isNormalMode || isMixedMode" size="icon" variant="outline" class="hidden sm:flex" @click="appStore.toggleSidebar()">
      <PanelLeft class="h-5 w-5" /><span class="sr-only">Toggle Sidebar</span>
    </Button>

    <div v-if="isTopMode" class="hidden shrink-0 items-center gap-2 sm:flex">
      <LayoutLogo :site-name="siteName" :site-logo="siteLogo" compact />
    </div>

    <NavigationMenu v-if="isTopMode || isMixedMode" class="hidden sm:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <router-link to="/dashboard">
            <NavigationMenuLink
              :class="cn('group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50', isActive('/dashboard') && 'bg-accent text-accent-foreground')"
            >
              <LayoutDashboard class="mr-2 h-4 w-4" />仪表盘
            </NavigationMenuLink>
          </router-link>
        </NavigationMenuItem>

        <template v-if="isTopMode">
          <NavigationMenuItem v-for="menu in menuStore.menuList" :key="menu.path">
            <NavigationMenuTrigger class="h-9"><component :is="getIcon(menu.meta?.icon)" class="mr-2 h-4 w-4" />{{ menu.meta?.title }}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="grid w-[200px] gap-1 p-2">
                <li v-for="child in menu.children" :key="child.path">
                  <router-link :to="childPath(menu.path, child.path)">
                    <NavigationMenuLink :class="cn('block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground', isActive(childPath(menu.path, child.path)) && 'bg-accent')">
                      <div class="flex items-center gap-2"><component :is="getIcon(child.meta?.icon)" class="h-4 w-4" />{{ child.meta?.title }}</div>
                    </NavigationMenuLink>
                  </router-link>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </template>

        <template v-if="isMixedMode">
          <NavigationMenuItem v-for="menu in menuStore.menuList" :key="menu.path">
            <NavigationMenuLink
              :class="cn('group inline-flex h-9 w-max cursor-pointer items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground', activeTopMenu === menu.path && 'bg-accent text-accent-foreground')"
              @click="activeTopMenu = menu.path"
            >
              <component :is="getIcon(menu.meta?.icon)" class="mr-2 h-4 w-4" />{{ menu.meta?.title }}
            </NavigationMenuLink>
          </NavigationMenuItem>
        </template>
      </NavigationMenuList>
    </NavigationMenu>

    <div class="flex w-full items-center gap-2 md:ml-auto lg:gap-4">
      <div class="ml-auto flex-1 sm:flex-initial"></div>
      <NotificationBell />
      <ThemeCustomizer />
      <ThemeToggle />
      <UserMenuButton />
    </div>
  </header>
</template>

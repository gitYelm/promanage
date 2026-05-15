<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard } from 'lucide-vue-next'
import { useAppStore } from '@/stores/modules/app'
import { useMenuStore } from '@/stores/modules/menu'
import { useThemeStore } from '@/stores/theme'
import DynamicMenu from '@/components/DynamicMenu.vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'
import { useLayoutHelpers } from '../composables/useLayoutHelpers'
import LayoutLogo from './LayoutLogo.vue'
import LayoutUserMenu from './LayoutUserMenu.vue'

const emit = defineEmits<{ profile: []; logout: [] }>()
const route = useRoute()
const appStore = useAppStore()
const menuStore = useMenuStore()
const themeStore = useThemeStore()
const { siteName, siteLogo, getIcon, isActive, childPath } = useLayoutHelpers()

const isCollapsed = computed(() => appStore.sidebarCollapsed)
const isNormalMode = computed(() => themeStore.menuMode === 'normal')
const isMixedMode = computed(() => themeStore.menuMode === 'mixed')
const activeTopMenu = defineModel<string>('activeTopMenu', { default: '' })
const mixedSubMenus = computed(() => {
  if (!isMixedMode.value || !activeTopMenu.value) return []
  return menuStore.menuList.find((menu) => menu.path === activeTopMenu.value)?.children || []
})
const sidebarStyle = computed(() => ({
  width: isCollapsed.value ? `${themeStore.sidebarCollapsedWidth}px` : `${themeStore.sidebarExpandedWidth}px`,
}))
</script>

<template>
  <aside
    v-if="isNormalMode || isMixedMode"
    :class="cn('fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300')"
    :style="sidebarStyle"
  >
    <nav class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 sm:py-5">
      <div :class="cn('flex items-center px-2', isCollapsed ? 'justify-center' : 'gap-2')">
        <LayoutLogo :site-name="siteName" :site-logo="siteLogo" :collapsed="isCollapsed" />
      </div>

      <TooltipProvider>
        <template v-if="isNormalMode">
          <div v-if="!isCollapsed" class="space-y-1">
            <router-link
              to="/dashboard"
              :class="cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary', isActive('/dashboard') ? 'bg-muted text-primary' : 'text-muted-foreground')"
            >
              <LayoutDashboard class="h-4 w-4" /><span>仪表盘</span>
            </router-link>
            <DynamicMenu />
          </div>
          <div v-else class="flex flex-col items-center gap-1">
            <Tooltip :delay-duration="0">
              <TooltipTrigger as-child>
                <router-link
                  to="/dashboard"
                  :class="cn('flex h-9 w-9 items-center justify-center rounded-lg transition-colors', isActive('/dashboard') ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-primary')"
                >
                  <LayoutDashboard class="h-4 w-4" />
                </router-link>
              </TooltipTrigger>
              <TooltipContent side="right">仪表盘</TooltipContent>
            </Tooltip>
            <HoverCard v-for="menu in menuStore.menuList" :key="menu.path" :open-delay="0" :close-delay="100">
              <HoverCardTrigger as-child>
                <button :class="cn('flex h-9 w-9 items-center justify-center rounded-lg transition-colors', route.path.startsWith(menu.path) ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-primary')">
                  <component :is="getIcon(menu.meta?.icon)" class="h-4 w-4" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="start" :side-offset="8" class="w-48 p-2" @pointer-down-outside="(e: Event) => e.preventDefault()">
                <div class="mb-2 px-2 text-sm font-medium text-foreground">{{ menu.meta?.title }}</div>
                <div class="space-y-1">
                  <router-link
                    v-for="child in menu.children"
                    :key="child.path"
                    :to="childPath(menu.path, child.path)"
                    :class="cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors', isActive(childPath(menu.path, child.path)) ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-primary')"
                  >
                    <component :is="getIcon(child.meta?.icon)" class="h-4 w-4" />{{ child.meta?.title }}
                  </router-link>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </template>

        <template v-if="isMixedMode">
          <div v-if="!isCollapsed && mixedSubMenus.length" class="space-y-1">
            <router-link
              v-for="child in mixedSubMenus"
              :key="child.path"
              :to="childPath(activeTopMenu, child.path)"
              :class="cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary', isActive(childPath(activeTopMenu, child.path)) ? 'bg-muted text-primary' : 'text-muted-foreground')"
            >
              <component :is="getIcon(child.meta?.icon)" class="h-4 w-4" />{{ child.meta?.title }}
            </router-link>
          </div>
          <div v-else-if="isCollapsed" class="flex flex-col items-center gap-2">
            <Tooltip v-for="child in mixedSubMenus" :key="child.path" :delay-duration="0">
              <TooltipTrigger as-child>
                <router-link :to="childPath(activeTopMenu, child.path)" :class="cn('flex h-9 w-9 items-center justify-center rounded-lg transition-colors', isActive(childPath(activeTopMenu, child.path)) ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary')">
                  <component :is="getIcon(child.meta?.icon)" class="h-4 w-4" />
                </router-link>
              </TooltipTrigger>
              <TooltipContent side="right">{{ child.meta?.title }}</TooltipContent>
            </Tooltip>
          </div>
        </template>
      </TooltipProvider>
    </nav>

    <div class="shrink-0 p-4">
      <LayoutUserMenu :collapsed="isCollapsed" @profile="emit('profile')" @logout="emit('logout')" />
    </div>
  </aside>
</template>

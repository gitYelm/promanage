<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore, type MenuItem } from '@/stores/modules/menu'
import { useThemeStore } from '@/stores/theme'
import { useWorkspaceStore } from '@/stores/modules/workspace'
import { bugPendingCount } from '@/api/bug'
import { BUG_PENDING_COUNT_REFRESH_EVENT } from '@/views/bug/shared/bug-events'
import { cn } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import * as icons from 'lucide-vue-next'

const route = useRoute()
const menuStore = useMenuStore()
const themeStore = useThemeStore()
const workspaceStore = useWorkspaceStore()
const pendingCount = ref(0)
const accordionValue = ref<string>()

// 菜单项高度样式
const menuItemStyle = computed(() => ({
  height: `${themeStore.sidebarItemHeight}px`,
}))

const menuList = computed(() => menuStore.menuList)

const isActive = (path: string) => route.path === path

// 根据当前路由计算应该展开的菜单
const activeAccordionValue = computed(() => menuValueForPath(route.path))

const defaultAccordionValue = computed(() => {
  return menuValueForPath(workspaceStore.defaultOpenMenu) || activeAccordionValue.value
})

// 将 kebab-case 转换为 PascalCase
function toPascalCase(str: string): string {
  if (!str) return ''
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// 动态获取图标组件
function getIcon(iconName: string) {
  if (!iconName) return icons.Settings
  const pascalName = toPascalCase(iconName)
  return (icons as any)[pascalName] || icons.Settings
}

function childPath(parentPath: string, childPathValue: string) {
  return childPathValue.startsWith('/') ? childPathValue : `${parentPath}/${childPathValue}`
}

function menuValueForPath(path: string) {
  if (!path) return undefined
  const index = menuList.value.findIndex(
    (menu) =>
      path.startsWith(menu.path) ||
      menu.children?.some((child) => path === childPath(menu.path, child.path)),
  )
  return index >= 0 ? `item-${index}` : undefined
}


function menuBadge(path: string) {
  return path === '/bug/my' && pendingCount.value > 0 ? pendingCount.value : 0
}

function parentMenuBadge(item: MenuItem) {
  return (item.children || []).reduce((total, child) => {
    return total + menuBadge(childPath(item.path, child.path))
  }, 0)
}

async function refreshPendingCount() {
  try {
    pendingCount.value = (await bugPendingCount()).count
  } catch {
    pendingCount.value = 0
  }
}

function handlePendingCountRefresh() {
  void refreshPendingCount()
}

watch(
  defaultAccordionValue,
  (value) => {
    if (value) accordionValue.value = value
  },
  { immediate: true },
)

onMounted(() => {
  void workspaceStore.fetchConfig()
  void refreshPendingCount()
  window.addEventListener(BUG_PENDING_COUNT_REFRESH_EVENT, handlePendingCountRefresh)
})

onBeforeUnmount(() => window.removeEventListener(BUG_PENDING_COUNT_REFRESH_EVENT, handlePendingCountRefresh))
</script>

<template>
  <Accordion v-model="accordionValue" type="single" collapsible class="w-full">
    <AccordionItem
      v-for="(item, index) in menuList"
      :key="item.path"
      :value="`item-${index}`"
      class="border-b-0"
    >
      <AccordionTrigger
        class="hover:no-underline hover:text-primary text-muted-foreground px-3 rounded-lg hover:bg-muted/50"
        :style="menuItemStyle"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <component :is="getIcon(item.meta.icon)" class="h-5 w-5" />
          <span class="min-w-0 truncate font-medium">{{ item.meta.title }}</span>
        </div>
        <span
          v-if="parentMenuBadge(item)"
          class="ml-auto mr-2 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] leading-none text-destructive-foreground"
        >
          {{ parentMenuBadge(item) }}
        </span>
      </AccordionTrigger>
      <AccordionContent class="pb-0 pl-4 space-y-1 mt-1">
        <router-link
          v-for="child in item.children"
          :key="child.path"
          :to="childPath(item.path, child.path)"
          :class="
            cn(
              'flex items-center gap-3 rounded-lg px-3 text-sm transition-all hover:text-primary',
              isActive(childPath(item.path, child.path))
                ? 'bg-muted text-primary'
                : 'text-muted-foreground',
            )
          "
          :style="menuItemStyle"
        >
          <component :is="getIcon(child.meta.icon)" class="h-4 w-4" />
          <span class="min-w-0 flex-1 truncate">{{ child.meta.title }}</span>
          <span
            v-if="menuBadge(childPath(item.path, child.path))"
            class="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] leading-none text-destructive-foreground"
          >
            {{ menuBadge(childPath(item.path, child.path)) }}
          </span>
        </router-link>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>

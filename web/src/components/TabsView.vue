<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabsStore } from '@/stores/modules/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { X, RefreshCw } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

// 监听路由变化，添加标签页
watch(
  () => route.path,
  () => {
    tabsStore.addTab(route)
  },
  { immediate: true }
)

// 切换标签页
function handleTabClick(path: string) {
  if (path !== route.path) {
    router.push(path)
  }
}

// 关闭标签页
function handleClose(e: Event, path: string) {
  e.stopPropagation()
  const newPath = tabsStore.closeTab(path)
  if (newPath) {
    router.push(newPath)
  }
}

// 刷新当前页面
function handleRefresh() {
  router.replace({ path: '/redirect' + route.path })
}

// 关闭其他
function handleCloseOther(path: string) {
  tabsStore.closeOtherTabs(path)
  if (route.path !== path) {
    router.push(path)
  }
}

// 关闭所有
function handleCloseAll() {
  const path = tabsStore.closeAllTabs()
  router.push(path)
}

// 关闭左侧
function handleCloseLeft(path: string) {
  tabsStore.closeLeftTabs(path)
}

// 关闭右侧
function handleCloseRight(path: string) {
  tabsStore.closeRightTabs(path)
}
</script>

<template>
  <div class="border-b bg-background">
    <ScrollArea class="w-full whitespace-nowrap">
      <div class="flex h-10 items-center gap-1 px-2">
        <ContextMenu v-for="tab in tabsStore.tabs" :key="tab.path">
          <ContextMenuTrigger>
            <div
              :class="
                cn(
                  'group relative flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors',
                  tabsStore.activeTab === tab.path
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-transparent hover:border-border hover:bg-muted'
                )
              "
              @click="handleTabClick(tab.path)"
            >
              <span class="max-w-[120px] truncate">{{ tab.title }}</span>
              <button
                v-if="tab.closable"
                class="ml-1 rounded-sm opacity-0 ring-offset-background transition-opacity hover:bg-muted group-hover:opacity-100"
                @click="(e) => handleClose(e, tab.path)"
              >
                <X class="h-3 w-3" />
              </button>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @click="handleRefresh">
              <RefreshCw class="mr-2 h-4 w-4" />
              刷新页面
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem :disabled="!tab.closable" @click="handleClose($event, tab.path)">
              关闭当前
            </ContextMenuItem>
            <ContextMenuItem @click="handleCloseOther(tab.path)"> 关闭其他 </ContextMenuItem>
            <ContextMenuItem @click="handleCloseLeft(tab.path)"> 关闭左侧 </ContextMenuItem>
            <ContextMenuItem @click="handleCloseRight(tab.path)"> 关闭右侧 </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem @click="handleCloseAll"> 关闭所有 </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  </div>
</template>

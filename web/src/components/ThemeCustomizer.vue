<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore, type MenuMode, type PageTransition } from '@/stores/theme'
import { themes } from '@/lib/registry/themes'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

import { Check, Palette, Minus, Plus, RotateCcw } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import ThemeToggle from './ThemeToggle.vue'

const themeStore = useThemeStore()

const radii = [0, 0.25, 0.5, 0.75, 1.0]

// 预设自定义颜色
const customColors = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#78716c',
]

const colorPickerOpen = ref(false)

function selectCustomColor(color: string) {
  themeStore.setCustomColor(color)
  colorPickerOpen.value = false
}

function onColorPickerChange(e: Event) {
  const color = (e.target as HTMLInputElement).value
  themeStore.setCustomColor(color)
}

const menuModes: { value: MenuMode; label: string }[] = [
  { value: 'normal', label: '正常模式' },
  { value: 'top', label: '顶部菜单栏模式' },
  { value: 'mixed', label: '组合模式' },
]

const pageTransitions: { value: PageTransition; label: string }[] = [
  { value: 'slide', label: '滑动' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'scale', label: '缩放' },
  { value: 'none', label: '无动画' },
]
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="ghost" size="icon">
        <Palette class="h-4 w-4" />
      </Button>
    </SheetTrigger>
    <SheetContent class="w-[340px] flex flex-col">
      <SheetHeader>
        <SheetTitle>主题设置</SheetTitle>
        <SheetDescription> 自定义系统的外观和布局配置。 </SheetDescription>
      </SheetHeader>

      <ScrollArea class="flex-1 -mr-4 pr-4">
        <div class="grid gap-4 py-4">
          <!-- Colors -->
          <div class="space-y-1.5">
            <div
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              主题色
            </div>
            <div class="grid grid-cols-3 gap-2">
              <Button
                v-for="theme in themes"
                :key="theme.name"
                variant="outline"
                :class="
                  cn(
                    'justify-start gap-2 px-3',
                    themeStore.themeName === theme.name &&
                      !themeStore.isCustomTheme &&
                      'border-primary border-2'
                  )
                "
                @click="themeStore.setTheme(theme.name)"
              >
                <span
                  class="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                  :style="{ backgroundColor: theme.activeColor }"
                >
                  <Check
                    v-if="themeStore.themeName === theme.name && !themeStore.isCustomTheme"
                    class="h-3 w-3 text-white"
                  />
                </span>
                <span class="text-xs capitalize">{{ theme.label }}</span>
              </Button>
              <!-- 自定义颜色 -->
              <Popover v-model:open="colorPickerOpen">
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    :class="
                      cn(
                        'justify-start gap-2 px-3',
                        themeStore.isCustomTheme && 'border-primary border-2'
                      )
                    "
                  >
                    <span
                      class="h-4 w-4 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-red-500 via-green-500 to-blue-500"
                      :style="themeStore.customColor ? { background: themeStore.customColor } : {}"
                    >
                      <Check v-if="themeStore.isCustomTheme" class="h-3 w-3 text-white" />
                    </span>
                    <span class="text-xs">自定义</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-[220px] p-3" align="start">
                  <div class="space-y-3">
                    <div class="grid grid-cols-6 gap-1.5">
                      <button
                        v-for="color in customColors"
                        :key="color"
                        class="h-7 w-7 rounded-md border border-transparent hover:border-foreground/20 hover:scale-110 transition-all flex items-center justify-center"
                        :style="{ backgroundColor: color }"
                        @click="selectCustomColor(color)"
                      >
                        <Check
                          v-if="themeStore.customColor === color && themeStore.isCustomTheme"
                          class="h-3.5 w-3.5 text-white"
                        />
                      </button>
                    </div>
                    <Separator />
                    <div class="flex items-center gap-2">
                      <label class="relative cursor-pointer">
                        <input
                          type="color"
                          class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          :value="themeStore.customColor || '#3b82f6'"
                          @input="onColorPickerChange"
                        />
                        <div
                          class="h-9 w-9 rounded-md border hover:border-foreground/30 transition-colors"
                          :style="{ backgroundColor: themeStore.customColor || '#3b82f6' }"
                        />
                      </label>
                      <span class="text-xs text-muted-foreground">点击选取更多颜色</span>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <!-- Radius -->
          <div class="space-y-1.5">
            <div
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              圆角
            </div>
            <div class="grid grid-cols-5 gap-2">
              <Button
                v-for="r in radii"
                :key="r"
                variant="outline"
                :class="cn('px-0', themeStore.radius === r && 'border-primary border-2')"
                @click="themeStore.setRadius(r)"
              >
                {{ r }}
              </Button>
            </div>
          </div>

          <!-- Mode -->
          <div class="flex items-center justify-between">
            <Label class="text-sm font-medium">切换深色/浅色模式</Label>
            <ThemeToggle />
          </div>

          <Separator />

          <!-- 菜单模式 -->
          <div class="space-y-1.5">
            <div class="text-sm font-medium leading-none">菜单模式</div>
            <div class="grid grid-cols-3 gap-2">
              <Button
                v-for="mode in menuModes"
                :key="mode.value"
                variant="outline"
                size="sm"
                :class="
                  cn(
                    'text-xs',
                    themeStore.menuMode === mode.value && 'border-primary border-2 bg-primary/5'
                  )
                "
                @click="themeStore.setMenuMode(mode.value)"
              >
                {{ mode.label }}
              </Button>
            </div>
          </div>

          <!-- 显示标签页 -->
          <div class="flex items-center justify-between">
            <Label class="text-sm font-medium">显示标签页</Label>
            <Switch :checked="themeStore.showTabs" @update:checked="themeStore.setShowTabs" />
          </div>

          <!-- 页面切换动画 -->
          <div class="space-y-1.5">
            <div class="text-sm font-medium leading-none">页面切换动画</div>
            <Select
              :model-value="themeStore.pageTransition"
              @update:model-value="(v) => themeStore.setPageTransition(v as PageTransition)"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择动画" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in pageTransitions" :key="t.value" :value="t.value">
                  {{ t.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <!-- Layout 大小配置 -->
          <div class="space-y-4">
            <div class="text-sm font-medium leading-none">Layout 大小配置</div>

            <!-- 侧边栏展开宽度 -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">侧边栏展开宽度</span>
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  class="h-8 w-8"
                  @click="themeStore.setSidebarExpandedWidth(themeStore.sidebarExpandedWidth - 8)"
                >
                  <Minus class="h-3 w-3" />
                </Button>
                <span class="w-12 text-center text-sm">{{ themeStore.sidebarExpandedWidth }}</span>
                <Button
                  variant="outline"
                  size="icon"
                  class="h-8 w-8"
                  @click="themeStore.setSidebarExpandedWidth(themeStore.sidebarExpandedWidth + 8)"
                >
                  <Plus class="h-3 w-3" />
                </Button>
              </div>
            </div>

            <!-- 侧边栏收缩宽度 -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">侧边栏收缩宽度</span>
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  class="h-8 w-8"
                  @click="themeStore.setSidebarCollapsedWidth(themeStore.sidebarCollapsedWidth - 4)"
                >
                  <Minus class="h-3 w-3" />
                </Button>
                <span class="w-12 text-center text-sm">{{ themeStore.sidebarCollapsedWidth }}</span>
                <Button
                  variant="outline"
                  size="icon"
                  class="h-8 w-8"
                  @click="themeStore.setSidebarCollapsedWidth(themeStore.sidebarCollapsedWidth + 4)"
                >
                  <Plus class="h-3 w-3" />
                </Button>
              </div>
            </div>

            <!-- 侧边栏子项高度 -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">侧边栏子项高度</span>
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  class="h-8 w-8"
                  @click="themeStore.setSidebarItemHeight(themeStore.sidebarItemHeight - 2)"
                >
                  <Minus class="h-3 w-3" />
                </Button>
                <span class="w-12 text-center text-sm">{{ themeStore.sidebarItemHeight }}</span>
                <Button
                  variant="outline"
                  size="icon"
                  class="h-8 w-8"
                  @click="themeStore.setSidebarItemHeight(themeStore.sidebarItemHeight + 2)"
                >
                  <Plus class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <!-- 重置按钮 -->
          <Button variant="outline" class="w-full" @click="themeStore.resetToDefault">
            <RotateCcw class="mr-2 h-4 w-4" />
            重置为默认
          </Button>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>
</template>

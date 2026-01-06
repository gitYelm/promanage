<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useColorMode } from '@vueuse/core'
import { watch } from 'vue'
import { Toaster } from '@/components/ui/toast'

const themeStore = useThemeStore()
const mode = useColorMode()

// 将 hex 颜色转换为 oklch
function hexToOklch(hex: string): string {
  // 简化处理：将 hex 转为 RGB，再近似转为 oklch
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  // 计算亮度 (简化的 L)
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b

  // 计算色度和色相 (简化)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const c = max - min

  let h = 0
  if (c !== 0) {
    if (max === r) h = ((g - b) / c) % 6
    else if (max === g) h = (b - r) / c + 2
    else h = (r - g) / c + 4
    h = h * 60
    if (h < 0) h += 360
  }

  // 转换为 oklch 近似值
  const oklchL = Math.pow(l, 0.5) * 0.7 + 0.15
  const oklchC = c * 0.25

  return `oklch(${oklchL.toFixed(3)} ${oklchC.toFixed(3)} ${h.toFixed(1)})`
}

function updateTheme() {
  const root = document.documentElement

  // 检查是否使用自定义颜色
  if (themeStore.isCustomTheme && themeStore.customColor) {
    const customOklch = hexToOklch(themeStore.customColor)
    const isDark = mode.value === 'dark'

    // 应用自定义颜色
    root.style.setProperty('--primary', customOklch)
    root.style.setProperty('--primary-foreground', isDark ? 'oklch(0.205 0 0)' : 'oklch(0.985 0 0)')
    root.style.setProperty('--ring', customOklch)
  } else {
    const theme = themeStore.currentTheme
    if (!theme) return

    const isDark = mode.value === 'dark'
    const vars = isDark ? theme.cssVars.dark : theme.cssVars.light

    // Apply colors
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }

  // Apply radius
  root.style.setProperty('--radius', `${themeStore.radius}rem`)
}

watch(
  () => [themeStore.themeName, themeStore.customColor, themeStore.radius, mode.value],
  () => {
    updateTheme()
  },
  { immediate: true },
)
</script>

<template>
  <RouterView />
  <Toaster />
</template>

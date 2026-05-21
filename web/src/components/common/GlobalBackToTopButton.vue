<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUp } from 'lucide-vue-next'

const STORAGE_VERSION = 2
const STORAGE_KEY = 'global-back-to-top-position'
const BUTTON_SIZE = 48
const MOBILE_BREAKPOINT = 640
const DEFAULT_RIGHT_GAP = 32
const DEFAULT_BOTTOM_GAP = 96
const MOBILE_RIGHT_GAP = 16
const MOBILE_BOTTOM_GAP = 88
const SHOW_SCROLL_TOP = 300
const DRAG_THRESHOLD = 8

interface ButtonPosition {
  x: number
  y: number
}

interface StoredButtonPosition extends Partial<ButtonPosition> {
  version?: number
  xRatio?: number
  yRatio?: number
}

const route = useRoute()
const position = reactive<ButtonPosition>({ x: 0, y: 0 })
const isMounted = ref(false)
const shouldShow = ref(false)
const isDragging = ref(false)
const suppressNextClick = ref(false)
const hasCustomPosition = ref(false)
const hasValidStoredPosition = ref(false)

let startPointerX = 0
let startPointerY = 0
let startPositionX = 0
let startPositionY = 0

const isEnabled = computed(() => route.meta.backTop !== false)
const shouldUseCustomPosition = computed(() => hasCustomPosition.value && hasValidStoredPosition.value)

function activeButtonStyle() {
  if (shouldUseCustomPosition.value) {
    return `left:${position.x}px;top:${position.y}px;right:auto;bottom:auto;`
  }
  return `left:auto;top:auto;right:${safeEdgeGap()}px;bottom:${defaultBottomGap()}px;`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function viewportMaxX() {
  return Math.max(safeEdgeGap(), window.innerWidth - BUTTON_SIZE - safeEdgeGap())
}

function viewportMaxY() {
  return Math.max(safeEdgeGap(), window.innerHeight - BUTTON_SIZE - safeEdgeGap())
}

function safeEdgeGap() {
  return window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_RIGHT_GAP : DEFAULT_RIGHT_GAP
}

function defaultBottomGap() {
  return window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_BOTTOM_GAP : DEFAULT_BOTTOM_GAP
}

function defaultPosition(): ButtonPosition {
  return {
    x: viewportMaxX(),
    y: Math.max(safeEdgeGap(), window.innerHeight - BUTTON_SIZE - defaultBottomGap()),
  }
}

function clampPosition(target: ButtonPosition): ButtonPosition {
  const edgeGap = safeEdgeGap()
  return {
    x: clamp(target.x, edgeGap, viewportMaxX()),
    y: clamp(target.y, edgeGap, viewportMaxY()),
  }
}

function readStoredPosition() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as StoredButtonPosition
    if (parsed.version !== STORAGE_VERSION) return null
    if (Number.isFinite(parsed.xRatio) && Number.isFinite(parsed.yRatio)) {
      const edgeGap = safeEdgeGap()
      return clampPosition({
        x: edgeGap + Number(parsed.xRatio) * (viewportMaxX() - edgeGap),
        y: edgeGap + Number(parsed.yRatio) * (viewportMaxY() - edgeGap),
      })
    }
    if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
      return clampPosition({ x: Number(parsed.x), y: Number(parsed.y) })
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
  return null
}

function savePosition() {
  const edgeGap = safeEdgeGap()
  const xRange = Math.max(1, viewportMaxX() - edgeGap)
  const yRange = Math.max(1, viewportMaxY() - edgeGap)
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: STORAGE_VERSION,
      xRatio: Number(((position.x - edgeGap) / xRange).toFixed(4)),
      yRatio: Number(((position.y - edgeGap) / yRange).toFixed(4)),
    }),
  )
}

function setPosition(target: ButtonPosition) {
  const nextPosition = clampPosition(target)
  position.x = nextPosition.x
  position.y = nextPosition.y
}

function initializePosition() {
  const storedPosition = readStoredPosition()
  hasValidStoredPosition.value = Boolean(storedPosition)
  hasCustomPosition.value = hasValidStoredPosition.value
  if (storedPosition) setPosition(storedPosition)
}

function pageCanScroll() {
  const scrollElement = document.scrollingElement || document.documentElement
  return scrollElement.scrollHeight - window.innerHeight > 16
}

function updateVisibility() {
  shouldShow.value = isEnabled.value && pageCanScroll() && window.scrollY > SHOW_SCROLL_TOP
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: isReducedMotion() ? 'auto' : 'smooth',
  })
}

function commitDragPosition() {
  setPosition(position)
  hasValidStoredPosition.value = true
  hasCustomPosition.value = true
  savePosition()
}

function cleanupDragListeners() {
  document.removeEventListener('pointermove', handlePointerMove)
  document.removeEventListener('pointerup', handlePointerUp)
  document.removeEventListener('pointercancel', handlePointerUp)
  document.body.style.userSelect = ''
}

function handlePointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  if (!shouldUseCustomPosition.value) setPosition(defaultPosition())
  startPointerX = event.clientX
  startPointerY = event.clientY
  startPositionX = position.x
  startPositionY = position.y
  isDragging.value = false
  document.body.style.userSelect = 'none'
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  document.addEventListener('pointermove', handlePointerMove, { passive: false })
  document.addEventListener('pointerup', handlePointerUp)
  document.addEventListener('pointercancel', handlePointerUp)
}

function handlePointerMove(event: PointerEvent) {
  const deltaX = event.clientX - startPointerX
  const deltaY = event.clientY - startPointerY
  const distance = Math.hypot(deltaX, deltaY)

  if (!isDragging.value && distance < DRAG_THRESHOLD) return

  // 拖拽时阻止页面跟随滚动，避免移动端用户调整按钮位置时误滚页面。
  event.preventDefault()
  hasValidStoredPosition.value = true
  hasCustomPosition.value = true
  isDragging.value = true
  setPosition({
    x: startPositionX + deltaX,
    y: startPositionY + deltaY,
  })
}

function handlePointerUp() {
  if (isDragging.value) {
    suppressNextClick.value = true
    commitDragPosition()
    window.setTimeout(() => {
      suppressNextClick.value = false
    }, 80)
  }
  isDragging.value = false
  cleanupDragListeners()
}

function handleClick(event: MouseEvent) {
  if (suppressNextClick.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  scrollToTop()
}

function handleResize() {
  if (shouldUseCustomPosition.value) setPosition(position)
  updateVisibility()
  if (shouldUseCustomPosition.value) savePosition()
}

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    window.setTimeout(updateVisibility, 80)
  },
)

onMounted(() => {
  isMounted.value = true
  initializePosition()
  updateVisibility()
  window.addEventListener('scroll', updateVisibility, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateVisibility)
  window.removeEventListener('resize', handleResize)
  cleanupDragListeners()
})
</script>

<template>
  <Transition name="global-back-to-top">
    <button
      v-if="isMounted && isEnabled && shouldShow"
      type="button"
      data-permission-neutral
      :style="activeButtonStyle()"
      :class="[
        'fixed z-40 flex size-12 items-center justify-center rounded-full border border-border/60 bg-primary text-primary-foreground shadow-lg shadow-black/15',
        'right-8 bottom-24 max-sm:right-4 max-sm:bottom-22',
        'transition-[opacity,transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95',
        isDragging ? 'cursor-grabbing opacity-80' : 'cursor-pointer',
      ]"
      title="点击返回顶部，拖动可调整位置"
      aria-label="点击返回顶部，拖动可调整位置"
      @click="handleClick"
      @pointerdown="handlePointerDown"
    >
      <ArrowUp class="size-5" aria-hidden="true" />
      <span class="sr-only">返回顶部</span>
    </button>
  </Transition>
</template>

<style scoped>
.global-back-to-top-enter-active,
.global-back-to-top-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.global-back-to-top-enter-from,
.global-back-to-top-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.92);
}

button {
  touch-action: none;
}
</style>

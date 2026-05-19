<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Tool = 'rect' | 'arrow' | 'line' | 'text' | 'number'
type Point = { x: number; y: number }
type TouchLike = MouseEvent | TouchEvent

const emit = defineEmits<{
  (e: 'save', file: File): void
}>()
const tools: Tool[] = ['rect', 'arrow', 'line', 'number', 'text']
const canvasRef = ref<HTMLCanvasElement | null>(null)
const tool = ref<Tool>('rect')
const color = ref('#ef4444')
const text = ref('')
const numberText = ref('1')
const drawing = ref(false)
const start = ref<Point>({ x: 0, y: 0 })
const history = ref<ImageData[]>([])
const annotationData = ref<Array<{ tool: Tool; color: string; text?: string; from: Point; to: Point }>>([])
const saving = ref(false)
let image: HTMLImageElement | null = null
let snapshot: ImageData | null = null

async function loadFile(file: File) {
  const url = URL.createObjectURL(file)
  image = new Image()
  image.onload = async () => {
    await nextTick()
    const canvas = canvasRef.value
    if (!canvas || !image) return
    const maxWidth = 1600
    const scale = Math.min(1, maxWidth / image.width)
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(image, 0, 0, canvas.width, canvas.height)
    history.value = []
    annotationData.value = []
    saveHistory()
    URL.revokeObjectURL(url)
  }
  image.src = url
}

function point(event: TouchLike): Point {
  const rect = canvasRef.value?.getBoundingClientRect()
  const source = 'touches' in event ? event.touches[0] || event.changedTouches[0] : event
  if (!source) return { x: 0, y: 0 }
  return {
    x: ((source.clientX - (rect?.left || 0)) / (rect?.width || 1)) * (canvasRef.value?.width || 1),
    y: ((source.clientY - (rect?.top || 0)) / (rect?.height || 1)) * (canvasRef.value?.height || 1),
  }
}

function saveHistory() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  history.value.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
  if (history.value.length > 30) history.value.shift()
}

function down(event: TouchLike) {
  event.preventDefault()
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  drawing.value = true
  start.value = point(event)
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
}

function move(event: TouchLike) {
  if (!drawing.value || !snapshot) return
  event.preventDefault()
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  const p = point(event)
  ctx.putImageData(snapshot, 0, 0)
  draw(ctx, start.value, p)
}

function up(event: TouchLike) {
  if (!drawing.value) return
  event.preventDefault()
  drawing.value = false
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || !snapshot) return
  const p = point(event)
  ctx.putImageData(snapshot, 0, 0)
  draw(ctx, start.value, p)
  annotationData.value.push({ tool: tool.value, color: color.value, text: currentText(), from: start.value, to: p })
  saveHistory()
}

function currentText() {
  return tool.value === 'number' ? numberText.value : text.value || '说明'
}

function draw(ctx: CanvasRenderingContext2D, a: Point, b: Point) {
  ctx.strokeStyle = color.value
  ctx.fillStyle = color.value
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  if (tool.value === 'rect') ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y)
  if (tool.value === 'line' || tool.value === 'arrow') drawLine(ctx, a, b, tool.value === 'arrow')
  if (tool.value === 'text' || tool.value === 'number') {
    ctx.font = tool.value === 'number' ? 'bold 32px sans-serif' : '28px sans-serif'
    if (tool.value === 'number') drawNumber(ctx, b, numberText.value)
    else ctx.fillText(currentText(), b.x, b.y)
  }
}

function drawNumber(ctx: CanvasRenderingContext2D, p: Point, value: string) {
  ctx.beginPath()
  ctx.arc(p.x, p.y - 10, 18, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(value, p.x, p.y - 10)
  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = color.value
}

function drawLine(ctx: CanvasRenderingContext2D, a: Point, b: Point, arrow: boolean) {
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  if (!arrow) return
  const angle = Math.atan2(b.y - a.y, b.x - a.x)
  const len = 18
  ctx.beginPath()
  ctx.moveTo(b.x, b.y)
  ctx.lineTo(b.x - len * Math.cos(angle - Math.PI / 6), b.y - len * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(b.x - len * Math.cos(angle + Math.PI / 6), b.y - len * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

function undo() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || history.value.length <= 1) return
  history.value.pop()
  const previous = history.value[history.value.length - 1]
  if (!previous) return
  annotationData.value.pop()
  ctx.putImageData(previous, 0, 0)
}

function clearMarks() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || !history.value[0]) return
  ctx.putImageData(history.value[0], 0, 0)
  history.value = [history.value[0]]
  annotationData.value = []
}

function selectTool(nextTool: Tool) {
  tool.value = nextTool
}

function save() {
  if (saving.value) return
  const canvas = canvasRef.value
  if (!canvas) return
  saving.value = true
  canvas.toBlob((blob) => {
    saving.value = false
    if (!blob) return
    const file = new File([blob], `annotated-${Date.now()}.png`, { type: 'image/png' })
    Object.defineProperty(file, 'annotationData', { value: JSON.stringify(annotationData.value) })
    emit('save', file)
  }, 'image/png')
}

defineExpose({ loadFile })
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <Button v-for="item in tools" :key="item" type="button" size="sm" :variant="tool === item ? 'default' : 'outline'" @click="selectTool(item)">
        {{ item === 'rect' ? '画框' : item === 'arrow' ? '箭头' : item === 'line' ? '画线' : item === 'number' ? '编号' : '文字' }}
      </Button>
      <Input v-model="color" type="color" class="h-9 w-14 p-1" />
      <Input v-model="numberText" class="w-16" placeholder="编号" />
      <Textarea v-model="text" class="h-9 min-h-9 w-56" placeholder="文字说明" />
      <Button type="button" variant="outline" @click="undo">撤销</Button>
      <Button type="button" variant="outline" @click="clearMarks">清空标注</Button>
      <Button type="button" permission="bug:attachment:upload" :disabled="saving" @click.stop.prevent="save">{{ saving ? '生成中...' : '保存并上传' }}</Button>
    </div>
    <div class="max-h-[60vh] overflow-auto rounded border bg-muted/30 p-2">
      <canvas ref="canvasRef" class="max-w-full touch-none cursor-crosshair" @mousedown="down" @mousemove="move" @mouseup="up" @mouseleave="up" @touchstart="down" @touchmove="move" @touchend="up" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ClockIcon, CalendarIcon, ChevronDownIcon } from 'lucide-vue-next'
import { formatCronExpression } from '@/utils/format'

interface Props {
  modelValue?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '0 * * * * ?',
  placeholder: '请输入或选择 Cron 表达式',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const open = ref(false)

// Cron 各部分
const second = ref('0')
const minute = ref('*')
const hour = ref('*')
const day = ref('*')
const month = ref('*')
const week = ref('?')

// 预设模板
const presets = [
  { label: '每秒执行', value: '* * * * * ?' },
  { label: '每分钟执行', value: '0 * * * * ?' },
  { label: '每小时执行', value: '0 0 * * * ?' },
  { label: '每天 0 点', value: '0 0 0 * * ?' },
  { label: '每天 8 点', value: '0 0 8 * * ?' },
  { label: '每天 12 点', value: '0 0 12 * * ?' },
  { label: '每周一 9 点', value: '0 0 9 ? * MON' },
  { label: '每月 1 号 0 点', value: '0 0 0 1 * ?' },
  { label: '每 5 分钟', value: '0 */5 * * * ?' },
  { label: '每 30 分钟', value: '0 */30 * * * ?' },
]

// 生成的表达式
const cronExpression = computed(() => {
  return `${second.value} ${minute.value} ${hour.value} ${day.value} ${month.value} ${week.value}`
})

// 解析表达式
function parseCron(cron: string) {
  const parts = cron.trim().split(/\s+/)
  if (parts.length >= 6) {
    second.value = parts[0] ?? '0'
    minute.value = parts[1] ?? '*'
    hour.value = parts[2] ?? '*'
    day.value = parts[3] ?? '*'
    month.value = parts[4] ?? '*'
    week.value = parts[5] ?? '?'
  }
}

// 初始化
watch(
  () => props.modelValue,
  (val) => {
    if (val) parseCron(val)
  },
  { immediate: true }
)

// 应用表达式
function apply() {
  emit('update:modelValue', cronExpression.value)
  open.value = false
}

// 选择预设
function selectPreset(value: string) {
  parseCron(value)
}

// 表达式说明
const cronDescription = computed(() => formatCronExpression(cronExpression.value))

// 计算下次执行时间（简化版）
const _nextExecutions = computed(() => {
  const results: string[] = []
  const now = new Date()

  // 简化计算，只处理常见情况
  for (let i = 0; i < 5; i++) {
    const next = new Date(now.getTime() + i * 60000)
    results.push(
      next.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    )
  }
  return results
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="outline" class="w-full justify-between font-mono text-sm">
        <span>{{ modelValue || placeholder }}</span>
        <ChevronDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[480px] p-0" align="start">
      <Tabs default-value="preset" class="w-full">
        <TabsList class="w-full grid grid-cols-3">
          <TabsTrigger value="preset">常用预设</TabsTrigger>
          <TabsTrigger value="custom">自定义</TabsTrigger>
          <TabsTrigger value="manual">手动输入</TabsTrigger>
        </TabsList>

        <!-- 预设 -->
        <TabsContent value="preset" class="p-4">
          <div class="grid grid-cols-2 gap-2">
            <Button
              v-for="preset in presets"
              :key="preset.value"
              variant="outline"
              size="sm"
              class="justify-start text-xs"
              @click="selectPreset(preset.value)"
            >
              <ClockIcon class="mr-2 h-3 w-3" />
              {{ preset.label }}
            </Button>
          </div>
        </TabsContent>

        <!-- 自定义 -->
        <TabsContent value="custom" class="p-4 space-y-4">
          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1">
              <Label class="text-xs">秒</Label>
              <Select v-model="second">
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (固定)</SelectItem>
                  <SelectItem value="*">* (每秒)</SelectItem>
                  <SelectItem value="*/5">*/5 (每5秒)</SelectItem>
                  <SelectItem value="*/10">*/10 (每10秒)</SelectItem>
                  <SelectItem value="*/30">*/30 (每30秒)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs">分</Label>
              <Select v-model="minute">
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (整点)</SelectItem>
                  <SelectItem value="*">* (每分钟)</SelectItem>
                  <SelectItem value="*/5">*/5 (每5分钟)</SelectItem>
                  <SelectItem value="*/10">*/10 (每10分钟)</SelectItem>
                  <SelectItem value="*/15">*/15 (每15分钟)</SelectItem>
                  <SelectItem value="*/30">*/30 (每30分钟)</SelectItem>
                  <SelectItem value="30">30 (半点)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs">时</Label>
              <Select v-model="hour">
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="*">* (每小时)</SelectItem>
                  <SelectItem value="0">0 (0点)</SelectItem>
                  <SelectItem value="6">6 (6点)</SelectItem>
                  <SelectItem value="8">8 (8点)</SelectItem>
                  <SelectItem value="9">9 (9点)</SelectItem>
                  <SelectItem value="12">12 (12点)</SelectItem>
                  <SelectItem value="18">18 (18点)</SelectItem>
                  <SelectItem value="*/2">*/2 (每2小时)</SelectItem>
                  <SelectItem value="*/6">*/6 (每6小时)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs">日</Label>
              <Select v-model="day">
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="*">* (每天)</SelectItem>
                  <SelectItem value="?">? (不指定)</SelectItem>
                  <SelectItem value="1">1 (1号)</SelectItem>
                  <SelectItem value="15">15 (15号)</SelectItem>
                  <SelectItem value="L">L (最后一天)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs">月</Label>
              <Select v-model="month">
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="*">* (每月)</SelectItem>
                  <SelectItem value="1">1 (1月)</SelectItem>
                  <SelectItem value="*/3">*/3 (每季度)</SelectItem>
                  <SelectItem value="*/6">*/6 (每半年)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs">周</Label>
              <Select v-model="week">
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="?">? (不指定)</SelectItem>
                  <SelectItem value="*">* (每天)</SelectItem>
                  <SelectItem value="MON">MON (周一)</SelectItem>
                  <SelectItem value="TUE">TUE (周二)</SelectItem>
                  <SelectItem value="WED">WED (周三)</SelectItem>
                  <SelectItem value="THU">THU (周四)</SelectItem>
                  <SelectItem value="FRI">FRI (周五)</SelectItem>
                  <SelectItem value="SAT">SAT (周六)</SelectItem>
                  <SelectItem value="SUN">SUN (周日)</SelectItem>
                  <SelectItem value="MON-FRI">MON-FRI (工作日)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <!-- 手动输入 -->
        <TabsContent value="manual" class="p-4">
          <div class="space-y-2">
            <Label class="text-xs">Cron 表达式</Label>
            <Input
              :model-value="cronExpression"
              placeholder="秒 分 时 日 月 周"
              class="font-mono"
              @update:model-value="parseCron(String($event))"
            />
            <p class="text-xs text-muted-foreground">
              格式：秒(0-59) 分(0-59) 时(0-23) 日(1-31) 月(1-12) 周(1-7或SUN-SAT)
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <!-- 预览区域 -->
      <div class="border-t p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">生成表达式</span>
          <Badge variant="secondary" class="font-mono">{{ cronExpression }}</Badge>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">执行说明</span>
          <span class="text-sm">{{ cronDescription }}</span>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" @click="open = false">取消</Button>
          <Button size="sm" @click="apply">
            <CalendarIcon class="mr-2 h-4 w-4" />
            应用
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

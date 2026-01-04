<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, X } from 'lucide-vue-next'
import type { FormField } from '../types'

const selectedField = defineModel<FormField | null>('selectedField')

// --- Options Management ---
function addOption() {
  if (!selectedField.value?.options) return
  selectedField.value.options.push({
    label: `选项${selectedField.value.options.length + 1}`,
    value: `${selectedField.value.options.length + 1}`,
  })
}

function removeOption(index: number) {
  if (!selectedField.value?.options) return
  selectedField.value.options.splice(index, 1)
}
</script>

<template>
  <ScrollArea class="h-full p-4">
    <Card v-if="selectedField">
      <CardHeader>
        <CardTitle class="text-sm">组件配置</CardTitle>
        <CardDescription>配置选中组件的属性</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label>标题 (Label)</Label>
          <Input v-model="selectedField.label" />
        </div>

        <div v-if="selectedField.type !== 'alert'" class="space-y-2">
          <Label>字段名 (Key)</Label>
          <Input v-model="selectedField.key" />
        </div>

        <div v-if="selectedField.type !== 'alert'" class="space-y-2">
          <Label>提示说明 (Tooltip)</Label>
          <Input v-model="selectedField.tooltip" placeholder="输入提示内容..." />
        </div>

        <div
          v-if="['input', 'textarea', 'select', 'date'].includes(selectedField.type)"
          class="space-y-2"
        >
          <Label>占位符 (Placeholder)</Label>
          <Input v-model="selectedField.placeholder" />
        </div>

        <div
          v-if="selectedField.type !== 'alert'"
          class="flex items-center justify-between rounded-lg border p-3 shadow-sm"
        >
          <div class="space-y-0.5">
            <Label>必填</Label>
          </div>
          <Switch v-model:checked="selectedField.required" />
        </div>

        <!-- Slider Properties -->
        <div v-if="selectedField.type === 'slider'" class="space-y-4 pt-2">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>最小值</Label>
              <Input v-model.number="selectedField.min" type="number" />
            </div>
            <div class="space-y-2">
              <Label>最大值</Label>
              <Input v-model.number="selectedField.max" type="number" />
            </div>
          </div>
          <div class="space-y-2">
            <Label>步长 (Step)</Label>
            <Input v-model.number="selectedField.step" type="number" />
          </div>
        </div>

        <!-- Pin Input Properties -->
        <div v-if="selectedField.type === 'pin-input'" class="space-y-2 pt-2">
          <Label>验证码位数</Label>
          <Input v-model.number="selectedField.pinCount" type="number" :min="1" :max="8" />
        </div>

        <!-- Alert Properties -->
        <div v-if="selectedField.type === 'alert'" class="space-y-2">
          <Label>提示内容</Label>
          <Textarea v-model="selectedField.description" rows="4" />
        </div>

        <!-- Options Editor -->
        <div
          v-if="
            [
              'select',
              'radio',
              'toggle-group',
              'combobox',
              'accordion',
              'tabs',
              'dropdown-menu',
              'menubar',
              'navigation-menu',
              'context-menu',
              'breadcrumb',
              'carousel',
              'table',
            ].includes(selectedField.type)
          "
          class="space-y-3 pt-4 border-t"
        >
          <div class="flex items-center justify-between">
            <Label>选项配置</Label>
            <Button variant="outline" size="sm" @click="addOption">
              <Plus class="h-3 w-3 mr-1" /> 添加
            </Button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(opt, idx) in selectedField.options"
              :key="idx"
              class="flex gap-2 items-center"
            >
              <Input v-model="opt.label" placeholder="Label" class="h-8 text-xs" />
              <Input v-model="opt.value" placeholder="Value" class="h-8 text-xs" />
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 shrink-0 text-destructive"
                @click="removeOption(idx)"
              >
                <X class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Progress Properties -->
        <div v-if="(selectedField as any).type === 'progress'" class="space-y-2 pt-2">
          <Label>进度值 (0-100)</Label>
          <Input
            v-model.number="(selectedField as any).progress"
            type="number"
            :min="0"
            :max="100"
          />
        </div>

        <!-- Skeleton Properties -->
        <div v-if="(selectedField as any).type === 'skeleton'" class="space-y-2 pt-2">
          <Label>大小</Label>
          <Select v-model="(selectedField as any).skeletonSize">
            <SelectTrigger>
              <SelectValue placeholder="选择大小" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">小 (h-4)</SelectItem>
              <SelectItem value="md">中 (h-6)</SelectItem>
              <SelectItem value="lg">大 (h-8)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Aspect Ratio Properties -->
        <div v-if="selectedField.type === 'aspect-ratio'" class="space-y-2 pt-2">
          <Label>比例 (如 16:9 -> 1.7778)</Label>
          <Input v-model.number="selectedField.ratio" type="number" step="0.0001" />
        </div>
      </CardContent>
    </Card>
    <Card v-else>
      <CardHeader>
        <CardTitle class="text-sm">未选中组件</CardTitle>
        <CardDescription> 请点击中间画布中的组件以进行配置。 </CardDescription>
      </CardHeader>
    </Card>
  </ScrollArea>
</template>

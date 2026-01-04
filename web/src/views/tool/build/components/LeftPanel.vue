<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus } from 'lucide-vue-next'
import type { FormField } from '../types'

const emit = defineEmits<{
  (e: 'add-field', type: FormField['type']): void
}>()

function addField(type: FormField['type'] | string) {
  emit('add-field', type as FormField['type'])
}
</script>

<template>
  <ScrollArea class="h-full p-4">
    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="text-sm">基础组件</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 gap-2">
          <Button variant="outline" class="w-full justify-start" @click="addField('input')">
            <Plus class="mr-2 h-4 w-4" /> 单行文本
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('textarea')">
            <Plus class="mr-2 h-4 w-4" /> 多行文本
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('select')">
            <Plus class="mr-2 h-4 w-4" /> 下拉选择
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('radio')">
            <Plus class="mr-2 h-4 w-4" /> 单选框
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('checkbox')">
            <Plus class="mr-2 h-4 w-4" /> 复选框
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('switch')">
            <Plus class="mr-2 h-4 w-4" /> 开关
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-sm">进阶组件</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 gap-2">
          <Button variant="outline" class="w-full justify-start" @click="addField('date')">
            <Plus class="mr-2 h-4 w-4" /> 日期选择
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('slider')">
            <Plus class="mr-2 h-4 w-4" /> 滑块 (Slider)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('alert')">
            <Plus class="mr-2 h-4 w-4" /> 提示信息 (Alert)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-sm">其他组件</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 gap-2">
          <Button variant="outline" class="w-full justify-start" @click="addField('pin-input')">
            <Plus class="mr-2 h-4 w-4" /> 验证码 (Pin Input)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('toggle-group')">
            <Plus class="mr-2 h-4 w-4" /> 切换组 (Toggle Group)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('toggle')">
            <Plus class="mr-2 h-4 w-4" /> 切换按钮 (Toggle)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('combobox')">
            <Plus class="mr-2 h-4 w-4" /> 搜索选择 (Combobox)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-sm">展示组件</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 gap-2">
          <Button variant="outline" class="w-full justify-start" @click="addField('separator')">
            <Plus class="mr-2 h-4 w-4" /> 分隔线 (Separator)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('progress')">
            <Plus class="mr-2 h-4 w-4" /> 进度条 (Progress)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('skeleton')">
            <Plus class="mr-2 h-4 w-4" /> 骨架屏 (Skeleton)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('breadcrumb')">
            <Plus class="mr-2 h-4 w-4" /> 面包屑 (Breadcrumb)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('pagination')">
            <Plus class="mr-2 h-4 w-4" /> 分页 (Pagination)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('collapsible')">
            <Plus class="mr-2 h-4 w-4" /> 可折叠 (Collapsible)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('carousel')">
            <Plus class="mr-2 h-4 w-4" /> 轮播 (Carousel)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('aspect-ratio')">
            <Plus class="mr-2 h-4 w-4" /> 比例容器 (AspectRatio)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('table')">
            <Plus class="mr-2 h-4 w-4" /> 表格 (Table)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-sm">布局/交互组件</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 gap-2">
          <Button variant="outline" class="w-full justify-start" @click="addField('accordion')">
            <Plus class="mr-2 h-4 w-4" /> 手风琴 (Accordion)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('tabs')">
            <Plus class="mr-2 h-4 w-4" /> 标签页 (Tabs)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('alert-dialog')">
            <Plus class="mr-2 h-4 w-4" /> 确认弹窗 (Alert Dialog)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('drawer')">
            <Plus class="mr-2 h-4 w-4" /> 抽屉 (Drawer)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('sheet')">
            <Plus class="mr-2 h-4 w-4" /> 侧边弹出 (Sheet)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('hover-card')">
            <Plus class="mr-2 h-4 w-4" /> 悬浮卡片 (Hover Card)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('dropdown-menu')">
            <Plus class="mr-2 h-4 w-4" /> 下拉菜单 (Dropdown Menu)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('menubar')">
            <Plus class="mr-2 h-4 w-4" /> 菜单栏 (Menubar)
          </Button>
          <Button
            variant="outline"
            class="w-full justify-start"
            @click="addField('navigation-menu')"
          >
            <Plus class="mr-2 h-4 w-4" /> 导航菜单 (Navigation Menu)
          </Button>
          <Button variant="outline" class="w-full justify-start" @click="addField('context-menu')">
            <Plus class="mr-2 h-4 w-4" /> 右键菜单 (Context Menu)
          </Button>
        </CardContent>
      </Card>
    </div>
  </ScrollArea>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Eye, Save, Code2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

import LeftPanel from './components/LeftPanel.vue'
import CenterPanel from './components/CenterPanel.vue'
import RightPanel from './components/RightPanel.vue'
import PreviewModal from './components/PreviewModal.vue'
import CodeModal from './components/CodeModal.vue'

import type { FormField } from './types'
import { generateVueCode as generateCodeUtil } from './utils/code-generator'

const { toast } = useToast()

const fields = ref<FormField[]>([
  {
    id: '1',
    type: 'input',
    label: '用户名',
    key: 'username',
    placeholder: '请输入用户名',
    required: true,
  },
  {
    id: '2',
    type: 'input',
    label: '密码',
    key: 'password',
    placeholder: '请输入密码',
    required: true,
  },
])

const selectedFieldId = ref<string | null>(null)
const showPreview = ref(false)
const showCode = ref(false)
const generatedCode = ref('')

const selectedField = computed(
  () => fields.value.find((f) => f.id === selectedFieldId.value) || null,
)

// --- Field Management ---
function addField(type: FormField['type']) {
  const id = Date.now().toString()
  const field: FormField = {
    id,
    type,
    label: '新字段',
    key: `field_${id}`,
    placeholder: '请输入...',
    required: false,
  }

  if (type === 'select' || type === 'radio') {
    field.options = [
      { label: '选项1', value: '1' },
      { label: '选项2', value: '2' },
    ]
  } else if (type === 'slider') {
    field.label = '滑块'
    field.min = 0
    field.max = 100
    field.step = 1
  } else if (type === 'date') {
    field.label = '日期选择'
    field.placeholder = '选择日期'
  } else if (type === 'alert') {
    field.label = '提示信息'
    field.description = '这是一段静态的提示信息，用于告知用户相关注意事项。'
  } else if (type === 'pin-input') {
    field.label = '验证码'
    field.pinCount = 4
  } else if (type === 'toggle-group') {
    field.label = '切换组'
    field.options = [
      { label: '左', value: 'left' },
      { label: '中', value: 'center' },
      { label: '右', value: 'right' },
    ]
  } else if (type === 'toggle') {
    field.label = '切换按钮'
  } else if (type === 'combobox') {
    field.label = '搜索选择'
    field.placeholder = '请选择'
    field.options = [
      { label: '选项1', value: '1' },
      { label: '选项2', value: '2' },
    ]
  } else if ((type as any) === 'separator') {
    field.label = '分隔线'
  } else if ((type as any) === 'progress') {
    field.label = '进度'
    field.progress = 50
  } else if ((type as any) === 'skeleton') {
    field.label = '骨架'
    field.skeletonSize = 'md'
  } else if (type === 'accordion') {
    field.label = '手风琴'
    field.options = [
      { label: '项一', value: 'item-1' },
      { label: '项二', value: 'item-2' },
    ]
  } else if (type === 'tabs') {
    field.label = '标签页'
    field.options = [
      { label: 'Tab A', value: 'a' },
      { label: 'Tab B', value: 'b' },
    ]
  } else if (type === 'alert-dialog') {
    field.label = '确认弹窗'
    field.description = '这是一个确认提示'
  } else if (type === 'drawer') {
    field.label = '抽屉'
    field.side = 'left'
  } else if (type === 'sheet') {
    field.label = '侧边弹出'
    field.side = 'right'
  } else if (type === 'hover-card') {
    field.label = '悬浮卡片'
  } else if (type === 'dropdown-menu') {
    field.label = '下拉菜单'
    field.options = [
      { label: '操作一', value: 'op1' },
      { label: '操作二', value: 'op2' },
    ]
  } else if (type === 'menubar') {
    field.label = '菜单栏'
    field.options = [
      { label: '文件', value: 'file' },
      { label: '编辑', value: 'edit' },
    ]
  } else if (type === 'navigation-menu') {
    field.label = '导航菜单'
    field.options = [
      { label: '首页', value: 'home' },
      { label: '设置', value: 'settings' },
    ]
  } else if (type === 'context-menu') {
    field.label = '右键菜单'
    field.options = [
      { label: '复制', value: 'copy' },
      { label: '粘贴', value: 'paste' },
    ]
  } else if (type === 'breadcrumb') {
    field.label = '面包屑'
    field.options = [
      { label: '首页', value: 'home' },
      { label: '设置', value: 'settings' },
      { label: '详情', value: 'detail' },
    ]
  } else if (type === 'pagination') {
    field.label = '分页'
  } else if (type === 'collapsible') {
    field.label = '可折叠区块'
    field.options = [{ label: '折叠项', value: 'item' }]
  } else if (type === 'carousel') {
    field.label = '轮播'
    field.options = [
      { label: '幻灯 1', value: 's1' },
      { label: '幻灯 2', value: 's2' },
      { label: '幻灯 3', value: 's3' },
    ]
  } else if (type === 'aspect-ratio') {
    field.label = '比例容器'
    field.ratio = 1.7778
  } else if (type === 'table') {
    field.label = '表格'
    field.options = [
      { label: '名称', value: 'name' },
      { label: '年龄', value: 'age' },
    ]
  }

  fields.value.push(field)
  selectedFieldId.value = id // Auto select new field
}

function removeField(index: number) {
  const field = fields.value[index]
  if (field && selectedFieldId.value === field.id) {
    selectedFieldId.value = null
  }
  fields.value.splice(index, 1)
}

function copyField(index: number) {
  const original = fields.value[index]
  if (!original) return

  const newField = JSON.parse(JSON.stringify(original))
  newField.id = Date.now().toString()
  newField.key = `${original.key}_copy`
  newField.label = `${original.label} (复制)`

  fields.value.splice(index + 1, 0, newField)
  selectedFieldId.value = newField.id
}

function handleReorder(from: number, to: number) {
  const item = fields.value.splice(from, 1)[0]
  if (item) {
    fields.value.splice(to, 0, item)
  }
}

function generateVueCode() {
  generatedCode.value = generateCodeUtil(fields.value)
  showCode.value = true
}

function handleSave() {
  toast({ title: '保存成功', description: '表单配置已保存' })
}
</script>

<template>
  <div class="p-6 h-[calc(100vh-4rem)] flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-none">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">表单构建</h2>
        <p class="text-muted-foreground">拖拽式表单生成器</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="showPreview = true">
          <Eye class="mr-2 h-4 w-4" />
          预览
        </Button>
        <Button variant="outline" @click="generateVueCode">
          <Code2 class="mr-2 h-4 w-4" />
          生成代码
        </Button>
        <Button @click="handleSave">
          <Save class="mr-2 h-4 w-4" />
          保存设计
        </Button>
      </div>
    </div>

    <ResizablePanelGroup direction="horizontal" class="flex-1 min-h-0 rounded-lg border shadow-sm">
      <!-- Left Sidebar: Components -->
      <ResizablePanel :default-size="20" :min-size="15" :max-size="30" class="bg-background">
        <LeftPanel @add-field="addField" />
      </ResizablePanel>

      <ResizableHandle />

      <!-- Center: Canvas -->
      <ResizablePanel :default-size="60">
        <CenterPanel
          :fields="fields"
          :selected-field-id="selectedFieldId"
          @select="(id) => (selectedFieldId = id)"
          @delete="removeField"
          @copy="copyField"
          @reorder="handleReorder"
        />
      </ResizablePanel>

      <ResizableHandle />

      <!-- Right Sidebar: Properties -->
      <ResizablePanel :default-size="20" :min-size="15" :max-size="30" class="bg-background">
        <RightPanel v-model:selected-field="selectedField" />
      </ResizablePanel>

      <!-- Preview Dialog -->
      <PreviewModal v-model:open="showPreview" :fields="fields" />

      <!-- Code Generation Dialog -->
      <CodeModal v-model:open="showCode" :code="generatedCode" />
    </ResizablePanelGroup>
  </div>
</template>

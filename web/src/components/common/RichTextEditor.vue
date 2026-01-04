<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  RemoveFormatting,
} from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  minHeight?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 链接弹窗
const linkUrl = ref('')
const showLinkPopover = ref(false)

// 图片弹窗
const imageUrl = ref('')
const showImagePopover = ref(false)

// 颜色选项
const textColors = [
  '#000000',
  '#374151',
  '#6B7280',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
]

const highlightColors = [
  '#FEF08A',
  '#FED7AA',
  '#FECACA',
  '#BBF7D0',
  '#A5F3FC',
  '#DDD6FE',
  '#FBCFE8',
]

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
    }),
    Image.configure({
      HTMLAttributes: { class: 'max-w-full h-auto rounded-md' },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Underline.configure(),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Placeholder.configure({
      placeholder: props.placeholder || '请输入内容...',
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
      style: props.minHeight ? `min-height: ${props.minHeight}` : '',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && editor.value.getHTML() !== newValue) {
      editor.value.commands.setContent(newValue, { emitUpdate: false })
    }
  }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// 设置链接
function setLink() {
  if (!linkUrl.value) {
    editor.value?.chain().focus().unsetLink().run()
  } else {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.value }).run()
  }
  showLinkPopover.value = false
  linkUrl.value = ''
}

// 添加图片
function addImage() {
  if (imageUrl.value) {
    editor.value?.chain().focus().setImage({ src: imageUrl.value }).run()
  }
  showImagePopover.value = false
  imageUrl.value = ''
}

// 设置文字颜色
function setColor(color: string) {
  editor.value?.chain().focus().setColor(color).run()
}

// 设置高亮颜色
function setHighlight(color: string) {
  editor.value?.chain().focus().toggleHighlight({ color }).run()
}
</script>

<template>
  <div class="border rounded-md overflow-hidden bg-background">
    <!-- 工具栏 -->
    <div v-if="editor" class="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
      <!-- 撤销/重做 -->
      <Toggle
        size="sm"
        :pressed="false"
        :disabled="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
      >
        <Undo class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="false"
        :disabled="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
      >
        <Redo class="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" class="mx-1 h-6" />

      <!-- 标题 -->
      <Toggle
        size="sm"
        :pressed="editor.isActive('heading', { level: 1 })"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <Heading1 class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive('heading', { level: 2 })"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <Heading2 class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive('heading', { level: 3 })"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <Heading3 class="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" class="mx-1 h-6" />

      <!-- 文字样式 -->
      <Toggle
        size="sm"
        :pressed="editor.isActive('bold')"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <Bold class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive('italic')"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <Italic class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive('underline')"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <UnderlineIcon class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive('strike')"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <Strikethrough class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive('code')"
        @click="editor.chain().focus().toggleCode().run()"
      >
        <Code class="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" class="mx-1 h-6" />

      <!-- 颜色 -->
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
            <Palette class="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-2">
          <div class="grid grid-cols-6 gap-1">
            <button
              v-for="color in textColors"
              :key="color"
              class="w-6 h-6 rounded border hover:scale-110 transition-transform"
              :style="{ backgroundColor: color }"
              @click="setColor(color)"
            />
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
            <Highlighter class="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-2">
          <div class="flex gap-1">
            <button
              v-for="color in highlightColors"
              :key="color"
              class="w-6 h-6 rounded border hover:scale-110 transition-transform"
              :style="{ backgroundColor: color }"
              @click="setHighlight(color)"
            />
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" class="mx-1 h-6" />

      <!-- 对齐 -->
      <Toggle
        size="sm"
        :pressed="editor.isActive({ textAlign: 'left' })"
        @click="editor.chain().focus().setTextAlign('left').run()"
      >
        <AlignLeft class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive({ textAlign: 'center' })"
        @click="editor.chain().focus().setTextAlign('center').run()"
      >
        <AlignCenter class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive({ textAlign: 'right' })"
        @click="editor.chain().focus().setTextAlign('right').run()"
      >
        <AlignRight class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive({ textAlign: 'justify' })"
        @click="editor.chain().focus().setTextAlign('justify').run()"
      >
        <AlignJustify class="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" class="mx-1 h-6" />

      <!-- 列表 -->
      <Toggle
        size="sm"
        :pressed="editor.isActive('bulletList')"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <List class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive('orderedList')"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <ListOrdered class="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        :pressed="editor.isActive('blockquote')"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        <Quote class="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" :pressed="false" @click="editor.chain().focus().setHorizontalRule().run()">
        <Minus class="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" class="mx-1 h-6" />

      <!-- 链接 -->
      <Popover v-model:open="showLinkPopover">
        <PopoverTrigger as-child>
          <Toggle size="sm" :pressed="editor.isActive('link')">
            <LinkIcon class="h-4 w-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <div class="grid gap-4">
            <div class="space-y-2">
              <Label>链接地址</Label>
              <Input v-model="linkUrl" placeholder="https://" @keyup.enter="setLink" />
            </div>
            <div class="flex justify-end gap-2">
              <Button size="sm" variant="outline" @click="showLinkPopover = false">取消</Button>
              <Button size="sm" @click="setLink">确定</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <!-- 图片 -->
      <Popover v-model:open="showImagePopover">
        <PopoverTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
            <ImageIcon class="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <div class="grid gap-4">
            <div class="space-y-2">
              <Label>图片地址</Label>
              <Input v-model="imageUrl" placeholder="https://" @keyup.enter="addImage" />
            </div>
            <div class="flex justify-end gap-2">
              <Button size="sm" variant="outline" @click="showImagePopover = false">取消</Button>
              <Button size="sm" @click="addImage">确定</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" class="mx-1 h-6" />

      <!-- 清除格式 -->
      <Toggle
        size="sm"
        :pressed="false"
        @click="editor.chain().focus().clearNodes().unsetAllMarks().run()"
      >
        <RemoveFormatting class="h-4 w-4" />
      </Toggle>
    </div>

    <!-- 编辑区域 -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style>
/* Tiptap 编辑器样式 */
.ProseMirror {
  min-height: 200px;
  padding: 1rem;
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
}

.ProseMirror h1 {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 1rem 0 0.5rem;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 0.875rem 0 0.5rem;
}

.ProseMirror h3 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  margin: 0.75rem 0 0.5rem;
}

.ProseMirror p {
  margin: 0.5rem 0;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.ProseMirror li {
  margin: 0.25rem 0;
}

.ProseMirror blockquote {
  border-left: 3px solid hsl(var(--border));
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: hsl(var(--muted-foreground));
}

.ProseMirror code {
  background-color: hsl(var(--muted));
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875em;
}

.ProseMirror pre {
  background-color: hsl(var(--muted));
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.ProseMirror pre code {
  background: none;
  padding: 0;
}

.ProseMirror hr {
  border: none;
  border-top: 1px solid hsl(var(--border));
  margin: 1rem 0;
}

.ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

.ProseMirror a {
  color: hsl(var(--primary));
  text-decoration: underline;
  cursor: pointer;
}

.ProseMirror mark {
  border-radius: 0.125rem;
  padding: 0.125rem 0;
}
</style>

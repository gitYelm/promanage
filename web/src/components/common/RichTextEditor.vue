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
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Youtube from '@tiptap/extension-youtube'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Table as TableIcon,
  Video,
  Upload,
  Loader2,
} from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'
import request from '@/utils/request'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    minHeight?: string
    imageMaxSize?: number // MB
    videoMaxSize?: number // MB
  }>(),
  {
    imageMaxSize: 5,
    videoMaxSize: 50,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { toast } = useToast()

// 链接弹窗
const linkUrl = ref('')
const showLinkPopover = ref(false)

// 图片弹窗
const imageUrl = ref('')
const showImagePopover = ref(false)
const imageUploading = ref(false)
const imageFileInput = ref<HTMLInputElement>()

// 视频弹窗
const videoUrl = ref('')
const showVideoPopover = ref(false)
const videoUploading = ref(false)
const videoFileInput = ref<HTMLInputElement>()

// 表格弹窗
const tableRows = ref(3)
const tableCols = ref(3)
const showTablePopover = ref(false)

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
      allowBase64: true,
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Placeholder.configure({
      placeholder: props.placeholder || '请输入内容...',
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: { class: 'rich-text-table' },
    }),
    TableRow,
    TableHeader,
    TableCell,
    Youtube.configure({
      HTMLAttributes: { class: 'w-full aspect-video rounded-md' },
      inline: false,
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
  },
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

// 添加图片（URL方式）
function addImage() {
  if (imageUrl.value) {
    editor.value?.chain().focus().setImage({ src: imageUrl.value }).run()
  }
  showImagePopover.value = false
  imageUrl.value = ''
}

// 上传图片
async function handleImageUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast({
      title: '格式不支持',
      description: '请上传 JPG、PNG、GIF、WebP 格式的图片',
      variant: 'destructive',
    })
    target.value = ''
    return
  }

  if (file.size > props.imageMaxSize * 1024 * 1024) {
    toast({
      title: '文件过大',
      description: `图片大小不能超过 ${props.imageMaxSize}MB`,
      variant: 'destructive',
    })
    target.value = ''
    return
  }

  imageUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await request.post('/upload/editor/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // 处理相对路径，添加 API 前缀
    let imgUrl = res.data.url
    if (imgUrl.startsWith('/')) {
      imgUrl = import.meta.env.VITE_API_URL + imgUrl
    }
    showImagePopover.value = false
    // 延迟插入图片，确保弹窗关闭
    setTimeout(() => {
      editor.value?.chain().focus().setImage({ src: imgUrl }).run()
    }, 100)
    toast({ title: '图片上传成功' })
  } catch {
    toast({ title: '上传失败', description: '请稍后重试', variant: 'destructive' })
  } finally {
    imageUploading.value = false
    target.value = ''
  }
}

// 添加视频（URL方式，支持 YouTube）
function addVideo() {
  if (videoUrl.value) {
    // 检查是否是 YouTube 链接
    if (videoUrl.value.includes('youtube.com') || videoUrl.value.includes('youtu.be')) {
      editor.value?.chain().focus().setYoutubeVideo({ src: videoUrl.value }).run()
    } else {
      // 普通视频链接，插入 video 标签
      const videoHtml = `<video controls class="w-full rounded-md"><source src="${videoUrl.value}" type="video/mp4"></video>`
      editor.value?.chain().focus().insertContent(videoHtml).run()
    }
  }
  showVideoPopover.value = false
  videoUrl.value = ''
}

// 上传视频
async function handleVideoUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
  if (!allowedTypes.includes(file.type)) {
    toast({
      title: '格式不支持',
      description: '请上传 MP4、WebM、OGG 格式的视频',
      variant: 'destructive',
    })
    target.value = ''
    return
  }

  if (file.size > props.videoMaxSize * 1024 * 1024) {
    toast({
      title: '文件过大',
      description: `视频大小不能超过 ${props.videoMaxSize}MB`,
      variant: 'destructive',
    })
    target.value = ''
    return
  }

  videoUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await request.post('/upload/editor/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // 处理相对路径
    let vidUrl = res.data.url
    if (vidUrl.startsWith('/')) {
      vidUrl = import.meta.env.VITE_API_URL + vidUrl
    }
    showVideoPopover.value = false
    // 延迟插入视频
    setTimeout(() => {
      const videoHtml = `<video controls class="w-full rounded-md"><source src="${vidUrl}" type="${file.type}"></video>`
      editor.value?.chain().focus().insertContent(videoHtml).run()
    }, 100)
    toast({ title: '视频上传成功' })
  } catch {
    toast({ title: '上传失败', description: '请稍后重试', variant: 'destructive' })
  } finally {
    videoUploading.value = false
    target.value = ''
  }
}

// 设置文字颜色
function setColor(color: string) {
  editor.value?.chain().focus().setColor(color).run()
}

// 设置高亮颜色
function setHighlight(color: string) {
  editor.value?.chain().focus().toggleHighlight({ color }).run()
}

// 插入表格
function insertTable() {
  const rows = Math.max(1, Math.min(20, tableRows.value))
  const cols = Math.max(1, Math.min(10, tableCols.value))
  editor.value?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
  showTablePopover.value = false
  tableRows.value = 3
  tableCols.value = 3
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
          <input
            ref="imageFileInput"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            class="hidden"
            @change="handleImageUpload"
          />
          <Tabs default-value="upload" class="w-full">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="upload">本地上传</TabsTrigger>
              <TabsTrigger value="url">网络地址</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" class="space-y-4">
              <div class="flex flex-col items-center gap-2 py-4">
                <Button
                  variant="outline"
                  :disabled="imageUploading"
                  @click="imageFileInput?.click()"
                >
                  <Loader2 v-if="imageUploading" class="mr-2 h-4 w-4 animate-spin" />
                  <Upload v-else class="mr-2 h-4 w-4" />
                  {{ imageUploading ? '上传中...' : '选择图片' }}
                </Button>
                <p class="text-xs text-muted-foreground">
                  支持 JPG、PNG、GIF、WebP，最大 {{ imageMaxSize }}MB
                </p>
              </div>
            </TabsContent>
            <TabsContent value="url" class="space-y-4">
              <div class="space-y-2">
                <Label>图片地址</Label>
                <Input v-model="imageUrl" placeholder="https://" @keyup.enter="addImage" />
              </div>
              <div class="flex justify-end gap-2">
                <Button size="sm" variant="outline" @click="showImagePopover = false">取消</Button>
                <Button size="sm" @click="addImage">确定</Button>
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      <!-- 视频 -->
      <Popover v-model:open="showVideoPopover">
        <PopoverTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
            <Video class="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <input
            ref="videoFileInput"
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            class="hidden"
            @change="handleVideoUpload"
          />
          <Tabs default-value="upload" class="w-full">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="upload">本地上传</TabsTrigger>
              <TabsTrigger value="url">网络地址</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" class="space-y-4">
              <div class="flex flex-col items-center gap-2 py-4">
                <Button
                  variant="outline"
                  :disabled="videoUploading"
                  @click="videoFileInput?.click()"
                >
                  <Loader2 v-if="videoUploading" class="mr-2 h-4 w-4 animate-spin" />
                  <Upload v-else class="mr-2 h-4 w-4" />
                  {{ videoUploading ? '上传中...' : '选择视频' }}
                </Button>
                <p class="text-xs text-muted-foreground">
                  支持 MP4、WebM、OGG，最大 {{ videoMaxSize }}MB
                </p>
              </div>
            </TabsContent>
            <TabsContent value="url" class="space-y-4">
              <div class="space-y-2">
                <Label>视频地址</Label>
                <Input
                  v-model="videoUrl"
                  placeholder="https:// 或 YouTube 链接"
                  @keyup.enter="addVideo"
                />
              </div>
              <div class="flex justify-end gap-2">
                <Button size="sm" variant="outline" @click="showVideoPopover = false">取消</Button>
                <Button size="sm" @click="addVideo">确定</Button>
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      <!-- 表格 -->
      <Popover v-model:open="showTablePopover">
        <PopoverTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
            <TableIcon class="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-56">
          <div class="grid gap-4">
            <div class="space-y-2">
              <h4 class="font-medium leading-none">插入表格</h4>
            </div>
            <div class="grid gap-3">
              <div class="flex items-center gap-2">
                <Label class="w-10">行数</Label>
                <Input
                  v-model.number="tableRows"
                  type="number"
                  min="1"
                  max="20"
                  class="h-8"
                  @keyup.enter="insertTable"
                />
              </div>
              <div class="flex items-center gap-2">
                <Label class="w-10">列数</Label>
                <Input
                  v-model.number="tableCols"
                  type="number"
                  min="1"
                  max="10"
                  class="h-8"
                  @keyup.enter="insertTable"
                />
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <Button size="sm" variant="outline" @click="showTablePopover = false">取消</Button>
              <Button size="sm" @click="insertTable">插入</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <!-- 表格操作 -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 px-2 text-xs"
            :disabled="!editor?.isActive('table')"
          >
            表格操作
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            :disabled="!editor?.can().addColumnBefore()"
            @click="editor?.chain().focus().addColumnBefore().run()"
          >
            左侧插入列
          </DropdownMenuItem>
          <DropdownMenuItem
            :disabled="!editor?.can().addColumnAfter()"
            @click="editor?.chain().focus().addColumnAfter().run()"
          >
            右侧插入列
          </DropdownMenuItem>
          <DropdownMenuItem
            :disabled="!editor?.can().deleteColumn()"
            @click="editor?.chain().focus().deleteColumn().run()"
          >
            删除列
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            :disabled="!editor?.can().addRowBefore()"
            @click="editor?.chain().focus().addRowBefore().run()"
          >
            上方插入行
          </DropdownMenuItem>
          <DropdownMenuItem
            :disabled="!editor?.can().addRowAfter()"
            @click="editor?.chain().focus().addRowAfter().run()"
          >
            下方插入行
          </DropdownMenuItem>
          <DropdownMenuItem
            :disabled="!editor?.can().deleteRow()"
            @click="editor?.chain().focus().deleteRow().run()"
          >
            删除行
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            :disabled="!editor?.can().mergeCells()"
            @click="editor?.chain().focus().mergeCells().run()"
          >
            合并单元格
          </DropdownMenuItem>
          <DropdownMenuItem
            :disabled="!editor?.can().splitCell()"
            @click="editor?.chain().focus().splitCell().run()"
          >
            拆分单元格
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            :disabled="!editor?.can().deleteTable()"
            class="text-destructive"
            @click="editor?.chain().focus().deleteTable().run()"
          >
            删除表格
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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

/* 表格样式 */
.ProseMirror table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0.5rem 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

:root.dark .ProseMirror table {
  border-color: #374151;
}

.ProseMirror td,
.ProseMirror th {
  min-width: 1em;
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

:root.dark .ProseMirror td,
:root.dark .ProseMirror th {
  border-color: #374151;
}

.ProseMirror th {
  font-weight: 600;
  text-align: left;
  background-color: #f3f4f6;
}

:root.dark .ProseMirror th {
  background-color: #1f2937;
}

.ProseMirror .selectedCell::after {
  z-index: 2;
  position: absolute;
  content: '';
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(59, 130, 246, 0.1);
  pointer-events: none;
}

.ProseMirror .column-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: #3b82f6;
  pointer-events: none;
}

.ProseMirror.resize-cursor {
  cursor: col-resize;
}

.ProseMirror .tableWrapper {
  overflow-x: auto;
  margin: 0.5rem 0;
}
</style>

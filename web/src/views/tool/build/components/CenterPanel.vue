<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { GripVertical, Trash2, Copy, Calendar as CalendarIcon, HelpCircle } from 'lucide-vue-next'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { PinInput, PinInputGroup, PinInputSlot } from '@/components/ui/pin-input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { FormField } from '../types'

const _props = defineProps<{
  fields: FormField[]
  selectedFieldId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', id: string | null): void
  (e: 'delete', index: number): void
  (e: 'copy', index: number): void
  (e: 'reorder', from: number, to: number): void
}>()

const draggingIndex = ref<number | null>(null)

function handleDragStart(index: number) {
  draggingIndex.value = index
}

function handleDrop(index: number) {
  if (draggingIndex.value !== null && draggingIndex.value !== index) {
    emit('reorder', draggingIndex.value, index)
  }
  draggingIndex.value = null
}

function selectField(id: string | null) {
  emit('select', id)
}

function removeField(index: number, e: Event) {
  e.stopPropagation()
  emit('delete', index)
}

function copyField(index: number, e: Event) {
  e.stopPropagation()
  emit('copy', index)
}
</script>

<template>
  <ScrollArea class="h-full">
    <div class="bg-muted/30 p-8 min-h-full" @click="selectField(null)">
      <div
        class="max-w-2xl mx-auto bg-background rounded-lg shadow-sm border min-h-[500px] p-6 space-y-4"
        @click.stop
      >
        <div class="text-center pb-4 border-b">
          <h3 class="text-lg font-medium">表单预览</h3>
          <p class="text-sm text-muted-foreground">点击组件配置属性，拖拽排序</p>
        </div>

        <div
          v-if="fields.length === 0"
          class="h-40 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg"
        >
          请从左侧添加组件
        </div>

        <div
          v-for="(field, index) in fields"
          :key="field.id"
          class="group relative p-4 border rounded-md transition-all bg-card cursor-pointer"
          :class="{
            'ring-2 ring-primary border-primary': selectedFieldId === field.id,
            'hover:border-primary': selectedFieldId !== field.id,
          }"
          draggable="true"
          @dragstart="handleDragStart(index)"
          @dragover.prevent
          @drop="handleDrop(index)"
          @click="selectField(field.id)"
        >
          <!-- Drag Handle -->
          <div
            class="absolute left-2 top-1/2 -translate-y-1/2 cursor-move opacity-0 group-hover:opacity-100 text-muted-foreground p-1 hover:text-foreground"
          >
            <GripVertical class="h-4 w-4" />
          </div>

          <!-- Actions -->
          <div
            class="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md border shadow-sm p-0.5 z-10"
            :class="{ 'opacity-100': selectedFieldId === field.id }"
          >
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7"
              title="复制"
              @click="(e: Event) => copyField(index, e)"
            >
              <Copy class="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7 text-destructive hover:text-destructive"
              title="删除"
              @click="(e: Event) => removeField(index, e)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </Button>
          </div>

          <div class="pl-6 pr-8 pointer-events-none">
            <template v-if="field.type === 'alert'">
              <Alert>
                <AlertTitle>{{ field.label }}</AlertTitle>
                <AlertDescription>{{ field.description }}</AlertDescription>
              </Alert>
            </template>

            <template v-else>
              <Label class="mb-2 flex items-center gap-2">
                {{ field.label }}
                <span v-if="field.required" class="text-destructive">*</span>
                <span v-if="field.tooltip" class="pointer-events-auto">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <HelpCircle class="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ field.tooltip }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
              </Label>

              <!-- Input -->
              <Input v-if="field.type === 'input'" :placeholder="field.placeholder" disabled />

              <!-- Textarea -->
              <Textarea
                v-else-if="field.type === 'textarea'"
                :placeholder="field.placeholder"
                disabled
              />

              <!-- Select -->
              <Select v-else-if="field.type === 'select'" disabled>
                <SelectTrigger>
                  <SelectValue :placeholder="field.placeholder || '请选择'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in field.options" :key="opt.value" :value="opt.value">{{
                    opt.label
                  }}</SelectItem>
                </SelectContent>
              </Select>

              <!-- Radio -->
              <RadioGroup v-else-if="field.type === 'radio'" disabled>
                <div
                  v-for="opt in field.options"
                  :key="opt.value"
                  class="flex items-center space-x-2"
                >
                  <RadioGroupItem :id="field.id + '-' + opt.value" :value="opt.value" />
                  <Label :for="field.id + '-' + opt.value">{{ opt.label }}</Label>
                </div>
              </RadioGroup>

              <!-- Checkbox -->
              <div v-else-if="field.type === 'checkbox'" class="flex items-center space-x-2">
                <Checkbox :id="field.id" disabled />
                <Label :for="field.id" class="mb-0">{{ field.label }}</Label>
              </div>

              <!-- Switch -->
              <div v-else-if="field.type === 'switch'" class="flex items-center space-x-2">
                <Switch :id="field.id" disabled />
                <Label :for="field.id" class="mb-0">{{ field.label }}</Label>
              </div>

              <!-- Toggle -->
              <div v-else-if="field.type === 'toggle'" class="flex items-center space-x-2">
                <Toggle disabled aria-label="toggle">{{ field.label }}</Toggle>
              </div>

              <!-- Slider -->
              <Slider
                v-else-if="field.type === 'slider'"
                :model-value="[field.min || 0]"
                :max="field.max"
                :min="field.min"
                :step="field.step"
                disabled
              />

              <!-- Date -->
              <Button
                v-else-if="field.type === 'date'"
                variant="outline"
                class="w-[240px] justify-start text-left font-normal text-muted-foreground"
                disabled
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                <span>{{ field.placeholder || '选择日期' }}</span>
              </Button>

              <!-- Combobox -->
              <Button
                v-else-if="field.type === 'combobox'"
                variant="outline"
                class="w-[240px] justify-between text-left font-normal text-muted-foreground"
                disabled
              >
                <span>{{ field.placeholder || '请选择' }}</span>
              </Button>

              <!-- Separator -->
              <Separator v-else-if="(field as any).type === 'separator'" />

              <!-- Progress -->
              <div v-else-if="(field as any).type === 'progress'" class="w-full">
                <Progress :model-value="(field as any).progress || 50" />
              </div>

              <!-- Skeleton -->
              <Skeleton
                v-else-if="(field as any).type === 'skeleton'"
                :class="
                  ((field as any).skeletonSize === 'sm'
                    ? 'h-4 w-full'
                    : (field as any).skeletonSize === 'lg'
                      ? 'h-8 w-full'
                      : 'h-6 w-full') + ' rounded-md bg-muted'
                "
              />

              <!-- Pin Input -->
              <div v-else-if="field.type === 'pin-input'">
                <PinInput :model-value="[]" placeholder="○" disabled>
                  <PinInputGroup>
                    <PinInputSlot v-for="i in field.pinCount || 4" :key="i" :index="i - 1" />
                  </PinInputGroup>
                </PinInput>
              </div>

              <!-- Toggle Group -->
              <ToggleGroup v-else-if="field.type === 'toggle-group'" type="single" disabled>
                <ToggleGroupItem v-for="opt in field.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </ToggleGroupItem>
              </ToggleGroup>

              <!-- Accordion -->
              <Accordion v-else-if="field.type === 'accordion'" type="single" collapsible>
                <AccordionItem v-for="opt in field.options" :key="opt.value" :value="opt.value">
                  <AccordionTrigger>{{ opt.label }}</AccordionTrigger>
                  <AccordionContent>内容占位</AccordionContent>
                </AccordionItem>
              </Accordion>

              <!-- Tabs -->
              <Tabs v-else-if="field.type === 'tabs'" default-value="a">
                <TabsList>
                  <TabsTrigger v-for="opt in field.options" :key="opt.value" :value="opt.value">{{
                    opt.label
                  }}</TabsTrigger>
                </TabsList>
                <TabsContent v-for="opt in field.options" :key="opt.value" :value="opt.value">
                  <div class="border rounded-md p-4">标签 {{ opt.label }} 内容占位</div>
                </TabsContent>
              </Tabs>

              <!-- Alert Dialog (placeholder) -->
              <div
                v-else-if="field.type === 'alert-dialog'"
                class="border rounded-md p-4 text-sm text-muted-foreground"
              >
                确认弹窗：{{ field.description || '确认操作提示' }}
              </div>

              <!-- Drawer (placeholder) -->
              <div
                v-else-if="field.type === 'drawer'"
                class="border rounded-md p-4 text-sm text-muted-foreground"
              >
                抽屉（{{ field.side || 'left' }}）：内容占位
              </div>

              <!-- Sheet (placeholder) -->
              <div
                v-else-if="field.type === 'sheet'"
                class="border rounded-md p-4 text-sm text-muted-foreground"
              >
                侧边弹出（{{ field.side || 'right' }}）：内容占位
              </div>

              <!-- Hover Card -->
              <div v-else-if="field.type === 'hover-card'" class="flex items-center gap-2">
                <HoverCard>
                  <HoverCardTrigger as-child>
                    <Button variant="outline" size="sm">悬浮查看</Button>
                  </HoverCardTrigger>
                  <HoverCardContent> 悬浮内容占位 </HoverCardContent>
                </HoverCard>
              </div>

              <!-- Dropdown Menu -->
              <DropdownMenu v-else-if="field.type === 'dropdown-menu'">
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" size="sm">下拉菜单</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>操作</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem v-for="opt in field.options" :key="opt.value">{{
                    opt.label
                  }}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <!-- Menubar -->
              <Menubar v-else-if="field.type === 'menubar'">
                <MenubarMenu v-for="opt in field.options" :key="opt.value">
                  <MenubarTrigger>{{ opt.label }}</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>子项 1</MenubarItem>
                    <MenubarItem>子项 2</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>

              <!-- Navigation Menu -->
              <NavigationMenu v-else-if="field.type === 'navigation-menu'">
                <NavigationMenuList>
                  <NavigationMenuItem v-for="opt in field.options" :key="opt.value">
                    <NavigationMenuTrigger>{{ opt.label }}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div class="p-4">内容占位</div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              <!-- Context Menu -->
              <ContextMenu v-else-if="field.type === 'context-menu'">
                <ContextMenuTrigger>
                  <div class="border rounded-md p-4 text-sm text-muted-foreground">
                    右键打开菜单
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem v-for="opt in field.options" :key="opt.value">{{
                    opt.label
                  }}</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              <!-- Breadcrumb -->
              <Breadcrumb v-else-if="field.type === 'breadcrumb'">
                <BreadcrumbList>
                  <template v-for="(opt, idx) in field.options" :key="opt.value">
                    <BreadcrumbItem v-if="idx < (field.options?.length || 0) - 1">
                      <BreadcrumbLink>{{ opt.label }}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator v-if="idx < (field.options?.length || 0) - 1" />
                    <BreadcrumbItem v-else>
                      <BreadcrumbPage>{{ opt.label }}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </template>
                </BreadcrumbList>
              </Breadcrumb>

              <!-- Pagination -->
              <Pagination
                v-else-if="field.type === 'pagination'"
                :items-per-page="10"
                :total="100"
                :page="1"
              >
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink :value="1" :is-active="true" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink :value="2" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink :value="10" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <!-- Collapsible -->
              <Collapsible v-else-if="field.type === 'collapsible'">
                <CollapsibleTrigger as-child>
                  <Button variant="outline" size="sm">{{
                    field.options?.[0]?.label || '展开/收起'
                  }}</Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div class="border rounded-md p-4 mt-2">折叠内容占位</div>
                </CollapsibleContent>
              </Collapsible>

              <!-- Carousel -->
              <Carousel v-else-if="field.type === 'carousel'" class="w-full max-w-sm">
                <CarouselContent>
                  <CarouselItem v-for="opt in field.options" :key="opt.value">
                    <div class="h-32 rounded-md bg-muted flex items-center justify-center">
                      {{ opt.label }}
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>

              <!-- Aspect Ratio -->
              <AspectRatio
                v-else-if="field.type === 'aspect-ratio'"
                :ratio="field.ratio || 1.7778"
                class="bg-muted rounded-md"
              >
                <div
                  class="w-full h-full flex items-center justify-center text-sm text-muted-foreground"
                >
                  比例 {{ (field.ratio || 1.7778).toFixed(2) }}
                </div>
              </AspectRatio>

              <!-- Table -->
              <Table v-else-if="field.type === 'table'">
                <TableHeader>
                  <TableRow>
                    <TableHead v-for="col in field.options" :key="col.value">{{
                      col.label
                    }}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell v-for="col in field.options" :key="col.value">示例</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </template>
          </div>
        </div>
      </div>
    </div>
  </ScrollArea>
</template>

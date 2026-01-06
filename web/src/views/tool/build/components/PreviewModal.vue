<script setup lang="ts">
import { ref, watch } from 'vue'
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
import { Calendar as CalendarIcon, HelpCircle } from 'lucide-vue-next'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { parseDate } from '@internationalized/date'
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
import type { FormField } from '../types'

const props = defineProps<{
  open: boolean
  fields: FormField[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const previewForm = ref<Record<string, any>>({})

watch(
  () => props.open,
  (val) => {
    if (val) {
      // Initialize preview form data
      const formData: Record<string, any> = {}
      props.fields.forEach((field) => {
        if (field.type === 'checkbox' || field.type === 'switch') {
          formData[field.key] = false
        } else if (field.type === 'slider') {
          formData[field.key] = [field.min || 0]
        } else if (field.type === 'pin-input') {
          formData[field.key] = []
        } else {
          formData[field.key] = ''
        }
      })
      previewForm.value = formData
    }
  },
)

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>表单预览</DialogTitle>
        <DialogDescription> 实际运行效果预览 (无校验逻辑) </DialogDescription>
      </DialogHeader>
      <div class="py-4 space-y-6 max-h-[60vh] overflow-y-auto px-2">
        <div v-for="field in fields" :key="field.id" class="space-y-2">
          <template v-if="field.type === 'alert'">
            <Alert>
              <AlertTitle>{{ field.label }}</AlertTitle>
              <AlertDescription>{{ field.description }}</AlertDescription>
            </Alert>
          </template>
          <template v-else-if="field.type === 'checkbox' || field.type === 'switch'">
            <div class="flex items-center space-x-2">
              <component
                :is="field.type === 'switch' ? Switch : Checkbox"
                :id="`preview-${field.id}`"
                v-model:checked="previewForm[field.key]"
              />
              <Label :for="`preview-${field.id}`">{{ field.label }}</Label>
            </div>
          </template>
          <template v-else>
            <Label class="flex items-center gap-2" :class="{ 'text-destructive': false }">
              {{ field.label }}
              <span v-if="field.required" class="text-destructive">*</span>
              <TooltipProvider v-if="field.tooltip">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <HelpCircle class="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{{ field.tooltip }}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>

            <Input
              v-if="field.type === 'input'"
              v-model="previewForm[field.key]"
              :placeholder="field.placeholder"
            />
            <Textarea
              v-else-if="field.type === 'textarea'"
              v-model="previewForm[field.key]"
              :placeholder="field.placeholder"
            />

            <Select v-else-if="field.type === 'select'" v-model="previewForm[field.key]">
              <SelectTrigger>
                <SelectValue :placeholder="field.placeholder || '请选择'" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in field.options" :key="opt.value" :value="opt.value">{{
                  opt.label
                }}</SelectItem>
              </SelectContent>
            </Select>

            <RadioGroup v-else-if="field.type === 'radio'" v-model="previewForm[field.key]">
              <div
                v-for="opt in field.options"
                :key="opt.value"
                class="flex items-center space-x-2"
              >
                <RadioGroupItem :id="`preview-${field.id}-${opt.value}`" :value="opt.value" />
                <Label :for="`preview-${field.id}-${opt.value}`">{{ opt.label }}</Label>
              </div>
            </RadioGroup>

            <div v-else-if="field.type === 'toggle'" class="flex items-center space-x-2">
              <Toggle
                :pressed="previewForm[field.key]"
                aria-label="toggle"
                @update:pressed="(v: boolean) => (previewForm[field.key] = v)"
              />
              <Label>{{ field.label }}</Label>
            </div>

            <Slider
              v-else-if="field.type === 'slider'"
              v-model="previewForm[field.key]"
              :max="field.max"
              :min="field.min"
              :step="field.step"
            />

            <Popover v-else-if="field.type === 'date'">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  :class="
                    cn(
                      'w-[240px] justify-start text-left font-normal',
                      !previewForm[field.key] && 'text-muted-foreground',
                    )
                  "
                >
                  <CalendarIcon class="mr-2 h-4 w-4" />
                  <span>{{
                    previewForm[field.key]
                      ? previewForm[field.key]
                      : field.placeholder || '选择日期'
                  }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0">
                <Calendar
                  mode="single"
                  :model-value="
                    previewForm[field.key] ? parseDate(previewForm[field.key]) : undefined
                  "
                  initial-focus
                  @update:model-value="(date) => (previewForm[field.key] = date?.toString())"
                />
              </PopoverContent>
            </Popover>

            <Accordion v-else-if="field.type === 'accordion'" type="single" collapsible>
              <AccordionItem v-for="opt in field.options" :key="opt.value" :value="opt.value">
                <AccordionTrigger>{{ opt.label }}</AccordionTrigger>
                <AccordionContent>内容占位</AccordionContent>
              </AccordionItem>
            </Accordion>

            <Tabs
              v-else-if="field.type === 'tabs'"
              :default-value="field.options?.[0]?.value || 'a'"
            >
              <TabsList>
                <TabsTrigger v-for="opt in field.options" :key="opt.value" :value="opt.value">{{
                  opt.label
                }}</TabsTrigger>
              </TabsList>
              <TabsContent v-for="opt in field.options" :key="opt.value" :value="opt.value">
                <div class="border rounded-md p-4">标签 {{ opt.label }} 内容占位</div>
              </TabsContent>
            </Tabs>

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

            <Menubar v-else-if="field.type === 'menubar'">
              <MenubarMenu v-for="opt in field.options" :key="opt.value">
                <MenubarTrigger>{{ opt.label }}</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>子项 1</MenubarItem>
                  <MenubarItem>子项 2</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>

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

            <ContextMenu v-else-if="field.type === 'context-menu'">
              <ContextMenuTrigger>
                <div class="border rounded-md p-4 text-sm text-muted-foreground">右键打开菜单</div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem v-for="opt in field.options" :key="opt.value">{{
                  opt.label
                }}</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

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

            <Popover v-else-if="field.type === 'combobox'">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  :class="
                    cn(
                      'w-[240px] justify-between',
                      !previewForm[field.key] && 'text-muted-foreground',
                    )
                  "
                >
                  <span>{{
                    field.options?.find((o) => o.value === previewForm[field.key])?.label ||
                    field.placeholder ||
                    '请选择'
                  }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[240px] p-0">
                <Command v-model="previewForm[field.key]">
                  <CommandInput placeholder="搜索选项..." />
                  <CommandEmpty>未找到</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                        v-for="opt in field.options"
                        :key="opt.value"
                        :value="opt.value"
                        @select="() => (previewForm[field.key] = opt.value)"
                        >{{ opt.label }}</CommandItem
                      >
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <div v-else-if="field.type === 'pin-input'">
              <PinInput v-model="previewForm[field.key]" placeholder="○">
                <PinInputGroup>
                  <PinInputSlot v-for="i in field.pinCount || 4" :key="i" :index="i - 1" />
                </PinInputGroup>
              </PinInput>
            </div>

            <ToggleGroup
              v-else-if="field.type === 'toggle-group'"
              v-model="previewForm[field.key]"
              type="single"
            >
              <ToggleGroupItem v-for="opt in field.options" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </ToggleGroupItem>
            </ToggleGroup>

            <Separator v-else-if="(field as any).type === 'separator'" />

            <div v-else-if="(field as any).type === 'progress'" class="w-full">
              <Progress :model-value="(field as any).progress || 50" />
            </div>

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
          </template>
        </div>
      </div>
      <DialogFooter>
        <Button @click="close">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

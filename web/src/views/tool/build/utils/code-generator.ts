import type { FormField } from '../types'

export function generateVueCode(fields: FormField[]): string {
  const hasDate = fields.some((f) => f.type === 'date')
  const hasPinInput = fields.some((f) => f.type === 'pin-input')
  const hasToggleGroup = fields.some((f) => f.type === 'toggle-group')
  const hasToggle = fields.some((f) => f.type === 'toggle')
  const hasCombobox = fields.some((f) => f.type === 'combobox')
  const hasAccordion = fields.some((f) => f.type === 'accordion')
  const hasTabs = fields.some((f) => f.type === 'tabs')
  const hasAlertDialog = fields.some((f) => f.type === 'alert-dialog')
  const hasDrawer = fields.some((f) => f.type === 'drawer')
  const hasSheet = fields.some((f) => f.type === 'sheet')
  const hasHoverCard = fields.some((f) => f.type === 'hover-card')
  const hasDropdownMenu = fields.some((f) => f.type === 'dropdown-menu')
  const hasMenubar = fields.some((f) => f.type === 'menubar')
  const hasNavigationMenu = fields.some((f) => f.type === 'navigation-menu')
  const hasContextMenu = fields.some((f) => f.type === 'context-menu')
  const hasBreadcrumb = fields.some((f) => f.type === 'breadcrumb')
  const hasPagination = fields.some((f) => f.type === 'pagination')
  const hasCollapsible = fields.some((f) => f.type === 'collapsible')
  const hasCarousel = fields.some((f) => f.type === 'carousel')
  const hasAspectRatio = fields.some((f) => f.type === 'aspect-ratio')
  const hasTable = fields.some((f) => f.type === 'table')
  const hasSeparator = fields.some((f) => (f as any).type === 'separator')
  const hasProgress = fields.some((f) => (f as any).type === 'progress')
  const hasSkeleton = fields.some((f) => (f as any).type === 'skeleton')
  const hasTooltip = fields.some((f) => !!f.tooltip)

  const scriptContent = `
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { cn } from '@/lib/utils'
${
  hasDate
    ? `import { DateFormatter, type DateValue, getLocalTimeZone, parseDate } from '@internationalized/date'
import { Calendar as CalendarIcon } from 'lucide-vue-next'`
    : ''
}

import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
${
  hasPinInput
    ? `import {
  PinInput,
  PinInputGroup,
  PinInputSeparator,
  PinInputSlot,
} from '@/components/ui/pin-input'`
    : ''
}
${hasToggleGroup ? `import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'` : ''}
 ${hasToggle ? `import { Toggle } from '@/components/ui/toggle'` : ''}
${
  hasDate
    ? `import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'`
    : ''
}
${
  hasTooltip
    ? `import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-vue-next'`
    : ''
}
 ${hasCombobox ? `import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'` : ''}
 ${hasSeparator ? `import { Separator } from '@/components/ui/separator'` : ''}
 ${hasProgress ? `import { Progress } from '@/components/ui/progress'` : ''}
 ${hasSkeleton ? `import { Skeleton } from '@/components/ui/skeleton'` : ''}
 ${hasAccordion ? `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'` : ''}
 ${hasTabs ? `import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'` : ''}
 ${hasAlertDialog ? `import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'` : ''}
 ${hasDrawer ? `import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer'` : ''}
 ${hasSheet ? `import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'` : ''}
 ${hasHoverCard ? `import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'` : ''}
 ${hasDropdownMenu ? `import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'` : ''}
 ${hasMenubar ? `import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from '@/components/ui/menubar'` : ''}
 ${hasNavigationMenu ? `import { NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'` : ''}
 ${hasContextMenu ? `import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'` : ''}
 ${hasBreadcrumb ? `import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'` : ''}
 ${hasPagination ? `import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'` : ''}
 ${hasCollapsible ? `import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'` : ''}
 ${hasCarousel ? `import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'` : ''}
 ${hasAspectRatio ? `import { AspectRatio } from '@/components/ui/aspect-ratio'` : ''}
 ${hasTable ? `import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'` : ''}
import { toast } from '@/components/ui/toast/use-toast'

${hasDate ? `const df = new DateFormatter('zh-CN', { dateStyle: 'long' })` : ''}

const formSchema = toTypedSchema(z.object({
${fields
  .filter((f) => !(['alert', 'separator', 'progress', 'skeleton'] as any).includes((f as any).type))
  .map((f) => {
    let schema = `  ${f.key}: z`
    if (f.type === 'checkbox' || f.type === 'switch') {
      schema += '.boolean()'
    } else if (f.type === 'toggle') {
      schema += '.boolean()'
    } else if (f.type === 'slider') {
      schema += '.array(z.number())'
    } else if (f.type === 'date') {
      schema += '.string().optional()'
    } else if (f.type === 'pin-input') {
      schema += '.array(z.string())'
    } else {
      schema += '.string()'
    }

    if (f.required) {
      if (
        !['checkbox', 'switch', 'toggle', 'slider', 'date', 'alert', 'pin-input'].includes(f.type)
      ) {
        schema += `.min(1, { message: '${f.label}不能为空' })`
      } else if (f.type === 'pin-input') {
        schema += `.min(${f.pinCount || 4}, { message: '请输入完整验证码' })`
      }
    } else {
      schema += '.optional()'
    }
    return schema
  })
  .join(',\n')}
}))

const form = useForm({
  validationSchema: formSchema,
})

const onSubmit = form.handleSubmit((values) => {
  toast({
    title: '提交成功',
    description: JSON.stringify(values, null, 2),
  })
})
</script>
`

  const templateContent = `
<template>
  <form @submit="onSubmit" class="space-y-6">
${fields
  .map((f) => {
    let componentCode = ''

    if (f.type === 'input') {
      componentCode = `<Input v-bind="componentField" placeholder="${f.placeholder}" />`
    } else if (f.type === 'textarea') {
      componentCode = `<Textarea v-bind="componentField" placeholder="${f.placeholder}" class="resize-none" />`
    } else if (f.type === 'select') {
      componentCode = `
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="${f.placeholder || '请选择'}" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  ${f.options?.map((o) => `<SelectItem value="${o.value}">${o.label}</SelectItem>`).join('\n                  ')}
                </SelectContent>
              </Select>`
    } else if (f.type === 'radio') {
      componentCode = `
              <RadioGroup
                v-bind="componentField"
                class="flex flex-col space-y-1"
              >
                ${f.options
                  ?.map(
                    (o) => `
                <FormItem class="flex items-center space-y-0 gap-3">
                  <FormControl>
                    <RadioGroupItem value="${o.value}" />
                  </FormControl>
                  <FormLabel class="font-normal">
                    ${o.label}
                  </FormLabel>
                </FormItem>`
                  )
                  .join('')}
              </RadioGroup>`
    } else if (f.type === 'combobox') {
      componentCode = `
              <Popover>
                <PopoverTrigger as-child>
                  <FormControl>
                    <Button
                      variant="outline"
                      :class="cn('w-[240px] justify-between', !componentField.value && 'text-muted-foreground')"
                    >
                      <span>{{ (${JSON.stringify(f.options || [])}).find(o => o.value === componentField.value)?.label || '${f.placeholder || '请选择'}' }}</span>
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent class="w-[240px] p-0">
                  <Command v-model="componentField.value">
                    <CommandInput placeholder="搜索选项..." />
                    <CommandEmpty>未找到</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        ${f.options?.map((o) => `<CommandItem value="${o.value}" @select="() => componentField.onChange('${o.value}')">${o.label}</CommandItem>`).join('\n                        ')}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>`
    } else if (f.type === 'checkbox') {
      componentCode = `
              <div class="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox :model-value="componentField.value" @update:model-value="componentField.onChange" />
                </FormControl>
                <div class="space-y-1 leading-none">
                  <FormLabel>
                    ${f.label}
                  </FormLabel>
                  ${f.tooltip ? `<div class="text-sm text-muted-foreground">${f.tooltip}</div>` : ''}
                </div>
              </div>`
    } else if (f.type === 'switch') {
      componentCode = `
              <div class="flex flex-row items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5">
                  <FormLabel class="text-base">
                    ${f.label}
                  </FormLabel>
                  ${f.tooltip ? `<div class="text-sm text-muted-foreground">${f.tooltip}</div>` : ''}
                </div>
                <FormControl>
                  <Switch
                    :checked="componentField.value"
                    @update:checked="componentField.onChange"
                  />
                </FormControl>
              </div>`
    } else if (f.type === 'toggle') {
      componentCode = `
              <div class="flex flex-row items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5">
                  <FormLabel class="text-base">
                    ${f.label}
                  </FormLabel>
                  ${f.tooltip ? `<div class="text-sm text-muted-foreground">${f.tooltip}</div>` : ''}
                </div>
                <FormControl>
                  <Toggle :pressed="componentField.value" @update:pressed="componentField.onChange" />
                </FormControl>
              </div>`
    } else if (f.type === 'slider') {
      componentCode = `
              <Slider
                v-bind="componentField"
                :model-value="componentField.value || [${f.min || 0}]"
                @update:model-value="componentField.onChange"
                :max="${f.max || 100}"
                :min="${f.min || 0}"
                :step="${f.step || 1}"
              />`
    } else if (f.type === 'date') {
      componentCode = `
              <Popover>
                <PopoverTrigger as-child>
                  <FormControl>
                    <Button
                      variant="outline"
                      :class="cn(
                        'w-[240px] pl-3 text-left font-normal',
                        !componentField.value && 'text-muted-foreground',
                      )"
                    >
                      <span>{{ componentField.value ? df.format(new Date(componentField.value)) : "${f.placeholder || '选择日期'}" }}</span>
                      <CalendarIcon class="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    :model-value="componentField.value ? parseDate(componentField.value) : undefined"
                    @update:model-value="(date) => componentField.onChange(date?.toString())"
                    initial-focus
                  />
                </PopoverContent>
              </Popover>`
    } else if (f.type === 'pin-input') {
      componentCode = `
              <PinInput
                id="${f.key}"
                v-bind="componentField"
                placeholder="○"
                @update:model-value="componentField.onChange"
              >
                <PinInputGroup>
                  ${Array.from({ length: f.pinCount || 4 })
                    .map((_, i) => `<PinInputSlot :index="${i}" />`)
                    .join('\n                  ')}
                </PinInputGroup>
              </PinInput>`
    } else if (f.type === 'toggle-group') {
      componentCode = `
              <ToggleGroup type="single" v-bind="componentField" @update:model-value="componentField.onChange">
                ${f.options?.map((o) => `<ToggleGroupItem value="${o.value}">${o.label}</ToggleGroupItem>`).join('\n                ')}
              </ToggleGroup>`
    } else if (f.type === 'alert') {
      return `    <Alert>
      <AlertTitle>${f.label}</AlertTitle>
      <AlertDescription>
        ${f.description}
      </AlertDescription>
    </Alert>`
    } else if ((f as any).type === 'separator') {
      return `    <Separator />`
    } else if ((f as any).type === 'progress') {
      return `    <Progress :model-value=${(f as any).progress || 50} />`
    } else if ((f as any).type === 'skeleton') {
      return `    <Skeleton class="${(f as any).skeletonSize === 'sm' ? 'h-4 w-full' : (f as any).skeletonSize === 'lg' ? 'h-8 w-full' : 'h-6 w-full'} rounded-md bg-muted" />`
    } else if (f.type === 'accordion') {
      return `    <Accordion type="single" collapsible>
      ${f.options
        ?.map(
          (o) => `
      <AccordionItem value="${o.value}">
        <AccordionTrigger>${o.label}</AccordionTrigger>
        <AccordionContent>内容占位</AccordionContent>
      </AccordionItem>`
        )
        .join('\n      ')}
    </Accordion>`
    } else if (f.type === 'tabs') {
      return `    <Tabs default-value="${f.options?.[0]?.value || 'a'}">
      <TabsList>
        ${f.options?.map((o) => `<TabsTrigger value="${o.value}">${o.label}</TabsTrigger>`).join('\n        ')}
      </TabsList>
      ${f.options?.map((o) => `<TabsContent value="${o.value}"><div class="border rounded-md p-4">标签 ${o.label} 内容占位</div></TabsContent>`).join('\n      ')}
    </Tabs>`
    } else if (f.type === 'alert-dialog') {
      return `    <AlertDialog>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>${f.label}</AlertDialogTitle>
          <AlertDialogDescription>${f.description || ''}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>`
    } else if (f.type === 'drawer') {
      return `    <Drawer>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>${f.label}</DrawerTitle>
          <DrawerDescription>内容占位</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter />
      </DrawerContent>
    </Drawer>`
    } else if (f.type === 'sheet') {
      return `    <Sheet>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>${f.label}</SheetTitle>
          <SheetDescription>内容占位</SheetDescription>
        </SheetHeader>
        <SheetFooter />
      </SheetContent>
    </Sheet>`
    } else if (f.type === 'hover-card') {
      return `    <HoverCard>
      <HoverCardTrigger as-child>
        <Button variant="outline" size="sm">悬浮查看</Button>
      </HoverCardTrigger>
      <HoverCardContent>悬浮内容占位</HoverCardContent>
    </HoverCard>`
    } else if (f.type === 'dropdown-menu') {
      return `    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="sm">下拉菜单</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>操作</DropdownMenuLabel>
        <DropdownMenuSeparator />
        ${f.options?.map((o) => `<DropdownMenuItem>${o.label}</DropdownMenuItem>`).join('\n        ')}
      </DropdownMenuContent>
    </DropdownMenu>`
    } else if (f.type === 'menubar') {
      return `    <Menubar>
      ${f.options
        ?.map(
          (o) => `
      <MenubarMenu>
        <MenubarTrigger>${o.label}</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>子项 1</MenubarItem>
          <MenubarItem>子项 2</MenubarItem>
        </MenubarContent>
      </MenubarMenu>`
        )
        .join('\n      ')}
    </Menubar>`
    } else if (f.type === 'navigation-menu') {
      return `    <NavigationMenu>
      <NavigationMenuList>
        ${f.options
          ?.map(
            (o) => `
        <NavigationMenuItem>
          <NavigationMenuTrigger>${o.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div class="p-4">内容占位</div>
          </NavigationMenuContent>
        </NavigationMenuItem>`
          )
          .join('\n        ')}
      </NavigationMenuList>
    </NavigationMenu>`
    } else if (f.type === 'context-menu') {
      return `    <ContextMenu>
      <ContextMenuTrigger>
        <div class="border rounded-md p-4 text-sm text-muted-foreground">右键打开菜单</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        ${f.options?.map((o) => `<ContextMenuItem>${o.label}</ContextMenuItem>`).join('\n        ')}
      </ContextMenuContent>
    </ContextMenu>`
    } else if (f.type === 'breadcrumb') {
      return `    <Breadcrumb>
      <BreadcrumbList>
        ${f.options
          ?.map((o, idx) =>
            idx < (f.options?.length || 0) - 1
              ? `<BreadcrumbItem><BreadcrumbLink>${o.label}</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator />`
              : `<BreadcrumbItem><BreadcrumbPage>${o.label}</BreadcrumbPage></BreadcrumbItem>`
          )
          .join('')}
      </BreadcrumbList>
    </Breadcrumb>`
    } else if (f.type === 'pagination') {
      return `    <Pagination :items-per-page="10" :total="100" :page="1">
      <PaginationContent>
        <PaginationItem><PaginationPrevious /></PaginationItem>
        <PaginationItem><PaginationLink :value="1" :is-active="true" /></PaginationItem>
        <PaginationItem><PaginationLink :value="2" /></PaginationItem>
        <PaginationItem><PaginationEllipsis /></PaginationItem>
        <PaginationItem><PaginationLink :value="10" /></PaginationItem>
        <PaginationItem><PaginationNext /></PaginationItem>
      </PaginationContent>
    </Pagination>`
    } else if (f.type === 'collapsible') {
      return `    <Collapsible>
      <CollapsibleTrigger as-child>
        <Button variant="outline" size="sm">${f.options?.[0]?.label || '展开/收起'}</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="border rounded-md p-4 mt-2">折叠内容占位</div>
      </CollapsibleContent>
    </Collapsible>`
    } else if (f.type === 'carousel') {
      return `    <Carousel class="w-full max-w-sm">
      <CarouselContent>
        ${f.options?.map((o) => `<CarouselItem><div class="h-32 rounded-md bg-muted flex items-center justify-center">${o.label}</div></CarouselItem>`).join('\n        ')}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>`
    } else if (f.type === 'aspect-ratio') {
      return `    <AspectRatio ratio=${(f as any).ratio || 1.7778} class="bg-muted rounded-md">
      <div class="w-full h-full flex items-center justify-center text-sm text-muted-foreground">比例 ${(f as any).ratio || 1.7778}</div>
    </AspectRatio>`
    } else if (f.type === 'table') {
      return `    <Table>
      <TableHeader>
        <TableRow>
          ${f.options?.map((col) => `<TableHead>${col.label}</TableHead>`).join('\n          ')}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          ${f.options?.map(() => `<TableCell>示例</TableCell>`).join('\n          ')}
        </TableRow>
      </TableBody>
    </Table>`
    }

    if (f.type === 'checkbox' || f.type === 'switch') {
      return `    <FormField v-slot="{ componentField, value }" name="${f.key}">
      <FormItem>
        ${componentCode}
      </FormItem>
    </FormField>`
    }

    const labelCode = `<FormLabel class="flex items-center gap-2">
          ${f.label}${f.required ? ' <span class="text-destructive">*</span>' : ''}
          ${
            f.tooltip
              ? `<TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <HelpCircle class="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>${f.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>`
              : ''
          }
        </FormLabel>`

    return `    <FormField v-slot="{ componentField }" name="${f.key}">
      <FormItem>
        ${labelCode}
        <FormControl>
          ${componentCode}
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>`
  })
  .join('\n\n')}

    <Button type="submit">提交</Button>
  </form>
</template>
`

  return scriptContent + templateContent
}

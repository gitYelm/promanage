<script setup lang="ts">
import { ref, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, X } from 'lucide-vue-next'
import * as icons from 'lucide-vue-next'

// Props
const props = defineProps<{
  modelValue?: string
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// State
const open = ref(false)
const searchQuery = ref('')

// 常用图标列表 (按使用频率排序)
const commonIcons = [
  'Home',
  'User',
  'Users',
  'Settings',
  'Menu',
  'Search',
  'Plus',
  'Edit',
  'Trash2',
  'Eye',
  'EyeOff',
  'Lock',
  'Unlock',
  'Key',
  'Shield',
  'ShieldCheck',
  'File',
  'FileText',
  'Folder',
  'FolderOpen',
  'Database',
  'Server',
  'Bell',
  'Mail',
  'MessageSquare',
  'Send',
  'Inbox',
  'Calendar',
  'Clock',
  'Timer',
  'AlarmClock',
  'CheckCircle',
  'XCircle',
  'AlertCircle',
  'Info',
  'HelpCircle',
  'ChevronRight',
  'ChevronDown',
  'ChevronUp',
  'ChevronLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowUp',
  'ArrowDown',
  'LogIn',
  'LogOut',
  'Power',
  'RefreshCw',
  'RotateCw',
  'Download',
  'Upload',
  'Share',
  'Link',
  'ExternalLink',
  'Image',
  'Camera',
  'Video',
  'Music',
  'Mic',
  'Heart',
  'Star',
  'Bookmark',
  'Flag',
  'Tag',
  'Tags',
  'Map',
  'MapPin',
  'Navigation',
  'Compass',
  'Globe',
  'Phone',
  'Smartphone',
  'Tablet',
  'Monitor',
  'Laptop',
  'Wifi',
  'Bluetooth',
  'Battery',
  'Zap',
  'Sun',
  'Moon',
  'Cloud',
  'CloudUpload',
  'CloudDownload',
  'CreditCard',
  'DollarSign',
  'ShoppingCart',
  'ShoppingBag',
  'Package',
  'Truck',
  'Car',
  'Plane',
  'Train',
  'Ship',
  'Building',
  'Building2',
  'Store',
  'Warehouse',
  'Factory',
  'Briefcase',
  'GraduationCap',
  'Award',
  'Trophy',
  'Medal',
  'Activity',
  'BarChart',
  'BarChart2',
  'PieChart',
  'TrendingUp',
  'TrendingDown',
  'List',
  'ListOrdered',
  'Grid',
  'Layout',
  'LayoutGrid',
  'LayoutDashboard',
  'Table',
  'Columns',
  'Rows',
  'Sidebar',
  'Code',
  'Terminal',
  'Command',
  'Hash',
  'AtSign',
  'Clipboard',
  'ClipboardList',
  'ClipboardCheck',
  'Filter',
  'SlidersHorizontal',
  'Sliders',
  'Maximize',
  'Minimize',
  'Maximize2',
  'Minimize2',
  'Expand',
  'Shrink',
  'Copy',
  'Scissors',
  'Paperclip',
  'Pin',
  'PinOff',
  'Save',
  'Printer',
  'Archive',
  'ArchiveRestore',
  'Play',
  'Pause',
  'Stop',
  'SkipBack',
  'SkipForward',
  'FastForward',
  'Rewind',
  'Volume',
  'Volume1',
  'Volume2',
  'VolumeX',
  'Headphones',
  'Speaker',
  'Radio',
  'Cpu',
  'HardDrive',
  'MemoryStick',
  'Usb',
  'Network',
  'Rss',
  'Podcast',
  'Cast',
  'QrCode',
  'Barcode',
  'Scan',
  'ScanLine',
  'Fingerprint',
  'UserCheck',
  'UserPlus',
  'UserMinus',
  'UserX',
  'Contact',
  'Contact2',
  'BadgeCheck',
  'BadgeAlert',
  'BadgeInfo',
  'CircleUser',
  'CircleDot',
  'Circle',
  'Square',
  'Triangle',
  'Hexagon',
  'Octagon',
  'Pentagon',
  'Smile',
  'Frown',
  'Meh',
  'Angry',
  'Laugh',
  'ThumbsUp',
  'ThumbsDown',
  'Hand',
  'Handshake',
  'Gift',
  'Cake',
  'PartyPopper',
  'Sparkles',
  'Flame',
  'Lightbulb',
  'Lamp',
  'LampDesk',
  'Book',
  'BookOpen',
  'BookMarked',
  'Library',
  'Newspaper',
  'Pen',
  'Pencil',
  'PenTool',
  'Highlighter',
  'Eraser',
  'Ruler',
  'Palette',
  'Paintbrush',
  'Pipette',
  'Crop',
  'Move',
  'Grab',
  'Hand',
  'ZoomIn',
  'ZoomOut',
  'Focus',
  'Layers',
  'Layers2',
  'Layers3',
  'Box',
  'Boxes',
  'Cube',
  'Cylinder',
  'Shapes',
  'Component',
  'Puzzle',
  'Wrench',
  'Hammer',
  'Screwdriver',
  'Nut',
  'Cog',
  'Settings2',
  'Gauge',
  'Thermometer',
  'Droplet',
  'Wind',
  'Snowflake',
  'Umbrella',
  'Tree',
  'Flower',
  'Leaf',
  'Sprout',
  'Bug',
  'Skull',
  'Ghost',
  'Bot',
  'Rocket',
  'Satellite',
  'Orbit',
  'Anchor',
  'Compass',
  'LifeBuoy',
  'Tent',
  'Mountain',
  'Waves',
  'Coffee',
  'Wine',
  'Beer',
  'Utensils',
  'ChefHat',
  'Pill',
  'Stethoscope',
  'Syringe',
  'Bandage',
  'HeartPulse',
  'Dumbbell',
  'Bike',
  'Footprints',
  'Gamepad',
  'Gamepad2',
  'Dice1',
  'Dice2',
  'Dice3',
  'Dice4',
  'Dice5',
  'Dice6',
  'Music2',
  'Music3',
  'Music4',
  'Tv',
  'Tv2',
  'MonitorPlay',
  'Clapperboard',
  'Megaphone',
  'Siren',
  'Bell',
  'BellRing',
  'BellOff',
]

// 过滤后的图标列表
const filteredIcons = computed(() => {
  if (!searchQuery.value) {
    return commonIcons
  }
  const query = searchQuery.value.toLowerCase()
  return commonIcons.filter((name) => name.toLowerCase().includes(query))
})

// 获取图标组件
function getIconComponent(name: string) {
  return (icons as any)[name]
}

// 选择图标
function selectIcon(name: string) {
  // 转换为 kebab-case (如 UserCheck -> user-check)
  const kebabName = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  emit('update:modelValue', kebabName)
  open.value = false
  searchQuery.value = ''
}

// 清除选择
function clearIcon() {
  emit('update:modelValue', '')
}

// 将 kebab-case 转换为 PascalCase 用于显示
function toPascalCase(str: string): string {
  if (!str) return ''
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// 获取当前选中图标的组件
const selectedIconComponent = computed(() => {
  if (!props.modelValue) return null
  const pascalName = toPascalCase(props.modelValue)
  return getIconComponent(pascalName)
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-full justify-between"
      >
        <div class="flex items-center gap-2">
          <component :is="selectedIconComponent" v-if="selectedIconComponent" class="h-4 w-4" />
          <span v-if="modelValue">{{ modelValue }}</span>
          <span v-else class="text-muted-foreground">选择图标</span>
        </div>
        <div class="flex items-center gap-1">
          <X
            v-if="modelValue"
            class="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
            @click.stop="clearIcon"
          />
        </div>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[320px] p-0" align="start">
      <div class="p-2 border-b">
        <div class="relative">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="searchQuery" placeholder="搜索图标..." class="pl-8" />
        </div>
      </div>
      <ScrollArea class="h-[280px]">
        <div class="grid grid-cols-8 gap-1 p-2">
          <Button
            v-for="iconName in filteredIcons"
            :key="iconName"
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            :class="{
              'bg-primary/10 text-primary':
                modelValue === iconName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
            }"
            :title="iconName"
            @click="selectIcon(iconName)"
          >
            <component :is="getIconComponent(iconName)" class="h-4 w-4" />
          </Button>
        </div>
        <div
          v-if="filteredIcons.length === 0"
          class="p-4 text-center text-sm text-muted-foreground"
        >
          未找到匹配的图标
        </div>
      </ScrollArea>
      <div class="p-2 border-t text-xs text-muted-foreground text-center">
        共 {{ filteredIcons.length }} 个图标
      </div>
    </PopoverContent>
  </Popover>
</template>

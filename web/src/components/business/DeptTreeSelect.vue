<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown, Search, X } from 'lucide-vue-next'
import type { SysDept } from '@/api/system/types'

interface Props {
  modelValue?: string
  depts: SysDept[]
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择部门',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const open = ref(false)
const searchText = ref('')

// 扁平化部门树并保留层级信息
const flattenDepts = (
  depts: SysDept[],
  level = 0,
  prefix = ''
): Array<{ dept: SysDept; level: number; label: string }> => {
  const result: Array<{ dept: SysDept; level: number; label: string }> = []
  for (const dept of depts) {
    const label = prefix + dept.deptName
    result.push({ dept, level, label })
    if (dept.children && dept.children.length > 0) {
      result.push(...flattenDepts(dept.children, level + 1, prefix + '  '))
    }
  }
  return result
}

const flatDepts = computed(() => flattenDepts(props.depts))

// 搜索过滤
const filteredDepts = computed(() => {
  if (!searchText.value) return flatDepts.value
  const search = searchText.value.toLowerCase()
  return flatDepts.value.filter((item) => item.dept.deptName.toLowerCase().includes(search))
})

// 当前选中的部门
const selectedDept = computed(() => {
  if (!props.modelValue) return null
  return flatDepts.value.find((item) => item.dept.deptId === props.modelValue)
})

const displayValue = computed(() => {
  return selectedDept.value?.dept.deptName || props.placeholder
})

function selectDept(deptId: string) {
  emit('update:modelValue', deptId)
  open.value = false
  searchText.value = ''
}

function clearSelection() {
  emit('update:modelValue', undefined)
}

// 监听打开状态,关闭时清空搜索
watch(open, (newVal) => {
  if (!newVal) {
    searchText.value = ''
  }
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :disabled="disabled"
        class="w-full justify-between"
      >
        <span class="truncate">{{ displayValue }}</span>
        <div class="flex items-center gap-1">
          <X
            v-if="modelValue"
            class="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
            @click.stop="clearSelection"
          />
          <ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[300px] p-0" align="start">
      <div class="flex items-center border-b px-3 py-2">
        <Search class="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <Input
          v-model="searchText"
          placeholder="搜索部门..."
          class="h-8 border-0 p-0 focus-visible:ring-0"
        />
      </div>
      <ScrollArea class="h-[300px]">
        <div class="p-1">
          <div
            v-for="item in filteredDepts"
            :key="item.dept.deptId"
            :class="[
              'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
              modelValue === item.dept.deptId && 'bg-accent text-accent-foreground',
            ]"
            :style="{ paddingLeft: `${item.level * 16 + 8}px` }"
            @click="selectDept(item.dept.deptId)"
          >
            {{ item.dept.deptName }}
          </div>
          <div
            v-if="filteredDepts.length === 0"
            class="py-6 text-center text-sm text-muted-foreground"
          >
            未找到部门
          </div>
        </div>
      </ScrollArea>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import type { SysMenu } from '@/api/system/types'

const props = defineProps<{
  menu: SysMenu
  modelValue?: string[]
  checkStrictly?: boolean
  level?: number
  expandAll?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const currentLevel = computed(() => props.level || 0)
const isExpanded = ref(false)
const children = computed(() => props.menu.children || [])
const hasChildren = computed(() => children.value.length > 0)
const shouldExpand = computed(() => props.expandAll || isExpanded.value)
const selectedMenuIds = computed(() => props.modelValue || [])
const isChecked = computed(() => selectedMenuIds.value.includes(props.menu.menuId))

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function collectChildIds(nodes: SysMenu[]) {
  const ids: string[] = []
  nodes.forEach((node) => {
    ids.push(node.menuId)
    if (node.children?.length) ids.push(...collectChildIds(node.children))
  })
  return ids
}

function toggle(checked: boolean | 'indeterminate') {
  if (checked === 'indeterminate') return

  let newIds = [...selectedMenuIds.value]
  const childIds = props.checkStrictly ? collectChildIds(children.value) : []

  if (checked) {
    ;[props.menu.menuId, ...childIds].forEach((id) => {
      if (!newIds.includes(id)) newIds.push(id)
    })
  } else {
    const removeIds = new Set([props.menu.menuId, ...childIds])
    newIds = newIds.filter((id) => !removeIds.has(id))
  }

  emit('update:modelValue', newIds)
}
</script>

<template>
  <div class="py-1">
    <div class="flex items-center gap-1" :style="{ paddingLeft: `${currentLevel * 24}px` }">
      <button
        v-if="hasChildren"
        class="w-4 h-4 flex items-center justify-center hover:bg-accent rounded transition-colors"
        type="button"
        @click.stop="toggleExpand"
      >
        <ChevronDown v-if="isExpanded" class="w-3 h-3" />
        <ChevronRight v-else class="w-3 h-3" />
      </button>
      <span v-else class="w-4" />
      <Checkbox :model-value="isChecked" @update:model-value="toggle" />
      <span class="text-sm">{{ menu.menuName }}</span>
    </div>

    <div v-if="hasChildren && shouldExpand">
      <MenuTreeItem
        v-for="child in children"
        :key="child.menuId"
        :menu="child"
        :model-value="selectedMenuIds"
        :check-strictly="checkStrictly"
        :level="currentLevel + 1"
        :expand-all="expandAll"
        @update:model-value="(val) => emit('update:modelValue', val)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import type { SysMenu } from '@/api/system/types'

const props = defineProps<{
  menu: SysMenu
  level?: number
  selectedIds: Set<string>
  expandAll?: boolean
}>()

const currentLevel = computed(() => props.level || 0)
const isExpanded = ref(false)
const children = computed(() => props.menu.children || [])
const hasChildren = computed(() => children.value.length > 0)
const shouldExpand = computed(() => props.expandAll || isExpanded.value)
const isChecked = computed(() => props.selectedIds.has(String(props.menu.menuId)))

function toggleExpand() {
  isExpanded.value = !isExpanded.value
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
      <Checkbox :model-value="isChecked" disabled />
      <span class="text-sm">{{ menu.menuName }}</span>
    </div>

    <div v-if="hasChildren && shouldExpand">
      <PreviewMenuTreeItem
        v-for="child in children"
        :key="child.menuId"
        :menu="child"
        :level="currentLevel + 1"
        :selected-ids="selectedIds"
        :expand-all="expandAll"
      />
    </div>
  </div>
</template>

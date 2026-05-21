<script setup lang="ts">
import { computed } from 'vue'
import { SelectValue } from '@/components/ui/select'
import ProjectBadge from '@/components/common/ProjectBadge.vue'

interface ProjectSelectValueItem {
  projectId: string
  projectName: string
  projectKey?: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    projects: ProjectSelectValueItem[]
    placeholder?: string
    allValue?: string
    allLabel?: string
  }>(),
  {
    modelValue: undefined,
    placeholder: '请选择项目',
    allValue: undefined,
    allLabel: '全部项目',
  },
)

const selectedProject = computed(() => props.projects.find((item) => item.projectId === props.modelValue))
const isAllSelected = computed(() => Boolean(props.allValue && props.modelValue === props.allValue))
</script>

<template>
  <SelectValue :placeholder="placeholder" class="min-w-0">
    <ProjectBadge
      v-if="selectedProject"
      :name="selectedProject.projectName"
      :code="selectedProject.projectKey"
      compact
      class="max-w-full"
    />
    <span v-else-if="isAllSelected" class="truncate">{{ allLabel }}</span>
    <span v-else class="truncate text-muted-foreground">{{ placeholder }}</span>
  </SelectValue>
</template>

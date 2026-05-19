<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BugProject } from '@/api/bug/types'
import { PM_ALL_OPTION_VALUE, PM_REQUIREMENT_STATUS_OPTIONS } from '../../shared/options'

defineProps<{
  query: {
    keyword: string
    projectId: string
    status: string
  }
  projects: BugProject[]
}>()

const emit = defineEmits<{
  search: []
}>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <Input
      v-model="query.keyword"
      class="w-56"
      placeholder="需求标题/编号"
      @keyup.enter="emit('search')"
    />
    <Select v-model="query.projectId">
      <SelectTrigger class="w-48"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem :value="PM_ALL_OPTION_VALUE">全部项目</SelectItem>
        <SelectItem v-for="project in projects" :key="project.projectId" :value="project.projectId">
          {{ project.projectName }}
        </SelectItem>
      </SelectContent>
    </Select>
    <Select v-model="query.status">
      <SelectTrigger class="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem :value="PM_ALL_OPTION_VALUE">全部状态</SelectItem>
        <SelectItem
          v-for="status in PM_REQUIREMENT_STATUS_OPTIONS"
          :key="status.value"
          :value="status.value"
        >
          {{ status.label }}
        </SelectItem>
      </SelectContent>
    </Select>
    <Button @click="emit('search')">搜索</Button>
  </div>
</template>

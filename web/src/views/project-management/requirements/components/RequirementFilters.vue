<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast/use-toast'
import ProjectSelectOption from '@/components/common/ProjectSelectOption.vue'
import ProjectSelectValue from '@/components/common/ProjectSelectValue.vue'
import type { BugProject, BugUserRef } from '@/api/bug/types'
import type { RequirementFilterState } from '../requirement-query'
import { FilterRangeField, TableFilterPanel } from '@/components/common/table-filter'
import {
  PM_ALL_OPTION_VALUE,
  PM_PRIORITY_OPTIONS,
  PM_REQUIREMENT_STATUS_OPTIONS,
  PM_REQUIREMENT_TYPE_OPTIONS,
} from '../../shared/options'

const props = defineProps<{
  query: RequirementFilterState
  projects: BugProject[]
  users: BugUserRef[]
}>()

const emit = defineEmits<{
  search: []
  reset: []
}>()

const { toast } = useToast()

function handleSearch() {
  if (!validateRanges()) return
  emit('search')
}

function validateRanges() {
  return (
    validateNumberRange('业务价值分', props.query.valueScoreMin, props.query.valueScoreMax) &&
    validateNumberRange('实现难度分', props.query.difficultyScoreMin, props.query.difficultyScoreMax) &&
    validateDateRange('计划开始时间', props.query.plannedStartTimeStart, props.query.plannedStartTimeEnd) &&
    validateDateRange('计划完成时间', props.query.plannedEndTimeStart, props.query.plannedEndTimeEnd) &&
    validateDateRange('创建时间', props.query.createTimeStart, props.query.createTimeEnd)
  )
}

function validateNumberRange(label: string, min: string, max: string) {
  if (min === '' || max === '') return true
  if (Number(min) <= Number(max)) return true
  toast({ title: `${label}范围不正确`, description: '最小值不能大于最大值。', variant: 'destructive' })
  return false
}

function validateDateRange(label: string, start: string, end: string) {
  if (!start || !end) return true
  if (start <= end) return true
  toast({ title: `${label}范围不正确`, description: '开始日期不能晚于结束日期。', variant: 'destructive' })
  return false
}
</script>

<template>
  <TableFilterPanel description="默认展示常用条件，展开后可按编号、标题、负责人、分数和时间范围完整筛选。">
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="space-y-1">
        <Label for="requirement-filter-keyword">关键词</Label>
        <Input
          id="requirement-filter-keyword"
          v-model="props.query.keyword"
          placeholder="需求标题/编号"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="space-y-1">
        <Label for="requirement-filter-project">所属项目</Label>
        <Select v-model="props.query.projectId">
          <SelectTrigger id="requirement-filter-project">
            <ProjectSelectValue
              :model-value="props.query.projectId"
              :projects="props.projects"
              :all-value="PM_ALL_OPTION_VALUE"
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="PM_ALL_OPTION_VALUE">全部项目</SelectItem>
            <SelectItem
              v-for="project in props.projects"
              :key="project.projectId"
              :value="project.projectId"
            >
              <ProjectSelectOption
                :name="project.projectName"
                :code="project.projectKey"
                :stage="project.projectStage"
                :owner-name="project.owner?.nickName || project.owner?.userName"
              />
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="space-y-1">
        <Label for="requirement-filter-status">状态</Label>
        <Select v-model="props.query.status">
          <SelectTrigger id="requirement-filter-status"><SelectValue /></SelectTrigger>
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
      </div>
      <div class="flex items-end gap-2">
        <Button data-permission-neutral @click="handleSearch">搜索</Button>
        <Button variant="outline" data-permission-neutral @click="emit('reset')">重置</Button>
      </div>
    </div>

    <template #expanded>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-1">
          <Label for="requirement-filter-no">需求编号</Label>
          <Input
            id="requirement-filter-no"
            v-model="props.query.requirementNo"
            placeholder="例如：ADMIN-REQ-0001"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="space-y-1">
          <Label for="requirement-filter-title">需求标题</Label>
          <Input
            id="requirement-filter-title"
            v-model="props.query.title"
            placeholder="按标题包含匹配"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="space-y-1">
          <Label for="requirement-filter-type">需求分类</Label>
          <Select v-model="props.query.type">
            <SelectTrigger id="requirement-filter-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="PM_ALL_OPTION_VALUE">全部分类</SelectItem>
              <SelectItem
                v-for="item in PM_REQUIREMENT_TYPE_OPTIONS"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="requirement-filter-priority">优先级</Label>
          <Select v-model="props.query.priority">
            <SelectTrigger id="requirement-filter-priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="PM_ALL_OPTION_VALUE">全部优先级</SelectItem>
              <SelectItem v-for="item in PM_PRIORITY_OPTIONS" :key="item.value" :value="item.value">
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="requirement-filter-source">需求来源</Label>
          <Input
            id="requirement-filter-source"
            v-model="props.query.source"
            placeholder="按来源包含匹配"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="space-y-1">
          <Label for="requirement-filter-owner">需求负责人</Label>
          <Select v-model="props.query.ownerId">
            <SelectTrigger id="requirement-filter-owner"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="PM_ALL_OPTION_VALUE">全部需求负责人</SelectItem>
              <SelectItem v-for="user in props.users" :key="user.userId" :value="user.userId">
                {{ user.nickName || user.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="requirement-filter-developer">开发负责人</Label>
          <Select v-model="props.query.developerId">
            <SelectTrigger id="requirement-filter-developer"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="PM_ALL_OPTION_VALUE">全部开发负责人</SelectItem>
              <SelectItem v-for="user in props.users" :key="user.userId" :value="user.userId">
                {{ user.nickName || user.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="requirement-filter-tester">测试负责人</Label>
          <Select v-model="props.query.testerId">
            <SelectTrigger id="requirement-filter-tester"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="PM_ALL_OPTION_VALUE">全部测试负责人</SelectItem>
              <SelectItem v-for="user in props.users" :key="user.userId" :value="user.userId">
                {{ user.nickName || user.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <FilterRangeField
          v-model:start="props.query.valueScoreMin"
          v-model:end="props.query.valueScoreMax"
          label="业务价值分"
          type="number"
          min="0"
          max="100"
          start-placeholder="最小值"
          end-placeholder="最大值"
        />
        <FilterRangeField
          v-model:start="props.query.difficultyScoreMin"
          v-model:end="props.query.difficultyScoreMax"
          label="实现难度分"
          type="number"
          min="0"
          max="100"
          start-placeholder="最小值"
          end-placeholder="最大值"
        />
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <FilterRangeField
          v-model:start="props.query.plannedStartTimeStart"
          v-model:end="props.query.plannedStartTimeEnd"
          label="计划开始时间"
        />
        <FilterRangeField
          v-model:start="props.query.plannedEndTimeStart"
          v-model:end="props.query.plannedEndTimeEnd"
          label="计划完成时间"
        />
        <FilterRangeField
          v-model:start="props.query.createTimeStart"
          v-model:end="props.query.createTimeEnd"
          label="创建时间"
        />
      </div>
    </template>
  </TableFilterPanel>
</template>

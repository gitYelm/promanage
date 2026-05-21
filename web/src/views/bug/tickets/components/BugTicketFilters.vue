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
import { FilterRangeField, TableFilterPanel } from '@/components/common/table-filter'
import type { BugModule, BugProject, BugUserRef } from '@/api/bug/types'
import type { BugTicketFilterState } from '../bug-ticket-query'
import {
  ALL_OPTION_VALUE,
  BUG_ENVIRONMENT_OPTIONS,
  BUG_PRIORITY_OPTIONS,
  BUG_SEVERITY_OPTIONS,
  BUG_STATUS_OPTIONS,
  BUG_TYPE_OPTIONS,
} from '../../shared/bug-options'

const props = defineProps<{
  query: BugTicketFilterState
  projects: BugProject[]
  modules: BugModule[]
  users: BugUserRef[]
}>()

const emit = defineEmits<{
  projectChange: []
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
    validateDateRange('创建时间', props.query.createTimeStart, props.query.createTimeEnd) &&
    validateDateRange('预计完成时间', props.query.dueTimeStart, props.query.dueTimeEnd) &&
    validateDateRange('更新时间', props.query.updateTimeStart, props.query.updateTimeEnd)
  )
}

function validateDateRange(label: string, start: string, end: string) {
  if (!start || !end) return true
  if (start <= end) return true
  toast({ title: `${label}范围不正确`, description: '开始日期不能晚于结束日期。', variant: 'destructive' })
  return false
}
</script>

<template>
  <TableFilterPanel description="默认展示常用条件，展开后可按编号、标题、人员、环境和时间范围完整筛选。">
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="space-y-1">
        <Label for="bug-filter-keyword">关键词</Label>
        <Input
          id="bug-filter-keyword"
          v-model="props.query.keyword"
          placeholder="标题/编号"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="space-y-1">
        <Label for="bug-filter-project">所属项目</Label>
        <Select v-model="props.query.projectId" @update:model-value="emit('projectChange')">
          <SelectTrigger id="bug-filter-project"><ProjectSelectValue :model-value="props.query.projectId" :projects="props.projects" :all-value="ALL_OPTION_VALUE" all-label="全部项目" placeholder="项目" /></SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL_OPTION_VALUE">全部项目</SelectItem>
            <SelectItem v-for="project in props.projects" :key="project.projectId" :value="project.projectId">
              <ProjectSelectOption :name="project.projectName" :code="project.projectKey" :stage="project.projectStage" :owner-name="project.owner?.nickName || project.owner?.userName" />
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="space-y-1">
        <Label for="bug-filter-status">状态</Label>
        <Select v-model="props.query.status">
          <SelectTrigger id="bug-filter-status"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL_OPTION_VALUE">全部状态</SelectItem>
            <SelectItem v-for="item in BUG_STATUS_OPTIONS" :key="item.value" :value="item.value">
              {{ item.label }}
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
          <Label for="bug-filter-no">缺陷编号</Label>
          <Input
            id="bug-filter-no"
            v-model="props.query.ticketNo"
            placeholder="例如：ADMIN-BUG-0001"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="space-y-1">
          <Label for="bug-filter-title">缺陷标题</Label>
          <Input
            id="bug-filter-title"
            v-model="props.query.title"
            placeholder="按标题包含匹配"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="space-y-1">
          <Label for="bug-filter-module">所属模块</Label>
          <Select v-model="props.query.moduleId">
            <SelectTrigger id="bug-filter-module"><SelectValue placeholder="模块" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_OPTION_VALUE">全部模块</SelectItem>
              <SelectItem v-for="module in props.modules" :key="module.moduleId" :value="module.moduleId">
                {{ module.moduleName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="bug-filter-type">缺陷类型</Label>
          <Select v-model="props.query.type">
            <SelectTrigger id="bug-filter-type"><SelectValue placeholder="类型" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_OPTION_VALUE">全部类型</SelectItem>
              <SelectItem v-for="item in BUG_TYPE_OPTIONS" :key="item.value" :value="item.value">
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="bug-filter-severity">严重程度</Label>
          <Select v-model="props.query.severity">
            <SelectTrigger id="bug-filter-severity"><SelectValue placeholder="严重程度" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_OPTION_VALUE">全部严重程度</SelectItem>
              <SelectItem v-for="item in BUG_SEVERITY_OPTIONS" :key="item.value" :value="item.value">
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="bug-filter-priority">优先级</Label>
          <Select v-model="props.query.priority">
            <SelectTrigger id="bug-filter-priority"><SelectValue placeholder="优先级" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_OPTION_VALUE">全部优先级</SelectItem>
              <SelectItem v-for="item in BUG_PRIORITY_OPTIONS" :key="item.value" :value="item.value">
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="bug-filter-environment">运行环境</Label>
          <Select v-model="props.query.environment">
            <SelectTrigger id="bug-filter-environment"><SelectValue placeholder="环境" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_OPTION_VALUE">全部环境</SelectItem>
              <SelectItem v-for="item in BUG_ENVIRONMENT_OPTIONS" :key="item.value" :value="item.value">
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="bug-filter-device">设备信息</Label>
          <Input
            id="bug-filter-device"
            v-model="props.query.deviceInfo"
            placeholder="按设备/浏览器包含匹配"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="space-y-1">
          <Label for="bug-filter-assignee">负责人</Label>
          <Select v-model="props.query.assigneeId">
            <SelectTrigger id="bug-filter-assignee"><SelectValue placeholder="负责人" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_OPTION_VALUE">全部负责人</SelectItem>
              <SelectItem v-for="user in props.users" :key="user.userId" :value="user.userId">
                {{ user.nickName || user.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="bug-filter-submitter">提交人</Label>
          <Select v-model="props.query.submitterId">
            <SelectTrigger id="bug-filter-submitter"><SelectValue placeholder="提交人" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_OPTION_VALUE">全部提交人</SelectItem>
              <SelectItem v-for="user in props.users" :key="user.userId" :value="user.userId">
                {{ user.nickName || user.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1">
          <Label for="bug-filter-verifier">验证人</Label>
          <Select v-model="props.query.verifierId">
            <SelectTrigger id="bug-filter-verifier"><SelectValue placeholder="验证人" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="ALL_OPTION_VALUE">全部验证人</SelectItem>
              <SelectItem v-for="user in props.users" :key="user.userId" :value="user.userId">
                {{ user.nickName || user.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <FilterRangeField
          v-model:start="props.query.createTimeStart"
          v-model:end="props.query.createTimeEnd"
          label="创建时间"
        />
        <FilterRangeField
          v-model:start="props.query.dueTimeStart"
          v-model:end="props.query.dueTimeEnd"
          label="预计完成时间"
        />
        <FilterRangeField
          v-model:start="props.query.updateTimeStart"
          v-model:end="props.query.updateTimeEnd"
          label="更新时间"
        />
      </div>
    </template>
  </TableFilterPanel>
</template>

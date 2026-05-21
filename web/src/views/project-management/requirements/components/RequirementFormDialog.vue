<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ProjectSelectOption from '@/components/common/ProjectSelectOption.vue'
import ProjectSelectValue from '@/components/common/ProjectSelectValue.vue'
import type { RequirementForm } from '@/api/project-management/types'
import type { BugProject, BugUserRef } from '@/api/bug/types'
import {
  PM_NONE_OPTION_VALUE,
  PM_PRIORITY_OPTIONS,
  PM_REQUIREMENT_TYPE_OPTIONS,
} from '../../shared/options'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  form: RequirementForm
  projects: BugProject[]
  ownerUsers: BugUserRef[]
  developerUsers: BugUserRef[]
}>()

const emit = defineEmits<{
  projectChange: [projectId: string]
  save: []
}>()

const canSave = computed(() => Boolean(props.form.title && props.form.projectId))

function handleProjectChange(value: unknown) {
  if (value === null || value === undefined) return
  const projectId = String(value)
  props.form.projectId = projectId
  props.form.ownerId = PM_NONE_OPTION_VALUE
  props.form.developerId = PM_NONE_OPTION_VALUE
  emit('projectChange', projectId)
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ props.form.requirementId ? '编辑需求' : '新增需求' }}</DialogTitle>
        <DialogDescription>
          请补充需求基础信息、人员分工和计划时间；带 * 的字段为必填。
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2">
          <Label for="requirement-title">需求标题 <span class="text-destructive">*</span></Label>
          <Input
            id="requirement-title"
            v-model="props.form.title"
            placeholder="例如：后台管理系统新增数据导出能力"
          />
          <p class="text-xs text-muted-foreground">
            编辑时默认带出列表标题；这里修改后会同步更新列表主标题。
          </p>
        </div>
        <div class="space-y-2">
          <Label for="requirement-project">所属项目 <span class="text-destructive">*</span></Label>
          <Select :model-value="props.form.projectId" @update:model-value="handleProjectChange">
            <SelectTrigger id="requirement-project">
              <ProjectSelectValue
                :model-value="props.form.projectId"
                :projects="props.projects"
                placeholder="请选择所属项目"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="p in props.projects" :key="p.projectId" :value="p.projectId">
                <ProjectSelectOption
                  :name="p.projectName"
                  :code="p.projectKey"
                  :stage="p.projectStage"
                  :owner-name="p.owner?.nickName || p.owner?.userName"
                />
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            决定需求归属和可选择的负责人范围，切换项目会重置人员分工。
          </p>
        </div>
        <div class="space-y-2">
          <Label for="requirement-type">需求分类</Label>
          <Select v-model="props.form.type">
            <SelectTrigger id="requirement-type">
              <SelectValue placeholder="请选择需求分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="t in PM_REQUIREMENT_TYPE_OPTIONS"
                :key="t.value"
                :value="t.value"
              >
                {{ t.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">用于统计和后续筛选，不影响优先级或负责人。</p>
        </div>
        <div class="space-y-2">
          <Label for="requirement-priority">优先级</Label>
          <Select v-model="props.form.priority">
            <SelectTrigger id="requirement-priority">
              <SelectValue placeholder="请选择优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="p in PM_PRIORITY_OPTIONS" :key="p.value" :value="p.value">
                {{ p.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            表示排期和处理紧急程度，默认“中”适用于常规需求。
          </p>
        </div>
        <div class="space-y-2">
          <Label for="requirement-owner">需求负责人（可选）</Label>
          <Select v-model="props.form.ownerId">
            <SelectTrigger id="requirement-owner">
              <SelectValue placeholder="请选择需求负责人" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="PM_NONE_OPTION_VALUE">暂不指定需求负责人</SelectItem>
              <SelectItem v-for="u in props.ownerUsers" :key="u.userId" :value="u.userId">
                {{ u.nickName || u.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            负责需求澄清、范围确认和验收；暂不指定表示稍后再补充，不会自动分派。
          </p>
        </div>
        <div class="space-y-2">
          <Label for="requirement-developer">开发负责人（可选）</Label>
          <Select v-model="props.form.developerId">
            <SelectTrigger id="requirement-developer">
              <SelectValue placeholder="请选择开发负责人" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="PM_NONE_OPTION_VALUE">暂不指定开发负责人</SelectItem>
              <SelectItem v-for="u in props.developerUsers" :key="u.userId" :value="u.userId">
                {{ u.nickName || u.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            负责排期后的开发承接；暂不指定时需求仍可保存，但后续需补齐承接人。
          </p>
        </div>
        <div class="space-y-2">
          <Label for="requirement-start">计划开始（可选）</Label>
          <Input id="requirement-start" v-model="props.form.plannedStartTime" type="date" />
          <p class="text-xs text-muted-foreground">用于排期和进度统计；不确定时可先留空。</p>
        </div>
        <div class="space-y-2">
          <Label for="requirement-end">计划完成（可选）</Label>
          <Input id="requirement-end" v-model="props.form.plannedEndTime" type="date" />
          <p class="text-xs text-muted-foreground">
            用于判断延期和统计交付计划；不确定时可先留空。
          </p>
        </div>
        <div class="space-y-2 md:col-span-2">
          <Label for="requirement-description">需求描述（可选）</Label>
          <Textarea
            id="requirement-description"
            v-model="props.form.description"
            placeholder="描述用户场景、业务价值或问题背景"
          />
        </div>
        <div class="space-y-2 md:col-span-2">
          <Label for="requirement-acceptance">验收标准（可选）</Label>
          <Textarea
            id="requirement-acceptance"
            v-model="props.form.acceptanceCriteria"
            placeholder="描述完成后如何判断需求已达成"
          />
        </div>
      </div>
      <DialogFooter>
        <Button :disabled="!canSave" @click="emit('save')">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

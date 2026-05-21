<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ProjectBadge from '@/components/common/ProjectBadge.vue'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BugUserRef } from '@/api/bug/types'
import {
  REQUIREMENT_BATCH_CLEAR_VALUE,
  REQUIREMENT_BATCH_KEEP_VALUE,
  type RequirementBatchAssignFormState,
} from './requirement-batch-assign.constants'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  selectedCount: number
  projectName: string
  ownerUsers: BugUserRef[]
  developerUsers: BugUserRef[]
  testerUsers: BugUserRef[]
  form: RequirementBatchAssignFormState
}>()

const emit = defineEmits<{
  save: []
}>()

const canSave = computed(
  () =>
    props.form.ownerId !== REQUIREMENT_BATCH_KEEP_VALUE ||
    props.form.developerId !== REQUIREMENT_BATCH_KEEP_VALUE ||
    props.form.testerId !== REQUIREMENT_BATCH_KEEP_VALUE,
)
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-xl">
      <DialogHeader>
        <DialogTitle>批量修改人员分工</DialogTitle>
        <DialogDescription>
          已选择 {{ props.selectedCount }} 条需求，可统一修改
          <ProjectBadge :name="props.projectName" compact class="mx-1 align-middle" />
          的需求负责人、开发负责人、测试负责人。
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4">
        <p class="text-xs text-muted-foreground">
          每个字段都支持三种处理方式：不修改、清空当前负责人、重新指定新的人选。
        </p>
        <div class="space-y-2">
          <Label for="batch-owner">需求负责人</Label>
          <Select v-model="props.form.ownerId">
            <SelectTrigger id="batch-owner"><SelectValue placeholder="选择处理方式" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="REQUIREMENT_BATCH_KEEP_VALUE">不修改该字段</SelectItem>
              <SelectItem :value="REQUIREMENT_BATCH_CLEAR_VALUE">清空需求负责人</SelectItem>
              <SelectItem v-for="u in props.ownerUsers" :key="u.userId" :value="u.userId">
                {{ u.nickName || u.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label for="batch-developer">开发负责人</Label>
          <Select v-model="props.form.developerId">
            <SelectTrigger id="batch-developer"><SelectValue placeholder="选择处理方式" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="REQUIREMENT_BATCH_KEEP_VALUE">不修改该字段</SelectItem>
              <SelectItem :value="REQUIREMENT_BATCH_CLEAR_VALUE">清空开发负责人</SelectItem>
              <SelectItem v-for="u in props.developerUsers" :key="u.userId" :value="u.userId">
                {{ u.nickName || u.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label for="batch-tester">测试负责人</Label>
          <Select v-model="props.form.testerId">
            <SelectTrigger id="batch-tester"><SelectValue placeholder="选择处理方式" /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="REQUIREMENT_BATCH_KEEP_VALUE">不修改该字段</SelectItem>
              <SelectItem :value="REQUIREMENT_BATCH_CLEAR_VALUE">清空测试负责人</SelectItem>
              <SelectItem v-for="u in props.testerUsers" :key="u.userId" :value="u.userId">
                {{ u.nickName || u.userName }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">取消</Button>
        <Button :disabled="!canSave" @click="emit('save')">批量保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

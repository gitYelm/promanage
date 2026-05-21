<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import CronGenerator from '@/components/common/CronGenerator.vue'
import type { JobForm } from '@/api/monitor/job'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  form: JobForm
  isEdit: boolean
  submitting: boolean
  jobGroupOptions: Array<{ label: string; value: string }>
}>()
const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{{ props.isEdit ? '修改任务' : '新增任务' }}</DialogTitle><DialogDescription>请配置任务基础信息、调用目标和调度策略。</DialogDescription></DialogHeader>
      <div class="space-y-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2"><Label for="jobName">任务名称 *</Label><Input id="jobName" v-model="props.form.jobName" placeholder="请输入任务名称" /></div>
          <div class="grid gap-2"><Label for="jobGroup">任务分组</Label><Select v-model="props.form.jobGroup"><SelectTrigger><SelectValue placeholder="选择分组" /></SelectTrigger><SelectContent><SelectItem v-for="opt in props.jobGroupOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem></SelectContent></Select></div>
        </div>
        <div class="grid gap-2"><Label for="invokeTarget">调用方法 *</Label><Input id="invokeTarget" v-model="props.form.invokeTarget" placeholder="请输入调用目标字符串" /><p class="text-xs text-muted-foreground">Bean调用示例：ryTask.ryParams('ry')</p></div>
        <div class="grid gap-2"><Label for="cronExpression">Cron表达式 *</Label><CronGenerator v-model="props.form.cronExpression" /></div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2"><Label for="misfirePolicy">错误策略</Label><Select v-model="props.form.misfirePolicy"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">立即执行</SelectItem><SelectItem value="2">执行一次</SelectItem><SelectItem value="3">放弃执行</SelectItem></SelectContent></Select></div>
          <div class="grid gap-2"><Label for="concurrent">是否并发</Label><Select v-model="props.form.concurrent"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">允许</SelectItem><SelectItem value="1">禁止</SelectItem></SelectContent></Select></div>
        </div>
        <div class="flex items-center gap-2"><Switch :model-value="props.form.status === '0'" @update:model-value="(v) => (props.form.status = v ? '0' : '1')" /><span class="text-sm">{{ props.form.status === '0' ? '启用' : '暂停' }}</span></div>
      </div>
      <DialogFooter><Button variant="outline" @click="open = false">取消</Button><Button :disabled="props.submitting" @click="emit('submit')">保存</Button></DialogFooter>
    </DialogContent>
  </Dialog>
</template>

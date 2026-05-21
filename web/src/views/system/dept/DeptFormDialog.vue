<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-vue-next'
import { getStatusOptions } from '@/utils/options'
import type { SysDept } from '@/api/system/types'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  form: Partial<SysDept>
  isEdit: boolean
  submitLoading: boolean
  flattenedOptions: Array<{ id: string; label: string }>
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{{ props.isEdit ? '修改部门' : '新增部门' }}</DialogTitle>
        <DialogDescription> 请填写部门信息 </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="parentId">上级部门</Label>
          <Select v-model="props.form.parentId">
            <SelectTrigger><SelectValue placeholder="选择上级部门" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">无上级</SelectItem>
              <SelectItem v-for="dept in props.flattenedOptions" :key="dept.id" :value="dept.id">{{ dept.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2"><Label for="deptName">部门名称 *</Label><Input id="deptName" v-model="props.form.deptName" placeholder="请输入部门名称" /></div>
          <div class="grid gap-2"><Label for="orderNum">显示排序</Label><Input id="orderNum" v-model="props.form.orderNum" type="number" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2"><Label for="leader">负责人</Label><Input id="leader" v-model="props.form.leader" placeholder="请输入负责人" /></div>
          <div class="grid gap-2"><Label for="phone">联系电话</Label><Input id="phone" v-model="props.form.phone" placeholder="请输入联系电话" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2"><Label for="email">邮箱</Label><Input id="email" v-model="props.form.email" placeholder="请输入邮箱" /></div>
          <div class="grid gap-2">
            <Label for="status">部门状态</Label>
            <Select v-model="props.form.status">
              <SelectTrigger><SelectValue placeholder="选择状态" /></SelectTrigger>
              <SelectContent><SelectItem v-for="opt in getStatusOptions()" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">取消</Button>
        <Button :disabled="props.submitLoading" @click="emit('submit')"><Loader2 v-if="props.submitLoading" class="mr-2 h-4 w-4 animate-spin" />确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

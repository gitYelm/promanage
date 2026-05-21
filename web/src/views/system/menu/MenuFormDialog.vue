<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-vue-next'
import IconPicker from '@/components/common/IconPicker.vue'
import { getStatusOptions } from '@/utils/options'
import type { MenuForm } from '@/api/system/menu'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  form: MenuForm
  isEdit: boolean
  submitLoading: boolean
  flattenedOptions: Array<{ id: string; label: string }>
}>()
const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[600px] max-h-[90vh] flex flex-col">
      <DialogHeader class="flex-shrink-0"><DialogTitle>{{ props.isEdit ? '修改菜单' : '新增菜单' }}</DialogTitle><DialogDescription> 请填写菜单信息 </DialogDescription></DialogHeader>
      <div class="flex-1 overflow-y-auto grid gap-4 py-4">
        <div class="grid gap-2"><Label for="parentId">上级菜单</Label><Select v-model="props.form.parentId"><SelectTrigger><SelectValue placeholder="选择上级菜单" /></SelectTrigger><SelectContent><SelectItem value="0">主类目</SelectItem><SelectItem v-for="menu in props.flattenedOptions" :key="menu.id" :value="menu.id">{{ menu.label }}</SelectItem></SelectContent></Select></div>
        <div class="grid gap-2"><Label>菜单类型</Label><RadioGroup v-model="props.form.menuType" class="flex items-center gap-4"><div class="flex items-center space-x-2"><RadioGroupItem id="typeM" value="M" /><Label for="typeM">目录</Label></div><div class="flex items-center space-x-2"><RadioGroupItem id="typeC" value="C" /><Label for="typeC">菜单</Label></div><div class="flex items-center space-x-2"><RadioGroupItem id="typeF" value="F" /><Label for="typeF">按钮</Label></div></RadioGroup></div>
        <div class="grid grid-cols-2 gap-4"><div class="grid gap-2"><Label for="menuName">菜单名称 *</Label><Input id="menuName" v-model="props.form.menuName" placeholder="请输入菜单名称" /></div><div class="grid gap-2"><Label for="orderNum">显示排序</Label><Input id="orderNum" v-model="props.form.orderNum" type="number" /></div></div>
        <div v-if="props.form.menuType !== 'F'" class="grid gap-2"><Label for="icon">菜单图标</Label><IconPicker v-model="props.form.icon" /></div>
        <div v-if="props.form.menuType !== 'F'" class="grid grid-cols-2 gap-4"><div class="grid gap-2"><Label for="path">路由地址</Label><Input id="path" v-model="props.form.path" placeholder="请输入路由地址" /></div><div v-if="props.form.menuType === 'C'" class="grid gap-2"><Label for="component">组件路径</Label><Input id="component" v-model="props.form.component" placeholder="请输入组件路径" /></div></div>
        <div v-if="props.form.menuType !== 'M'" class="grid gap-2"><Label for="perms">权限字符</Label><Input id="perms" v-model="props.form.perms" placeholder="system:user:list" /></div>
        <div class="grid grid-cols-2 gap-4"><div class="grid gap-2"><Label for="visible">显示状态</Label><Select v-model="props.form.visible"><SelectTrigger><SelectValue placeholder="选择状态" /></SelectTrigger><SelectContent><SelectItem v-for="opt in getStatusOptions('showHide')" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem></SelectContent></Select></div><div class="grid gap-2"><Label for="status">菜单状态</Label><Select v-model="props.form.status"><SelectTrigger><SelectValue placeholder="选择状态" /></SelectTrigger><SelectContent><SelectItem v-for="opt in getStatusOptions()" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem></SelectContent></Select></div></div>
      </div>
      <DialogFooter class="flex-shrink-0"><Button variant="outline" @click="open = false">取消</Button><Button :disabled="props.submitLoading" @click="emit('submit')"><Loader2 v-if="props.submitLoading" class="mr-2 h-4 w-4 animate-spin" />确定</Button></DialogFooter>
    </DialogContent>
  </Dialog>
</template>

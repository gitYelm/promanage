<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DeptTreeSelect from '@/components/business/DeptTreeSelect.vue'
import { FilterRangeField, TableFilterPanel } from '@/components/common/table-filter'
import { getStatusOptionsWithAll } from '@/utils/options'
import { Search, RefreshCw } from 'lucide-vue-next'
import type { SysRole } from '@/api/system/types'

const props = defineProps<{
  query: {
    userName: string
    phonenumber: string
    status: string
    deptId?: string
    roleId?: string | number
    beginTime: string
    endTime: string
  }
  deptOptions: any[]
  roleOptions: SysRole[]
}>()
const emit = defineEmits<{ search: []; reset: [] }>()
</script>

<template>
  <TableFilterPanel description="默认展示用户名和手机号码，展开后可按状态、部门、角色和创建时间完整筛选。">
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="space-y-1">
        <label for="user-filter-name" class="text-sm font-medium">用户名</label>
        <Input id="user-filter-name" v-model="props.query.userName" placeholder="请输入用户名" @keyup.enter="emit('search')" />
      </div>
      <div class="space-y-1">
        <label for="user-filter-phone" class="text-sm font-medium">手机号码</label>
        <Input id="user-filter-phone" v-model="props.query.phonenumber" placeholder="请输入手机号码" @keyup.enter="emit('search')" />
      </div>
      <div class="flex items-end gap-2">
        <Button data-permission-neutral @click="emit('search')"><Search class="w-4 h-4 mr-2" />搜索</Button>
        <Button variant="outline" data-permission-neutral @click="emit('reset')"><RefreshCw class="w-4 h-4 mr-2" />重置</Button>
      </div>
    </div>
    <template #expanded>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-1">
          <Label>状态</Label>
          <Select v-model="props.query.status">
            <SelectTrigger><SelectValue placeholder="请选择状态" /></SelectTrigger>
            <SelectContent><SelectItem v-for="opt in getStatusOptionsWithAll()" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem></SelectContent>
          </Select>
        </div>
        <div class="space-y-1"><Label>部门</Label><DeptTreeSelect v-model="props.query.deptId" :depts="props.deptOptions" placeholder="请选择部门" /></div>
        <div class="space-y-1">
          <Label>角色</Label>
          <Select v-model="props.query.roleId">
            <SelectTrigger><SelectValue placeholder="请选择角色" /></SelectTrigger>
            <SelectContent><SelectItem v-for="role in props.roleOptions" :key="role.roleId" :value="role.roleId">{{ role.roleName }}</SelectItem></SelectContent>
          </Select>
        </div>
        <FilterRangeField v-model:start="props.query.beginTime" v-model:end="props.query.endTime" label="创建时间" />
      </div>
    </template>
  </TableFilterPanel>
</template>

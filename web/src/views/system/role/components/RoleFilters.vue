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
import { RefreshCw, Search } from 'lucide-vue-next'
import { FilterRangeField, TableFilterPanel } from '@/components/common/table-filter'
import { getStatusOptionsWithAll } from '@/utils/options'

const queryParams = defineModel<{
  roleName: string
  roleKey: string
  status: string
  securityLevelMin?: string
  securityLevelMax?: string
}>('queryParams', { required: true })

const emit = defineEmits<{
  query: []
  reset: []
}>()
</script>

<template>
  <TableFilterPanel description="默认展示角色名称、权限字符和状态，展开后可按安全等级范围完整筛选。">
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="space-y-1">
        <label for="role-filter-name" class="text-sm font-medium">角色名称</label>
        <Input id="role-filter-name" v-model="queryParams.roleName" placeholder="请输入角色名称" @keyup.enter="emit('query')" />
      </div>
      <div class="space-y-1">
        <label for="role-filter-key" class="text-sm font-medium">权限字符</label>
        <Input id="role-filter-key" v-model="queryParams.roleKey" placeholder="请输入权限字符" @keyup.enter="emit('query')" />
      </div>
      <div class="space-y-1">
        <label for="role-filter-status" class="text-sm font-medium">状态</label>
        <Select v-model="queryParams.status">
          <SelectTrigger id="role-filter-status"><SelectValue placeholder="请选择" /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in getStatusOptionsWithAll()" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-end gap-2">
        <Button data-permission-neutral @click="emit('query')"><Search class="w-4 h-4 mr-2" />搜索</Button>
        <Button variant="outline" data-permission-neutral @click="emit('reset')"><RefreshCw class="w-4 h-4 mr-2" />重置</Button>
      </div>
    </div>
    <template #expanded>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <FilterRangeField
          v-model:start="queryParams.securityLevelMin"
          v-model:end="queryParams.securityLevelMax"
          label="安全等级"
          type="number"
          min="1"
          max="999"
          start-placeholder="最低等级"
          end-placeholder="最高等级"
        />
      </div>
    </template>
  </TableFilterPanel>
</template>

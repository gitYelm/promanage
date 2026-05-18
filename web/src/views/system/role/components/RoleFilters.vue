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
import { getStatusOptionsWithAll } from '@/utils/options'

const queryParams = defineModel<{
  roleName: string
  roleKey: string
  status: string
}>('queryParams', { required: true })

const emit = defineEmits<{
  query: []
  reset: []
}>()
</script>

<template>
  <div
    class="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-center bg-background/95 p-4 border rounded-lg backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium">角色名称</span>
      <Input
        v-model="queryParams.roleName"
        placeholder="请输入角色名称"
        class="w-[200px]"
        @keyup.enter="emit('query')"
      />
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium">权限字符</span>
      <Input
        v-model="queryParams.roleKey"
        placeholder="请输入权限字符"
        class="w-[200px]"
        @keyup.enter="emit('query')"
      />
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium">状态</span>
      <Select v-model="queryParams.status" @update:model-value="emit('query')">
        <SelectTrigger class="w-[120px]">
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in getStatusOptionsWithAll()" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="flex gap-2 ml-auto">
      <Button @click="emit('query')">
        <Search class="w-4 h-4 mr-2" />
        搜索
      </Button>
      <Button variant="outline" @click="emit('reset')">
        <RefreshCw class="w-4 h-4 mr-2" />
        重置
      </Button>
    </div>
  </div>
</template>

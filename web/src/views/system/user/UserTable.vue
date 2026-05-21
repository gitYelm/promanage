<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import SortableTableHead from '@/components/common/SortableTableHead.vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import { formatDate } from '@/utils/format'
import { Eye, Edit, Key, Trash2 } from 'lucide-vue-next'
import { changeUserStatus } from '@/api/system/user'
import type { SysUser } from '@/api/system/types'

export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  fixed?: boolean
}

const props = defineProps<{
  loading: boolean
  users: SysUser[]
  columns: ColumnConfig[]
  selectedRows: string[]
  selectAll: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc' | ''
}>()

const emit = defineEmits<{
  add: []
  detail: [user: SysUser]
  edit: [user: SysUser]
  resetPassword: [user: SysUser]
  delete: [user: SysUser]
  toggleRow: [userId: string]
  updateSelectAll: [checked: boolean]
  statusUpdated: [user: SysUser, status: string]
  sort: [key: string]
}>()

function getAvatarUrl(avatar: string | undefined | null): string {
  if (!avatar) return ''
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar
  return `${import.meta.env.VITE_API_URL}${avatar}`
}

function isColumnVisible(key: string): boolean {
  const col = props.columns.find((c) => c.key === key)
  return col ? col.visible : true
}
</script>

<template>
  <div class="border rounded-md bg-card overflow-x-auto">
    <TableSkeleton v-if="props.loading" :columns="6" :rows="10" show-checkbox />

    <EmptyState
      v-else-if="props.users.length === 0"
      title="暂无用户数据"
      description="点击新增用户按钮添加第一个用户"
      action-text="新增用户"
      @action="emit('add')"
    />

    <Table v-else class="min-w-[800px]">
      <TableHeader>
        <TableRow>
          <TableHead class="w-[50px]">
            <Checkbox :model-value="props.selectAll" @update:model-value="(checked) => emit('updateSelectAll', Boolean(checked))" />
          </TableHead>
          <SortableTableHead v-if="isColumnVisible('userId')" label="用户编号" sort-key="userId" class="w-[100px]" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="isColumnVisible('userName')" label="用户名" sort-key="userName" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="isColumnVisible('nickName')" label="用户昵称" sort-key="nickName" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <TableHead v-if="isColumnVisible('dept')">部门</TableHead>
          <SortableTableHead v-if="isColumnVisible('phonenumber')" label="手机号码" sort-key="phonenumber" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="isColumnVisible('email')" label="邮箱" sort-key="email" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="isColumnVisible('status')" label="状态" sort-key="status" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="isColumnVisible('createTime')" label="创建时间" sort-key="createTime" :sort-by="props.sortBy" :sort-order="props.sortOrder" @sort="emit('sort', $event)" />
          <TableHead class="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="user in props.users" :key="user.userId">
          <TableCell>
            <Checkbox
              :model-value="props.selectedRows.includes(user.userId)"
              @update:model-value="() => emit('toggleRow', user.userId)"
            />
          </TableCell>
          <TableCell v-if="isColumnVisible('userId')">{{ user.userId }}</TableCell>
          <TableCell v-if="isColumnVisible('userName')" class="font-medium">
            <div class="flex items-center gap-2">
              <Avatar class="h-8 w-8">
                <AvatarImage :src="getAvatarUrl(user.avatar)" />
                <AvatarFallback>{{ user.nickName?.charAt(0) || 'U' }}</AvatarFallback>
              </Avatar>
              {{ user.userName }}
            </div>
          </TableCell>
          <TableCell v-if="isColumnVisible('nickName')">{{ user.nickName }}</TableCell>
          <TableCell v-if="isColumnVisible('dept')">{{ user.dept?.deptName }}</TableCell>
          <TableCell v-if="isColumnVisible('phonenumber')">{{ user.phonenumber }}</TableCell>
          <TableCell v-if="isColumnVisible('email')">{{ user.email }}</TableCell>
          <TableCell v-if="isColumnVisible('status')">
            <StatusSwitch
              :status="user.status"
              :name="user.nickName"
              :on-toggle="(status) => changeUserStatus(user.userId, status)"
              @update:status="emit('statusUpdated', user, $event)"
            />
          </TableCell>
          <TableCell v-if="isColumnVisible('createTime')">{{ formatDate(user.createTime) }}</TableCell>
          <TableCell class="text-right space-x-2">
            <Button variant="ghost" size="icon" title="查看详情" @click="emit('detail', user)"><Eye class="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" title="修改" @click="emit('edit', user)"><Edit class="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" title="重置密码" @click="emit('resetPassword', user)"><Key class="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" class="text-destructive" title="删除" @click="emit('delete', user)"><Trash2 class="w-4 h-4" /></Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

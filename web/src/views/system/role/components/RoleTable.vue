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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Edit, Eye, Shield, Trash2, Users } from 'lucide-vue-next'
import TablePagination from '@/components/common/TablePagination.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusSwitch from '@/components/common/StatusSwitch.vue'
import { formatDate } from '@/utils/format'
import { usePermission } from '@/composables/usePermission'
import { changeRoleStatus } from '@/api/system/role'
import type { SysRole } from '@/api/system/types'
import type { TableColumnConfig } from '@/composables/useTableColumns'

defineProps<{
  loading: boolean
  roleList: SysRole[]
  selectedIds: string[]
  total: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc' | ''
  columns: TableColumnConfig[]
}>()

const pageNum = defineModel<number>('pageNum', { required: true })
const pageSize = defineModel<number>('pageSize', { required: true })
const selectAll = defineModel<boolean>('selectAll', { required: true })

const emit = defineEmits<{
  add: []
  change: []
  toggleSelect: [roleId: string]
  statusChange: [role: SysRole, status: '0' | '1']
  preview: [role: SysRole]
  edit: [role: SysRole]
  delete: [role: SysRole]
  sort: [key: string]
}>()

function isColumnVisible(columns: TableColumnConfig[], key: string) {
  const col = columns.find((item) => item.key === key)
  return col ? col.visible : true
}

function getDataScopeText(dataScope?: string) {
  const scopeMap: Record<string, string> = {
    '1': '全部数据',
    '2': '自定义数据',
    '3': '本部门数据',
    '4': '本部门及以下数据',
    '5': '仅本人数据',
  }
  return scopeMap[dataScope || '1'] || '全部数据'
}
const canShowOperationColumn = usePermission(['system:role:query', 'system:role:edit', 'system:role:remove'])
</script>

<template>
  <div class="border rounded-md bg-card overflow-x-auto">
    <TableSkeleton v-if="loading" :columns="11" :rows="10" show-checkbox />
    <EmptyState
      v-else-if="roleList.length === 0"
      title="暂无角色数据"
      description="点击新增角色按钮添加第一个角色"
      action-text="新增角色"
      @action="emit('add')"
    />

    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead class="w-[50px]">
            <Checkbox v-model="selectAll" :disabled="roleList.length === 0" />
          </TableHead>
          <SortableTableHead v-if="isColumnVisible(columns, 'roleId')" label="角色编号" sort-key="roleId" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="isColumnVisible(columns, 'roleName')" label="角色名称" sort-key="roleName" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="isColumnVisible(columns, 'roleKey')" label="权限字符" sort-key="roleKey" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="isColumnVisible(columns, 'securityLevel')" label="安全等级" sort-key="securityLevel" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <TableHead v-if="isColumnVisible(columns, 'userCount')">用户数</TableHead>
          <TableHead v-if="isColumnVisible(columns, 'dataScope')">数据权限</TableHead>
          <SortableTableHead v-if="isColumnVisible(columns, 'roleSort')" label="显示顺序" sort-key="roleSort" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="isColumnVisible(columns, 'status')" label="状态" sort-key="status" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <SortableTableHead v-if="isColumnVisible(columns, 'createTime')" label="创建时间" sort-key="createTime" :sort-by="sortBy" :sort-order="sortOrder" @sort="emit('sort', $event)" />
          <TableHead v-if="canShowOperationColumn && isColumnVisible(columns, 'actions')" class="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="item in roleList" :key="item.roleId">
          <TableCell>
            <Checkbox
              :model-value="selectedIds.includes(item.roleId)"
              @update:model-value="() => emit('toggleSelect', item.roleId)"
            />
          </TableCell>
          <TableCell v-if="isColumnVisible(columns, 'roleId')">{{ item.roleId }}</TableCell>
          <TableCell v-if="isColumnVisible(columns, 'roleName')">{{ item.roleName }}</TableCell>
          <TableCell v-if="isColumnVisible(columns, 'roleKey')"><Badge variant="outline">{{ item.roleKey }}</Badge></TableCell>
          <TableCell v-if="isColumnVisible(columns, 'securityLevel')">
            <div class="flex flex-col gap-1">
              <Badge variant="default" class="w-fit font-mono">{{ item.securityLevel ?? 0 }}</Badge>
            </div>
          </TableCell>
          <TableCell v-if="isColumnVisible(columns, 'userCount')">
            <Badge variant="outline" class="font-mono">
              <Users class="w-3 h-3 mr-1" />
              {{ item.userCount || 0 }}
            </Badge>
          </TableCell>
          <TableCell v-if="isColumnVisible(columns, 'dataScope')">
            <Badge variant="secondary">
              <Shield class="w-3 h-3 mr-1" />
              {{ getDataScopeText(item.dataScope) }}
            </Badge>
          </TableCell>
          <TableCell v-if="isColumnVisible(columns, 'roleSort')">{{ item.roleSort }}</TableCell>
          <TableCell v-if="isColumnVisible(columns, 'status')">
            <StatusSwitch
              :status="item.status"
              :name="item.roleName"
              :on-toggle="(s) => changeRoleStatus(item.roleId, s)"
              @update:status="emit('statusChange', item, $event as '0' | '1')"
            />
          </TableCell>
          <TableCell v-if="isColumnVisible(columns, 'createTime')">{{ formatDate(item.createTime) }}</TableCell>
          <TableCell v-if="canShowOperationColumn && isColumnVisible(columns, 'actions')" class="text-right space-x-2">
            <Button permission="system:role:query" variant="ghost" size="icon" title="查看权限" @click="emit('preview', item)">
              <Eye class="w-4 h-4" />
            </Button>
            <Button permission="system:role:edit" variant="ghost" size="icon" title="修改" @click="emit('edit', item)">
              <Edit class="w-4 h-4" />
            </Button>
            <Button
              permission="system:role:remove"
              variant="ghost"
              size="icon"
              class="text-destructive"
              title="删除"
              @click="emit('delete', item)"
            >
              <Trash2 class="w-4 h-4" />
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>

  <TablePagination
    v-model:page-num="pageNum"
    v-model:page-size="pageSize"
    :total="total"
    @change="emit('change')"
  />
</template>

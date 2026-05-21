<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { Shield } from 'lucide-vue-next'
import { formatDate } from '@/utils/format'
import type { SysMenu, SysRole } from '@/api/system/types'
import PreviewMenuTreeItem from './PreviewMenuTreeItem.vue'

const open = defineModel<boolean>('open', { required: true })
const expandAll = defineModel<boolean>('expandAll', { required: true })

defineProps<{
  role: SysRole | null
  menuList: SysMenu[]
  selectedIds: Set<string>
}>()

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
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>角色权限预览</DialogTitle>
        <DialogDescription>
          查看角色 "{{ role?.roleName }}" 的详细权限信息
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm font-medium text-muted-foreground mb-1">角色名称</div>
            <div class="text-sm">{{ role?.roleName }}</div>
          </div>
          <div>
            <div class="text-sm font-medium text-muted-foreground mb-1">权限字符</div>
            <div class="text-sm"><Badge variant="outline">{{ role?.roleKey }}</Badge></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm font-medium text-muted-foreground mb-1">安全等级</div>
            <div class="text-sm font-mono">{{ role?.securityLevel ?? 0 }}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm font-medium text-muted-foreground mb-1">数据权限</div>
            <div class="text-sm">
              <Badge variant="secondary">
                <Shield class="w-3 h-3 mr-1" />
                {{ getDataScopeText(role?.dataScope) }}
              </Badge>
            </div>
          </div>
          <div>
            <div class="text-sm font-medium text-muted-foreground mb-1">状态</div>
            <div class="text-sm">
              <StatusBadge
                domain="enabled"
                :value="role?.status"
                :label="role?.status === '0' ? '正常' : '停用'"
              />
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm font-medium text-muted-foreground">菜单权限</div>
            <Button type="button" variant="outline" size="sm" @click="expandAll = !expandAll">
              {{ expandAll ? '收起' : '展开' }}全部
            </Button>
          </div>
          <div class="border rounded-md p-2 h-[200px] overflow-y-auto">
            <template v-if="menuList.length > 0">
              <PreviewMenuTreeItem
                v-for="menu in menuList"
                :key="menu.menuId"
                :menu="menu"
                :level="0"
                :selected-ids="selectedIds"
                :expand-all="expandAll"
              />
            </template>
            <div v-else class="text-sm text-muted-foreground text-center py-4">暂无菜单数据</div>
          </div>
        </div>

        <div v-if="role?.remark">
          <div class="text-sm font-medium text-muted-foreground mb-1">备注</div>
          <div class="text-sm text-muted-foreground">{{ role.remark }}</div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <span class="font-medium">创建时间:</span> {{ formatDate(role?.createTime) }}
          </div>
          <div v-if="role?.updateTime">
            <span class="font-medium">更新时间:</span> {{ formatDate(role.updateTime) }}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

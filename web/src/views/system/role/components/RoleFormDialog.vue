<script setup lang="ts">
import { computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-vue-next'
import { getStatusOptions } from '@/utils/options'
import type { SysMenu, SysRole } from '@/api/system/types'
import { useUserStore } from '@/stores/modules/user'
import { getCurrentMaxSecurityLevel } from '../utils/securityLevel'
import MenuTreeItem from './MenuTreeItem.vue'

const open = defineModel<boolean>('open', { required: true })
const userStore = useUserStore()

const props = defineProps<{
  isEdit: boolean
  form: Partial<SysRole>
  menuList: SysMenu[]
  expandedAll: boolean
  submitLoading: boolean
}>()

const emit = defineEmits<{
  toggleExpandAll: []
  selectAllMenus: []
  invertMenuSelection: []
  submit: []
}>()

const currentMaxSecurityLevel = computed(() => {
  return getCurrentMaxSecurityLevel(userStore.roles, userStore.roleList)
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="grid max-h-[90vh] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 sm:max-w-[600px]">
      <DialogHeader class="border-b bg-background px-6 py-4 pr-14">
        <DialogTitle>{{ isEdit ? '修改角色' : '新增角色' }}</DialogTitle>
        <DialogDescription> 请填写角色信息 </DialogDescription>
      </DialogHeader>

      <div class="grid min-h-0 gap-4 overflow-y-auto overscroll-contain px-6 py-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="roleName">角色名称 *</Label>
            <Input id="roleName" v-model="form.roleName" placeholder="请输入角色名称" />
          </div>
          <div class="grid gap-2">
            <Label for="roleKey">权限字符 *</Label>
            <Input id="roleKey" v-model="form.roleKey" placeholder="请输入权限字符" />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="securityLevel">安全等级 *</Label>
          <Input
            id="securityLevel"
            v-model.number="form.securityLevel"
            min="0"
            :max="currentMaxSecurityLevel"
            type="number"
            placeholder="请输入安全等级，例如 100"
          />
          <p class="text-xs text-muted-foreground">
            安全等级越高权限越高；只能设置不高于自己安全等级的值，你当前最多可设置 {{ currentMaxSecurityLevel }}。
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="roleSort">显示顺序</Label>
            <Input id="roleSort" v-model="form.roleSort" type="number" />
          </div>
          <div class="grid gap-2">
            <Label for="status">状态</Label>
            <Select v-model="form.status">
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in getStatusOptions()" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="dataScope">数据权限范围</Label>
          <Select v-model="form.dataScope">
            <SelectTrigger>
              <SelectValue placeholder="选择数据权限范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">全部数据</SelectItem>
              <SelectItem value="2">自定义数据</SelectItem>
              <SelectItem value="3">本部门数据</SelectItem>
              <SelectItem value="4">本部门及以下数据</SelectItem>
              <SelectItem value="5">仅本人数据</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-2">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Label>菜单权限</Label>
            <div class="flex gap-2">
              <Button type="button" variant="outline" size="sm" @click="emit('selectAllMenus')">
                全选
              </Button>
              <Button type="button" variant="outline" size="sm" @click="emit('invertMenuSelection')">
                反选
              </Button>
              <Button type="button" variant="outline" size="sm" @click="emit('toggleExpandAll')">
                {{ expandedAll ? '收起' : '展开' }}全部
              </Button>
            </div>
          </div>
          <div class="flex items-center space-x-2 mb-2">
            <Checkbox
              id="checkStrictly"
              :model-value="form.menuCheckStrictly"
              @update:model-value="(val) => (form.menuCheckStrictly = !!val)"
            />
            <Label for="checkStrictly" class="text-sm text-muted-foreground">父子联动</Label>
          </div>
          <div class="border rounded-md p-2 h-[200px] overflow-y-auto">
            <MenuTreeItem
              v-for="menu in menuList"
              :key="menu.menuId"
              v-model="form.menuIds"
              :menu="menu"
              :check-strictly="form.menuCheckStrictly"
              :level="0"
              :expand-all="expandedAll"
            />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="remark">备注</Label>
          <Input id="remark" v-model="form.remark" placeholder="请输入备注" />
        </div>
      </div>

      <DialogFooter class="border-t bg-background px-6 py-4">
        <Button variant="outline" @click="open = false">取消</Button>
        <Button :permission="isEdit ? 'system:role:edit' : 'system:role:add'" :disabled="submitLoading" @click="emit('submit')">
          <Loader2 v-if="submitLoading" class="mr-2 h-4 w-4 animate-spin" />
          确定
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

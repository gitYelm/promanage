<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-vue-next'
import UserForm from '@/components/business/UserForm.vue'
import type { SysUser, SysRole, SysPost } from '@/api/system/types'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  form: Partial<SysUser>
  isEdit: boolean
  submitLoading: boolean
  deptOptions: any[]
  roleOptions: SysRole[]
  postOptions: SysPost[]
}>()
const emit = defineEmits<{ submit: [] }>()
const userFormRef = ref<InstanceType<typeof UserForm> | null>(null)

function validate() {
  return userFormRef.value?.validate() ?? true
}

defineExpose({ validate })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ props.isEdit ? '修改用户' : '新增用户' }}</DialogTitle>
        <DialogDescription> 请填写用户信息 </DialogDescription>
      </DialogHeader>

      <UserForm
        ref="userFormRef"
        v-model="props.form"
        :is-edit="props.isEdit"
        :depts="props.deptOptions"
        :roles="props.roleOptions"
        :posts="props.postOptions"
      />

      <DialogFooter>
        <Button variant="outline" @click="open = false">取消</Button>
        <Button :disabled="props.submitLoading" @click="emit('submit')">
          <Loader2 v-if="props.submitLoading" class="mr-2 h-4 w-4 animate-spin" />
          确定
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

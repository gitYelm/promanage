<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { uploadAvatar } from '@/api/upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-vue-next'
import PasswordInput from '@/components/common/PasswordInput.vue'
import DeptTreeSelect from './DeptTreeSelect.vue'
import type { SysUser, SysDept, SysRole, SysPost } from '@/api/system/types'
import { getStatusOptions } from '@/utils/options'

interface Props {
  modelValue: Partial<SysUser>
  isEdit: boolean
  depts: SysDept[]
  roles: SysRole[]
  posts: SysPost[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: Partial<SysUser>]
}>()

const { toast } = useToast()
const avatarPreview = ref<string>('')

// 获取完整的头像URL
function getAvatarUrl(avatar: string | undefined | null): string {
  if (!avatar) return ''
  // 如果已经是完整URL,直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  // 如果是相对路径,拼接后端地址
  return `${import.meta.env.VITE_API_URL}${avatar}`
}

// 表单数据
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 表单验证
const errors = reactive({
  userName: '',
  nickName: '',
  password: '',
  email: '',
  phonenumber: '',
})

function validateEmail(email: string): boolean {
  if (!email) return true
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validatePhone(phone: string): boolean {
  if (!phone) return true
  const re = /^1[3-9]\d{9}$/
  return re.test(phone)
}

// 监听字段变化进行验证
watch(
  () => formData.value.email,
  (val) => {
    if (val && !validateEmail(val)) {
      errors.email = '邮箱格式不正确'
    } else {
      errors.email = ''
    }
  },
)

watch(
  () => formData.value.phonenumber,
  (val) => {
    if (val && !validatePhone(val)) {
      errors.phonenumber = '手机号格式不正确'
    } else {
      errors.phonenumber = ''
    }
  },
)

watch(
  () => formData.value.password,
  (val) => {
    if (!props.isEdit && val && val.length < 6) {
      errors.password = '密码长度至少6位'
    } else {
      errors.password = ''
    }
  },
)

// 头像上传
async function handleAvatarUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    toast({ title: '上传失败', description: '请上传图片文件', variant: 'destructive' })
    return
  }
  // 验证文件大小 (2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast({ title: '上传失败', description: '图片大小不能超过2MB', variant: 'destructive' })
    return
  }

  try {
    const result = await uploadAvatar(file)
    // 上传成功,保存文件路径
    avatarPreview.value = `${import.meta.env.VITE_API_URL}${result.url}`
    formData.value.avatar = result.url // 只存储路径
    toast({ title: '上传成功', description: '头像已更新' })
  } catch {
    toast({ title: '上传失败', description: '上传失败,请重试', variant: 'destructive' })
  }
}

// 岗位选择
function togglePost(postId: string, checked: boolean) {
  if (!formData.value.postIds) formData.value.postIds = []
  if (checked) {
    formData.value.postIds.push(postId)
  } else {
    formData.value.postIds = formData.value.postIds.filter((id) => id !== postId)
  }
}

// 角色选择
function toggleRole(roleId: string, checked: boolean) {
  if (!formData.value.roleIds) formData.value.roleIds = []
  if (checked) {
    formData.value.roleIds.push(roleId)
  } else {
    formData.value.roleIds = formData.value.roleIds.filter((id) => id !== roleId)
  }
}

// 全选/反选岗位
function toggleAllPosts() {
  if (!formData.value.postIds) formData.value.postIds = []
  if (formData.value.postIds.length === props.posts.length) {
    formData.value.postIds = []
  } else {
    formData.value.postIds = props.posts.map((p) => p.postId)
  }
}

// 全选/反选角色
function toggleAllRoles() {
  if (!formData.value.roleIds) formData.value.roleIds = []
  if (formData.value.roleIds.length === props.roles.length) {
    formData.value.roleIds = []
  } else {
    formData.value.roleIds = props.roles.map((r) => r.roleId)
  }
}

// 暴露验证方法
defineExpose({
  validate: () => {
    let isValid = true

    if (!formData.value.userName) {
      errors.userName = '用户名不能为空'
      isValid = false
    } else {
      errors.userName = ''
    }

    if (!formData.value.nickName) {
      errors.nickName = '昵称不能为空'
      isValid = false
    } else {
      errors.nickName = ''
    }

    if (!props.isEdit && !formData.value.password) {
      errors.password = '密码不能为空'
      isValid = false
    }

    if (formData.value.email && !validateEmail(formData.value.email)) {
      errors.email = '邮箱格式不正确'
      isValid = false
    }

    if (formData.value.phonenumber && !validatePhone(formData.value.phonenumber)) {
      errors.phonenumber = '手机号格式不正确'
      isValid = false
    }

    return isValid
  },
})
</script>

<template>
  <div class="grid gap-4 py-4">
    <!-- 头像上传 -->
    <div class="flex items-center gap-4">
      <Avatar class="h-20 w-20">
        <AvatarImage :src="avatarPreview || getAvatarUrl(formData.avatar)" />
        <AvatarFallback>{{ formData.nickName?.charAt(0) || 'U' }}</AvatarFallback>
      </Avatar>
      <div>
        <Label class="cursor-pointer">
          <Button variant="outline" size="sm" as="span">
            <Upload class="mr-2 h-4 w-4" />
            上传头像
          </Button>
          <input type="file" accept="image/*" class="hidden" @change="handleAvatarUpload" />
        </Label>
        <p class="text-xs text-muted-foreground mt-1">支持 JPG、PNG 格式,大小不超过 2MB</p>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="grid grid-cols-2 gap-4">
      <div class="grid gap-2">
        <Label for="userName"> 用户名 <span class="text-red-500">*</span> </Label>
        <Input
          id="userName"
          v-model="formData.userName"
          :disabled="isEdit"
          placeholder="请输入用户名"
          :class="errors.userName ? 'border-red-500' : ''"
        />
        <p v-if="errors.userName" class="text-xs text-red-500">{{ errors.userName }}</p>
      </div>

      <div class="grid gap-2">
        <Label for="nickName"> 用户昵称 <span class="text-red-500">*</span> </Label>
        <Input
          id="nickName"
          v-model="formData.nickName"
          placeholder="请输入昵称"
          :class="errors.nickName ? 'border-red-500' : ''"
        />
        <p v-if="errors.nickName" class="text-xs text-red-500">{{ errors.nickName }}</p>
      </div>
    </div>

    <!-- 部门 -->
    <div class="grid gap-2">
      <Label for="deptId">归属部门</Label>
      <DeptTreeSelect v-model="formData.deptId!" :depts="depts" placeholder="请选择部门" />
    </div>

    <!-- 联系方式 -->
    <div class="grid grid-cols-2 gap-4">
      <div class="grid gap-2">
        <Label for="phonenumber">手机号码</Label>
        <Input
          id="phonenumber"
          v-model="formData.phonenumber"
          placeholder="请输入手机号"
          :class="errors.phonenumber ? 'border-red-500' : ''"
        />
        <p v-if="errors.phonenumber" class="text-xs text-red-500">{{ errors.phonenumber }}</p>
      </div>

      <div class="grid gap-2">
        <Label for="email">邮箱</Label>
        <Input
          id="email"
          v-model="formData.email"
          type="email"
          placeholder="请输入邮箱"
          :class="errors.email ? 'border-red-500' : ''"
        />
        <p v-if="errors.email" class="text-xs text-red-500">{{ errors.email }}</p>
      </div>
    </div>

    <!-- 密码 (仅新增时显示) -->
    <div v-if="!isEdit" class="grid gap-2">
      <Label for="password"> 用户密码 <span class="text-red-500">*</span> </Label>
      <PasswordInput v-model="formData.password!" placeholder="请输入密码(至少6位)" show-strength />
      <p v-if="errors.password" class="text-xs text-red-500">{{ errors.password }}</p>
    </div>

    <!-- 性别和状态 -->
    <div class="grid grid-cols-2 gap-4">
      <div class="grid gap-2">
        <Label for="sex">用户性别</Label>
        <Select v-model="formData.sex">
          <SelectTrigger>
            <SelectValue placeholder="选择性别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">男</SelectItem>
            <SelectItem value="1">女</SelectItem>
            <SelectItem value="2">未知</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label for="status">状态</Label>
        <Select v-model="formData.status">
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

    <!-- 岗位选择 -->
    <div class="grid gap-2">
      <div class="flex items-center justify-between">
        <Label>岗位</Label>
        <Button variant="link" size="sm" class="h-auto p-0 text-xs" @click="toggleAllPosts">
          {{ formData.postIds?.length === posts.length ? '取消全选' : '全选' }}
        </Button>
      </div>
      <div class="flex flex-wrap gap-2 border rounded-md p-3 min-h-[60px]">
        <label
          v-for="post in posts"
          :key="post.postId"
          class="flex items-center gap-2 text-sm cursor-pointer hover:text-primary"
        >
          <Checkbox
            :model-value="formData.postIds?.includes(post.postId)"
            @update:model-value="(val) => togglePost(post.postId, !!val)"
          />
          {{ post.postName }}
        </label>
        <p v-if="posts.length === 0" class="text-sm text-muted-foreground">暂无岗位</p>
      </div>
    </div>

    <!-- 角色选择 -->
    <div class="grid gap-2">
      <div class="flex items-center justify-between">
        <Label>角色</Label>
        <Button variant="link" size="sm" class="h-auto p-0 text-xs" @click="toggleAllRoles">
          {{ formData.roleIds?.length === roles.length ? '取消全选' : '全选' }}
        </Button>
      </div>
      <div class="flex flex-wrap gap-2 border rounded-md p-3 min-h-[60px]">
        <label
          v-for="role in roles"
          :key="role.roleId"
          class="flex items-center gap-2 text-sm cursor-pointer hover:text-primary"
        >
          <Checkbox
            :model-value="formData.roleIds?.includes(role.roleId)"
            @update:model-value="(val) => toggleRole(role.roleId, !!val)"
          />
          {{ role.roleName }}
        </label>
        <p v-if="roles.length === 0" class="text-sm text-muted-foreground">暂无角色</p>
      </div>
    </div>

    <!-- 备注 -->
    <div class="grid gap-2">
      <Label for="remark">备注</Label>
      <Input id="remark" v-model="formData.remark" placeholder="请输入备注" />
    </div>
  </div>
</template>

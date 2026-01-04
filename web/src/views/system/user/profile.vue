<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useToast } from '@/components/ui/toast/use-toast'
import { User, Shield, Key, Loader2 } from 'lucide-vue-next'
import { useUserStore } from '@/stores/modules/user'
import { updateProfile, updatePassword } from '@/api/system/user'
import { getInfo } from '@/api/login'
import ImageUpload from '@/components/common/ImageUpload.vue'
import PasswordInput from '@/components/common/PasswordInput.vue'
import TwoFactorSettings from './TwoFactorSettings.vue'

const { toast } = useToast()
const userStore = useUserStore()

const loading = ref(false)
const passwordLoading = ref(false)

// 用户信息
const userInfo = ref({
  nickName: '',
  email: '',
  phonenumber: '',
  sex: '0',
  avatar: '',
})

// 密码修改
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 性别选项
const sexOptions = [
  { label: '男', value: '0' },
  { label: '女', value: '1' },
  { label: '未知', value: '2' },
]

onMounted(async () => {
  // 重新获取用户信息确保数据最新
  try {
    const res = await getInfo()
    const user = res.data?.user || {}
    userInfo.value = {
      nickName: user.nickName || '',
      email: user.email || '',
      phonenumber: user.phonenumber || '',
      sex: user.sex || '0',
      avatar: user.avatar || '',
    }
  } catch {
    userInfo.value = {
      nickName: userStore.name,
      email: userStore.email,
      phonenumber: '',
      sex: '0',
      avatar: userStore.avatar,
    }
  }
})

// 更新个人信息
const handleUpdateProfile = async () => {
  // 前端校验
  if (userInfo.value.phonenumber && userInfo.value.phonenumber.length > 11) {
    toast({ title: '验证失败', description: '手机号码不能超过11位', variant: 'destructive' })
    return
  }
  if (userInfo.value.nickName && userInfo.value.nickName.length > 30) {
    toast({ title: '验证失败', description: '用户昵称不能超过30个字符', variant: 'destructive' })
    return
  }
  if (userInfo.value.email && userInfo.value.email.length > 50) {
    toast({ title: '验证失败', description: '邮箱不能超过50个字符', variant: 'destructive' })
    return
  }

  loading.value = true
  try {
    await updateProfile({
      nickName: userInfo.value.nickName,
      email: userInfo.value.email,
      phonenumber: userInfo.value.phonenumber,
      sex: userInfo.value.sex,
      avatar: userInfo.value.avatar,
    })
    // 更新 store 中的用户信息
    await userStore.getInfo()
    toast({ title: '更新成功', description: '个人信息已更新' })
  } catch (error) {
    toast({
      title: '更新失败',
      description: error instanceof Error ? error.message : '操作失败',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    toast({ title: '验证失败', description: '请填写完整的密码信息', variant: 'destructive' })
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast({ title: '验证失败', description: '两次输入的新密码不一致', variant: 'destructive' })
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    toast({ title: '验证失败', description: '新密码长度不能少于6位', variant: 'destructive' })
    return
  }

  passwordLoading.value = true
  try {
    await updatePassword(passwordForm.value.oldPassword, passwordForm.value.newPassword)
    toast({ title: '修改成功', description: '密码已更新' })
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    toast({
      title: '修改失败',
      description: error instanceof Error ? error.message : '操作失败',
      variant: 'destructive',
    })
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <div>
      <h2 class="text-xl sm:text-2xl font-bold tracking-tight">个人中心</h2>
      <p class="text-muted-foreground">管理您的账户信息和安全设置</p>
    </div>

    <Tabs default-value="profile" class="space-y-4">
      <TabsList>
        <TabsTrigger value="profile"><User class="h-4 w-4 mr-2" />基本信息</TabsTrigger>
        <TabsTrigger value="security"><Shield class="h-4 w-4 mr-2" />安全设置</TabsTrigger>
        <TabsTrigger value="password"><Key class="h-4 w-4 mr-2" />修改密码</TabsTrigger>
      </TabsList>

      <!-- 基本信息 -->
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>更新您的个人资料信息</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- 头像上传 -->
            <div class="space-y-2">
              <Label>头像</Label>
              <div class="max-w-[200px]">
                <ImageUpload
                  v-model="userInfo.avatar"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                />
                <p class="text-xs text-muted-foreground mt-2">
                  支持 JPG、PNG 格式，建议尺寸 200x200
                </p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>用户昵称</Label>
                <Input v-model="userInfo.nickName" placeholder="请输入昵称" />
              </div>
              <div class="space-y-2">
                <Label>邮箱</Label>
                <Input v-model="userInfo.email" type="email" placeholder="请输入邮箱" />
              </div>
              <div class="space-y-2">
                <Label>手机号码</Label>
                <Input v-model="userInfo.phonenumber" placeholder="请输入手机号码" />
              </div>
              <div class="space-y-2">
                <Label>性别</Label>
                <Select v-model="userInfo.sex">
                  <SelectTrigger>
                    <SelectValue placeholder="请选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="item in sexOptions" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button :disabled="loading" @click="handleUpdateProfile">
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              保存修改
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- 安全设置 -->
      <TabsContent value="security">
        <TwoFactorSettings />
      </TabsContent>

      <!-- 修改密码 -->
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
            <CardDescription>定期更换密码可以提高账户安全性</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 max-w-md">
            <div class="space-y-2">
              <Label>当前密码</Label>
              <PasswordInput v-model="passwordForm.oldPassword" placeholder="请输入当前密码" />
            </div>
            <div class="space-y-2">
              <Label>新密码</Label>
              <PasswordInput
                v-model="passwordForm.newPassword"
                placeholder="请输入新密码"
                show-strength
              />
            </div>
            <div class="space-y-2">
              <Label>确认新密码</Label>
              <PasswordInput
                v-model="passwordForm.confirmPassword"
                placeholder="请再次输入新密码"
              />
            </div>
            <Button :disabled="passwordLoading" @click="handleChangePassword">
              <Loader2 v-if="passwordLoading" class="mr-2 h-4 w-4 animate-spin" />
              修改密码
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>

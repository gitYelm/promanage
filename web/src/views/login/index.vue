<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Loader2,
  Shield,
  Users,
  Settings,
  BarChart3,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/modules/user'
import { useAppStore } from '@/stores/modules/app'
import { getCaptchaImage, verifyTwoFactor, type CaptchaResult, type LoginResult } from '@/api/login'
import { setToken } from '@/utils/auth'

const router = useRouter()
const { toast } = useToast()
const userStore = useUserStore()
const appStore = useAppStore()

// 网站配置
const siteName = computed(() => appStore.siteConfig.name || 'RBAC Admin Pro')
const siteDescription = computed(() => appStore.siteConfig.description || '企业级权限管理系统')
const siteCopyright = computed(
  () => appStore.siteConfig.copyright || '© 2025 RBAC Admin Pro. All rights reserved.'
)
const siteIcp = computed(() => appStore.siteConfig.icp || '')
const siteLogo = computed(() => {
  const logo = appStore.siteConfig.logo
  if (!logo) return ''
  // 相对路径加上 API 前缀
  if (logo.startsWith('/')) {
    return import.meta.env.VITE_API_URL + logo
  }
  return logo
})

const username = ref('admin')
const password = ref('admin123')
const showPassword = ref(false)
const code = ref('')
const uuid = ref('')
const captchaImg = ref('')
const captchaEnabled = ref(false)
const isLoading = ref(false)
const captchaLoading = ref(false)

// 两步验证相关
const showTwoFactor = ref(false)
const twoFactorCode = ref('')
const tempToken = ref('')

const features = [
  { icon: Shield, title: '权限管理', desc: '细粒度的菜单和按钮级权限控制' },
  { icon: Users, title: '用户管理', desc: '支持部门层级和多角色分配' },
  { icon: Settings, title: '系统配置', desc: '灵活的字典、参数和通知管理' },
  { icon: BarChart3, title: '系统监控', desc: '操作日志、登录日志、在线用户' },
]

// 获取验证码
const loadCaptcha = async () => {
  captchaLoading.value = true
  try {
    const response = (await getCaptchaImage()) as unknown as { data: CaptchaResult }
    const res = response.data
    captchaEnabled.value = res.captchaEnabled
    if (res.captchaEnabled && res.uuid && res.img) {
      uuid.value = res.uuid
      captchaImg.value = res.img
    }
  } catch {
    captchaEnabled.value = false
  } finally {
    captchaLoading.value = false
  }
}

onMounted(() => {
  appStore.loadSiteConfig()
  loadCaptcha()
})

const handleLogin = async () => {
  if (!username.value || !password.value) {
    toast({ title: '验证失败', description: '请输入用户名和密码', variant: 'destructive' })
    return
  }

  if (captchaEnabled.value && !code.value) {
    toast({ title: '验证失败', description: '请输入验证码', variant: 'destructive' })
    return
  }

  isLoading.value = true
  try {
    const loginData: { username: string; password: string; code?: string; uuid?: string } = {
      username: username.value,
      password: password.value,
    }
    if (captchaEnabled.value) {
      loginData.code = code.value
      loginData.uuid = uuid.value
    }

    const response = (await userStore.loginWithoutToken(loginData)) as unknown as {
      data: LoginResult
    }
    const result = response.data

    // 检查是否需要两步验证
    if (result.requireTwoFactor && result.tempToken) {
      tempToken.value = result.tempToken
      showTwoFactor.value = true
      twoFactorCode.value = ''
      toast({ title: '需要两步验证', description: '请输入您的验证器应用中的验证码' })
    } else if (result.token) {
      // 直接登录成功
      setToken(result.token)
      userStore.$patch({ token: result.token })
      await userStore.getInfo()
      toast({ title: '登录成功', description: '欢迎回来，' + username.value })
      router.push('/')
    }
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : '用户名或密码错误'
    toast({ title: '登录失败', description: message, variant: 'destructive' })
    if (captchaEnabled.value) {
      code.value = ''
      loadCaptcha()
    }
  } finally {
    isLoading.value = false
  }
}

// 两步验证
const handleTwoFactorVerify = async () => {
  if (!twoFactorCode.value || twoFactorCode.value.length !== 6) {
    toast({ title: '验证失败', description: '请输入6位验证码', variant: 'destructive' })
    return
  }

  isLoading.value = true
  try {
    const response = (await verifyTwoFactor({
      tempToken: tempToken.value,
      code: twoFactorCode.value,
    })) as unknown as { data: { token: string } }

    setToken(response.data.token)
    userStore.$patch({ token: response.data.token })
    await userStore.getInfo()
    toast({ title: '登录成功', description: '欢迎回来，' + username.value })
    router.push('/')
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : '验证码错误'
    toast({ title: '验证失败', description: message, variant: 'destructive' })
    twoFactorCode.value = ''
  } finally {
    isLoading.value = false
  }
}

// 返回登录
const backToLogin = () => {
  showTwoFactor.value = false
  tempToken.value = ''
  twoFactorCode.value = ''
  if (captchaEnabled.value) {
    code.value = ''
    loadCaptcha()
  }
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- 左侧品牌区 -->
    <div
      class="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12"
    >
      <div>
        <div class="flex items-center gap-3 mb-2">
          <template v-if="siteLogo">
            <img :src="siteLogo" :alt="siteName" class="h-10 max-w-[200px] object-contain" />
          </template>
          <template v-else>
            <div
              class="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center"
            >
              <Shield class="w-6 h-6" />
            </div>
          </template>
          <span class="text-2xl font-bold">{{ siteName }}</span>
        </div>
        <p class="text-primary-foreground/70">{{ siteDescription }}</p>
      </div>

      <div class="space-y-8">
        <div>
          <h2 class="text-3xl font-bold mb-4">开箱即用的<br />后台管理解决方案</h2>
          <p class="text-primary-foreground/70 text-lg">
            基于 Vue 3 + NestJS + PostgreSQL 构建，提供完整的 RBAC 权限模型
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="p-4 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors"
          >
            <component :is="feature.icon" class="w-6 h-6 mb-2" />
            <h3 class="font-semibold mb-1">{{ feature.title }}</h3>
            <p class="text-sm text-primary-foreground/70">{{ feature.desc }}</p>
          </div>
        </div>
      </div>

      <div class="text-sm text-primary-foreground/50 space-y-1">
        <p>{{ siteCopyright }}</p>
        <p v-if="siteIcp">
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-primary-foreground/70"
          >
            {{ siteIcp }}
          </a>
        </p>
      </div>
    </div>

    <!-- 右侧登录区 -->
    <div class="flex-1 flex items-center justify-center p-8 bg-background">
      <div class="w-full max-w-md space-y-8">
        <!-- 移动端 Logo -->
        <div class="lg:hidden text-center mb-8">
          <div class="inline-flex items-center gap-2 mb-2">
            <template v-if="siteLogo">
              <img :src="siteLogo" :alt="siteName" class="h-10 max-w-[200px] object-contain" />
            </template>
            <template v-else>
              <div
                class="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
              >
                <Shield class="w-6 h-6" />
              </div>
            </template>
            <span class="text-2xl font-bold">{{ siteName }}</span>
          </div>
        </div>

        <!-- 两步验证表单 -->
        <template v-if="showTwoFactor">
          <div class="text-center lg:text-left">
            <h1 class="text-2xl font-bold tracking-tight">两步验证</h1>
            <p class="text-muted-foreground mt-2">请输入您验证器应用中的6位验证码</p>
          </div>

          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="twoFactorCode">验证码</Label>
              <div class="relative">
                <KeyRound
                  class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                  id="twoFactorCode"
                  v-model="twoFactorCode"
                  placeholder="请输入6位验证码"
                  class="h-11 pl-10 text-center text-lg tracking-widest"
                  maxlength="6"
                  @keyup.enter="handleTwoFactorVerify"
                />
              </div>
            </div>
            <Button class="w-full h-11" :disabled="isLoading" @click="handleTwoFactorVerify">
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ isLoading ? '验证中...' : '验证' }}
            </Button>
            <Button variant="outline" class="w-full h-11" @click="backToLogin"> 返回登录 </Button>
          </div>
        </template>

        <!-- 登录表单 -->
        <template v-else>
          <div class="text-center lg:text-left">
            <h1 class="text-2xl font-bold tracking-tight">欢迎回来</h1>
            <p class="text-muted-foreground mt-2">请输入您的账号密码登录系统</p>
          </div>

          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="username">用户名</Label>
              <Input id="username" v-model="username" placeholder="请输入用户名" class="h-11" />
            </div>
            <div class="space-y-2">
              <Label for="password">密码</Label>
              <div class="relative">
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  class="h-11 pr-10"
                  @keyup.enter="handleLogin"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </button>
              </div>
            </div>
            <div v-if="captchaEnabled" class="space-y-2">
              <Label for="code">验证码</Label>
              <div class="flex gap-2">
                <Input
                  id="code"
                  v-model="code"
                  placeholder="请输入验证码"
                  class="h-11 flex-1"
                  @keyup.enter="handleLogin"
                />
                <div
                  class="h-11 w-[120px] rounded-md border cursor-pointer flex items-center justify-center overflow-hidden bg-muted"
                  @click="loadCaptcha"
                >
                  <RefreshCw
                    v-if="captchaLoading"
                    class="h-5 w-5 animate-spin text-muted-foreground"
                  />
                  <img
                    v-else-if="captchaImg"
                    :src="captchaImg"
                    alt="验证码"
                    class="h-full w-full object-contain"
                  />
                  <span v-else class="text-sm text-muted-foreground">点击获取</span>
                </div>
              </div>
            </div>
            <Button class="w-full h-11" :disabled="isLoading" @click="handleLogin">
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ isLoading ? '登录中...' : '登录' }}
            </Button>
          </div>

          <p class="text-center text-sm text-muted-foreground">默认账号：admin / admin123</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SemanticTag from '@/components/common/SemanticTag.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-vue-next'
import { getTwoFactorSetup, enableTwoFactor, disableTwoFactor } from '@/api/login'

const { toast } = useToast()

const loading = ref(false)
const globalEnabled = ref(false)
const userEnabled = ref(false)
const secret = ref('')
const qrCode = ref('')
const verifyCode = ref('')
const copied = ref(false)

// 加载两步验证设置
const loadSettings = async () => {
  loading.value = true
  try {
    const res = await getTwoFactorSetup()
    const data = res.data
    globalEnabled.value = data.globalEnabled
    userEnabled.value = data.userEnabled
    if (data.secret) secret.value = data.secret
    if (data.qrCode) qrCode.value = data.qrCode
  } catch (error) {
    toast({
      title: '加载失败',
      description: error instanceof Error ? error.message : '获取两步验证设置失败',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

// 启用两步验证
const handleEnable = async () => {
  if (!verifyCode.value || verifyCode.value.length !== 6) {
    toast({ title: '验证失败', description: '请输入6位验证码', variant: 'destructive' })
    return
  }

  loading.value = true
  try {
    await enableTwoFactor({ secret: secret.value, code: verifyCode.value })
    toast({ title: '启用成功', description: '两步验证已启用' })
    userEnabled.value = true
    verifyCode.value = ''
  } catch (error) {
    toast({
      title: '启用失败',
      description: error instanceof Error ? error.message : '验证码错误',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

// 禁用两步验证
const handleDisable = async () => {
  loading.value = true
  try {
    await disableTwoFactor()
    toast({ title: '禁用成功', description: '两步验证已禁用' })
    userEnabled.value = false
    // 重新加载获取新的密钥
    await loadSettings()
  } catch (error) {
    toast({
      title: '禁用失败',
      description: error instanceof Error ? error.message : '操作失败',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

// 复制密钥
const copySecret = async () => {
  try {
    await navigator.clipboard.writeText(secret.value)
    copied.value = true
    toast({ title: '复制成功', description: '密钥已复制到剪贴板' })
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    toast({ title: '复制失败', description: '请手动复制密钥', variant: 'destructive' })
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Shield class="h-5 w-5" />
          <CardTitle>两步验证</CardTitle>
        </div>
        <SemanticTag v-if="userEnabled" tone="success">
          <ShieldCheck class="h-3 w-3 mr-1" />
          已启用
        </SemanticTag>
        <SemanticTag v-else tone="neutral">
          <ShieldOff class="h-3 w-3 mr-1" />
          未启用
        </SemanticTag>
      </div>
      <CardDescription>
        两步验证为您的账户提供额外的安全保护。启用后，登录时需要输入验证器应用生成的验证码。
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="flex items-center justify-center py-8">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>

      <template v-else>
        <!-- 全局未启用提示 -->
        <div v-if="!globalEnabled" class="text-center py-8 text-muted-foreground">
          <ShieldOff class="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>系统管理员尚未启用两步验证功能</p>
          <p class="text-sm mt-2">请联系管理员在系统参数中启用 sys.account.twoFactorEnabled</p>
        </div>

        <!-- 已启用状态 -->
        <div v-else-if="userEnabled" class="space-y-4">
          <div
            class="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div class="flex items-center gap-2 text-green-700 dark:text-green-300">
              <ShieldCheck class="h-5 w-5" />
              <span class="font-medium">两步验证已启用</span>
            </div>
            <p class="text-sm text-green-600 dark:text-green-400 mt-2">
              您的账户已受到两步验证保护。每次登录时都需要输入验证器应用中的验证码。
            </p>
          </div>
          <Button variant="destructive" :disabled="loading" @click="handleDisable">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            禁用两步验证
          </Button>
        </div>

        <!-- 未启用状态 - 设置流程 -->
        <div v-else class="space-y-6">
          <div class="grid md:grid-cols-2 gap-6">
            <!-- 左侧：二维码 -->
            <div class="space-y-4">
              <h4 class="font-medium">1. 扫描二维码</h4>
              <p class="text-sm text-muted-foreground">
                使用 Google Authenticator、Microsoft Authenticator 或其他 TOTP
                验证器应用扫描下方二维码
              </p>
              <div class="flex justify-center p-4 bg-white rounded-lg border">
                <img v-if="qrCode" :src="qrCode" alt="两步验证二维码" class="w-48 h-48" />
              </div>
            </div>

            <!-- 右侧：手动输入 -->
            <div class="space-y-4">
              <h4 class="font-medium">或手动输入密钥</h4>
              <p class="text-sm text-muted-foreground">
                如果无法扫描二维码，可以在验证器应用中手动输入以下密钥
              </p>
              <div class="flex items-center gap-2">
                <code class="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono break-all">
                  {{ secret }}
                </code>
                <Button variant="outline" size="icon" @click="copySecret">
                  <Check v-if="copied" class="h-4 w-4 text-green-500" />
                  <Copy v-else class="h-4 w-4" />
                </Button>
              </div>

              <div class="pt-4 space-y-4">
                <h4 class="font-medium">2. 输入验证码</h4>
                <p class="text-sm text-muted-foreground">输入验证器应用显示的6位验证码以完成设置</p>
                <div class="space-y-2">
                  <Label for="verifyCode">验证码</Label>
                  <Input
                    id="verifyCode"
                    v-model="verifyCode"
                    placeholder="请输入6位验证码"
                    maxlength="6"
                    class="text-center text-lg tracking-widest"
                  />
                </div>
                <Button class="w-full" :disabled="loading || !verifyCode" @click="handleEnable">
                  <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                  启用两步验证
                </Button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>

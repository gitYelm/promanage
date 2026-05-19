<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast/use-toast'
import { useAppStore } from '@/stores/modules/app'
import { useMenuStore } from '@/stores/modules/menu'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/modules/user'
import TabsView from '@/components/TabsView.vue'
import ProfileDialog from '@/components/ProfileDialog.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import DesktopSidebar from './components/DesktopSidebar.vue'
import AppHeader from './components/AppHeader.vue'
import { useLayoutHelpers } from './composables/useLayoutHelpers'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const menuStore = useMenuStore()
const themeStore = useThemeStore()
const { toast } = useToast()
const { transitionName } = useLayoutHelpers()

const activeTopMenu = ref('')
const showLogoutDialog = ref(false)
const showProfile = ref(false)
const showSettings = ref(false)
const isNormalMode = computed(() => themeStore.menuMode === 'normal')
const isMixedMode = computed(() => themeStore.menuMode === 'mixed')
const sidebarWidth = computed(() => {
  if (!isNormalMode.value && !isMixedMode.value) return '0'
  return `${appStore.sidebarCollapsed ? themeStore.sidebarCollapsedWidth : themeStore.sidebarExpandedWidth}px`
})

watch(
  () => route.path,
  (path) => {
    if (!isMixedMode.value) return
    const topMenu = menuStore.menuList.find(
      (menu) => path.startsWith(menu.path) || menu.children?.some((child) => path === (child.path.startsWith('/') ? child.path : `${menu.path}/${child.path}`)),
    )
    if (topMenu) activeTopMenu.value = topMenu.path
  },
  { immediate: true },
)

onMounted(() => {
  void appStore.loadSiteConfig()
})

function handleProfile() {
  router.push('/user/profile')
}

function handleOpenEditDialog(userId: string) {
  showProfile.value = false
  router.push(`/system/user?edit=${userId}`)
}

async function confirmLogout() {
  const loginPath = appStore.siteConfig.loginPath || '/login'
  await userStore.logout()
  toast({ title: '退出成功', description: '您已安全退出系统' })
  router.push(loginPath)
}
</script>

<template>
  <div class="flex min-h-screen w-full flex-col bg-muted/40">
    <DesktopSidebar v-model:active-top-menu="activeTopMenu" @profile="handleProfile" @logout="showLogoutDialog = true" />

    <div class="flex flex-col transition-all duration-300 sm:py-4" :class="{ 'sm:pl-[var(--sidebar-width)]': isNormalMode || isMixedMode }" :style="{ '--sidebar-width': sidebarWidth } as any">
      <AppHeader v-model:active-top-menu="activeTopMenu" @profile="handleProfile" @logout="showLogoutDialog = true" />
      <TabsView v-if="themeStore.showTabs" />

      <main class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <RouterView v-slot="{ Component }">
          <Transition :name="transitionName" mode="out-in"><component :is="Component" /></Transition>
        </RouterView>
      </main>
    </div>

    <ProfileDialog v-model:open="showProfile" @open-settings="showSettings = true" @open-edit-dialog="handleOpenEditDialog" />
    <SettingsDialog v-model:open="showSettings" />

    <AlertDialog :open="showLogoutDialog" @update:open="showLogoutDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认退出</AlertDialogTitle>
          <AlertDialogDescription>您确定要退出登录吗？退出后需要重新登录才能访问系统。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction data-permission-neutral @click="confirmLogout">确认退出</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

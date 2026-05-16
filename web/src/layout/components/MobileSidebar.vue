<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, PanelLeft } from 'lucide-vue-next'
import { useMenuStore } from '@/stores/modules/menu'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { useLayoutHelpers } from '../composables/useLayoutHelpers'
import LayoutLogo from './LayoutLogo.vue'
import LayoutUserMenu from './LayoutUserMenu.vue'

const emit = defineEmits<{ profile: []; logout: [] }>()
const route = useRoute()
const menuStore = useMenuStore()
const { siteName, siteLogo, getIcon, isActive, childPath } = useLayoutHelpers()

const activeAccordionValue = computed(() => {
  const index = menuStore.menuList.findIndex(
    (menu) => route.path.startsWith(menu.path) || menu.children?.some((child) => route.path === childPath(menu.path, child.path)),
  )
  return index >= 0 ? `item-${index}` : undefined
})
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button size="icon" variant="outline" class="sm:hidden">
        <PanelLeft class="h-5 w-5" /><span class="sr-only">Toggle Menu</span>
      </Button>
    </SheetTrigger>
    <SheetContent side="left" class="flex h-full w-64 flex-col p-0">
      <nav class="flex h-full flex-col">
        <div class="flex items-center gap-2 border-b px-4 py-4">
          <LayoutLogo :site-name="siteName" :site-logo="siteLogo" />
        </div>
        <div class="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          <router-link
            to="/dashboard"
            :class="cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary', isActive('/dashboard') ? 'bg-muted text-primary' : 'text-muted-foreground')"
          >
            <LayoutDashboard class="h-4 w-4" /><span>首页</span>
          </router-link>
          <Accordion type="single" collapsible class="w-full" :default-value="activeAccordionValue">
            <AccordionItem v-for="(item, index) in menuStore.menuList" :key="item.path" :value="`item-${index}`" class="border-b-0">
              <AccordionTrigger class="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted/50 hover:text-primary hover:no-underline">
                <div class="flex items-center gap-3"><component :is="getIcon(item.meta?.icon)" class="h-4 w-4" />{{ item.meta?.title }}</div>
              </AccordionTrigger>
              <AccordionContent class="mt-1 space-y-1 pb-0 pl-4">
                <router-link
                  v-for="child in item.children"
                  :key="child.path"
                  :to="childPath(item.path, child.path)"
                  :class="cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary', isActive(childPath(item.path, child.path)) ? 'bg-muted text-primary' : 'text-muted-foreground')"
                >
                  <component :is="getIcon(child.meta?.icon)" class="h-4 w-4" />{{ child.meta?.title }}
                </router-link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div class="mt-auto shrink-0 border-t p-4">
          <LayoutUserMenu mobile @profile="emit('profile')" @logout="emit('logout')" />
        </div>
      </nav>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { Package2 } from 'lucide-vue-next'

defineProps<{ siteName: string; siteLogo: string; collapsed?: boolean; compact?: boolean }>()
</script>

<template>
  <router-link to="/" class="flex items-center gap-2">
    <template v-if="siteLogo">
      <img :src="siteLogo" :alt="siteName" class="h-8 max-w-[160px] object-contain" />
    </template>
    <template v-else>
      <div
        class="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
      >
        <Package2 class="h-4 w-4 transition-all group-hover:scale-110" />
      </div>
    </template>
    <span v-if="!collapsed" :class="compact ? 'font-semibold text-lg whitespace-nowrap' : 'font-semibold text-lg'">
      {{ siteName }}
    </span>
  </router-link>
</template>

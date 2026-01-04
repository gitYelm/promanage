<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ExternalLink } from 'lucide-vue-next'

type DocType = 'swagger' | 'redoc'
const docType = ref<DocType>('swagger')

const docUrl = computed(() => {
  const apiUrl = import.meta.env.VITE_API_URL || ''
  return docType.value === 'swagger' ? `${apiUrl}/api-docs` : `${apiUrl}/redoc`
})

function openInNewWindow() {
  window.open(docUrl.value, '_blank')
}
</script>

<template>
  <div class="flex flex-col" style="height: calc(100vh - 64px)">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b shrink-0">
      <div>
        <h2 class="text-xl font-bold tracking-tight">接口文档</h2>
        <p class="text-sm text-muted-foreground">API 接口文档，支持 Swagger 和 Redoc 两种风格</p>
      </div>
      <div class="flex items-center gap-3">
        <ToggleGroup v-model="docType" type="single" variant="outline">
          <ToggleGroupItem value="swagger">Swagger</ToggleGroupItem>
          <ToggleGroupItem value="redoc">Redoc</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="outline" size="sm" @click="openInNewWindow">
          <ExternalLink class="mr-2 h-4 w-4" />
          新窗口打开
        </Button>
      </div>
    </div>

    <!-- API Docs iframe -->
    <div class="flex-1 min-h-0">
      <iframe :src="docUrl" class="w-full h-full border-0" title="API 文档" />
    </div>
  </div>
</template>

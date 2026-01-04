<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Copy } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

const props = defineProps<{
  open: boolean
  code: string
}>()

const _emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const { toast } = useToast()

function copyCode() {
  navigator.clipboard.writeText(props.code)
  toast({
    title: '已复制',
    description: '代码已复制到剪贴板',
  })
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[800px]">
      <DialogHeader>
        <DialogTitle>生成代码</DialogTitle>
        <DialogDescription> 基于当前配置生成的 Vue 组件代码 </DialogDescription>
      </DialogHeader>
      <div class="relative">
        <div class="absolute right-2 top-2">
          <Button variant="outline" size="sm" @click="copyCode">
            <Copy class="mr-2 h-3 w-3" /> 复制
          </Button>
        </div>
        <pre class="bg-muted p-4 rounded-lg overflow-auto max-h-[60vh] text-xs font-mono">{{
          code
        }}</pre>
      </div>
    </DialogContent>
  </Dialog>
</template>

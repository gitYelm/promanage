<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Loader2 } from 'lucide-vue-next'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  importFile: File | null
  importLoading: boolean
  updateSupport: boolean
  importResult: { success: number; fail: number; errors: string[] } | null
}>()
const emit = defineEmits<{
  downloadTemplate: []
  fileChange: [event: Event]
  updateSupport: [value: boolean]
  confirm: []
}>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>导入用户</DialogTitle>
        <DialogDescription> 上传 Excel 文件批量导入用户数据 </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div class="text-sm"><p class="font-medium">下载导入模板</p><p class="text-muted-foreground">请先下载模板，按格式填写数据</p></div>
          <Button variant="outline" size="sm" @click="emit('downloadTemplate')"><Download class="mr-2 h-4 w-4" />下载模板</Button>
        </div>

        <div class="grid gap-2">
          <Label>选择文件</Label>
          <Input type="file" accept=".xlsx,.xls" @change="(event: Event) => emit('fileChange', event)" />
          <p v-if="props.importFile" class="text-sm text-muted-foreground">已选择: {{ props.importFile.name }}</p>
        </div>

        <div class="flex items-center space-x-2">
          <Checkbox id="updateSupport" :model-value="props.updateSupport" @update:model-value="(value) => emit('updateSupport', Boolean(value))" />
          <Label for="updateSupport" class="text-sm font-normal"> 更新已存在的用户数据 </Label>
        </div>

        <div v-if="props.importResult" class="p-4 border rounded-lg space-y-2">
          <div class="flex gap-4 text-sm">
            <span class="text-green-600">成功: {{ props.importResult.success }} 条</span>
            <span class="text-red-600">失败: {{ props.importResult.fail }} 条</span>
          </div>
          <div v-if="props.importResult.errors.length > 0" class="max-h-32 overflow-y-auto">
            <p v-for="(err, idx) in props.importResult.errors" :key="idx" class="text-sm text-red-600">{{ err }}</p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">关闭</Button>
        <Button :disabled="props.importLoading || !props.importFile" @click="emit('confirm')">
          <Loader2 v-if="props.importLoading" class="mr-2 h-4 w-4 animate-spin" />
          开始导入
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import RichTextEditor from '@/components/common/RichTextEditor.vue'
import { getStatusOptions } from '@/utils/options'
import type { NoticeForm } from '@/api/system/notice'
import type { UploadConfig } from '@/api/system/config'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  form: NoticeForm
  isEdit: boolean
  submitLoading: boolean
  uploadConfig: UploadConfig
}>()
const emit = defineEmits<{ close: []; submit: [] }>()
</script>

<template>
  <Dialog :open="open" @update:open="(val) => (val ? (open = true) : emit('close'))">
    <DialogContent
      class="grid max-h-[90vh] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 sm:max-w-[800px]"
      @escape-key-down.prevent="emit('close')"
      @pointer-down-outside.prevent="emit('close')"
    >
      <DialogHeader class="border-b bg-background px-6 py-4 pr-14">
        <DialogTitle>{{ props.isEdit ? '修改公告' : '新增公告' }}</DialogTitle>
        <DialogDescription> 请填写公告信息 </DialogDescription>
      </DialogHeader>

      <div class="min-h-0 overflow-y-auto overscroll-contain px-6 py-4">
        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="noticeTitle">公告标题 *</Label>
              <Input id="noticeTitle" v-model="props.form.noticeTitle" placeholder="请输入公告标题" />
            </div>
            <div class="grid gap-2">
              <Label for="noticeType">公告类型</Label>
              <Select v-model="props.form.noticeType">
                <SelectTrigger><SelectValue placeholder="选择类型" /></SelectTrigger>
                <SelectContent><SelectItem value="1">通知</SelectItem><SelectItem value="2">公告</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="status">状态</Label>
            <Select v-model="props.form.status">
              <SelectTrigger><SelectValue placeholder="选择状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in getStatusOptions('normalClose')" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-2">
            <Label for="noticeContent">内容 *</Label>
            <RichTextEditor
              v-model="props.form.noticeContent"
              placeholder="请输入公告内容..."
              :image-max-size="props.uploadConfig.editorImageMaxSize"
              :video-max-size="props.uploadConfig.editorVideoMaxSize"
            />
          </div>
        </div>
      </div>

      <DialogFooter class="border-t bg-background px-6 py-4">
        <Button variant="outline" @click="emit('close')">取消</Button>
        <Button :disabled="props.submitLoading" @click="emit('submit')"> 确定 </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

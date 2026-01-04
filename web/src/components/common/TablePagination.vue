<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  total: number
  pageNum: number
  pageSize: number
}

interface Emits {
  (e: 'update:pageNum', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 计算总页数
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

// 计算当前显示的记录范围
const startRecord = computed(() => {
  if (props.total === 0) return 0
  return (props.pageNum - 1) * props.pageSize + 1
})

const endRecord = computed(() => {
  const end = props.pageNum * props.pageSize
  return end > props.total ? props.total : end
})

// 切换页码
function handlePageChange(page: number) {
  if (page < 1 || page > totalPages.value || page === props.pageNum) return
  emit('update:pageNum', page)
  emit('change')
}

// 切换每页条数
function handlePageSizeChange(size: any) {
  if (!size) return
  const newSize = Number(size)
  emit('update:pageSize', newSize)
  emit('update:pageNum', 1) // 重置到第一页
  emit('change')
}

// 上一页
function handlePrevious() {
  handlePageChange(props.pageNum - 1)
}

// 下一页
function handleNext() {
  handlePageChange(props.pageNum + 1)
}
</script>

<template>
  <div class="flex items-center justify-between px-2 py-4">
    <!-- 左侧：显示记录范围和每页条数选择 -->
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <span>显示第 {{ startRecord }} - {{ endRecord }} 条，共 {{ total }} 条记录</span>
      <Select :model-value="String(pageSize)" @update:model-value="handlePageSizeChange">
        <SelectTrigger class="h-8 w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- 右侧：分页按钮 -->
    <div v-if="totalPages > 0" class="flex items-center gap-2">
      <Button variant="outline" size="sm" :disabled="pageNum === 1" @click="handlePrevious">
        上一页
      </Button>

      <span class="text-sm text-muted-foreground"> 第 {{ pageNum }}/{{ totalPages }} 页 </span>

      <Button variant="outline" size="sm" :disabled="pageNum === totalPages" @click="handleNext">
        下一页
      </Button>
    </div>
  </div>
</template>

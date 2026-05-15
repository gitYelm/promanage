<script setup lang="ts">
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listBugTickets } from '@/api/bug'
import type { BugTicket } from '@/api/bug/types'
import { BUG_STATUS_OPTIONS, optionLabel } from '../../shared/bug-options'

const props = defineProps<{
  currentTicketId?: string
}>()

const selectedId = defineModel<string>({ default: '' })
const keyword = ref('')
const loading = ref(false)
const options = ref<BugTicket[]>([])

async function search() {
  loading.value = true
  try {
    const res = await listBugTickets({ keyword: keyword.value, pageNum: 1, pageSize: 8 })
    options.value = res.rows.filter((item) => item.ticketId !== props.currentTicketId)
  } finally {
    loading.value = false
  }
}

function selectTicket(ticket: BugTicket) {
  selectedId.value = ticket.ticketId
  keyword.value = `${ticket.ticketNo} ${ticket.title}`
}
</script>

<template>
  <div class="space-y-2 rounded-md border p-3">
    <div class="text-sm font-medium">选择重复的原 Bug</div>
    <div class="flex gap-2">
      <Input v-model="keyword" placeholder="输入 Bug 编号或标题搜索" @keyup.enter="search" />
      <Button type="button" variant="outline" :disabled="loading" @click="search">
        {{ loading ? '搜索中' : '搜索' }}
      </Button>
    </div>
    <div v-if="selectedId" class="text-xs text-muted-foreground">已选择原 Bug ID：{{ selectedId }}</div>
    <div class="max-h-56 space-y-2 overflow-y-auto">
      <button
        v-for="item in options"
        :key="item.ticketId"
        type="button"
        class="w-full rounded-md border p-2 text-left text-sm transition hover:border-primary hover:bg-muted/40"
        :class="selectedId === item.ticketId ? 'border-primary bg-muted/50' : ''"
        @click="selectTicket(item)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="font-medium">{{ item.ticketNo }}</span>
          <Badge variant="outline">{{ optionLabel(BUG_STATUS_OPTIONS, item.status) }}</Badge>
        </div>
        <div class="mt-1 line-clamp-2 text-muted-foreground">{{ item.title }}</div>
      </button>
      <p v-if="!loading && keyword && !options.length" class="py-3 text-center text-sm text-muted-foreground">
        未找到匹配 Bug
      </p>
    </div>
  </div>
</template>

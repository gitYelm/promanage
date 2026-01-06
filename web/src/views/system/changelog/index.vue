<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sparkles,
  Bug,
  Palette,
  RefreshCw,
  Rocket,
  FileText,
  Wrench,
  GitCommit,
  ExternalLink,
  ChevronDown,
  Cloud,
  HardDrive,
} from 'lucide-vue-next'
import { getChangelog, type CommitInfo } from '@/api/system/changelog'
import { formatDate } from '@/utils/format'

const loading = ref(false)
const loadingMore = ref(false)
const commits = ref<CommitInfo[]>([])
const total = ref(0)
const source = ref<'github' | 'static'>('github')
const repoUrl = ref<string>('')
const page = ref(1)
const perPage = 30

type TypeConfigValue = {
  label: string
  icon: typeof Sparkles
  variant: 'default' | 'destructive' | 'secondary' | 'outline'
}

const defaultConfig: TypeConfigValue = { label: '其他', icon: GitCommit, variant: 'outline' }

const typeConfig: Record<string, TypeConfigValue> = {
  feat: { label: '新功能', icon: Sparkles, variant: 'default' },
  fix: { label: '修复', icon: Bug, variant: 'destructive' },
  style: { label: '样式', icon: Palette, variant: 'secondary' },
  refactor: { label: '重构', icon: RefreshCw, variant: 'outline' },
  perf: { label: '优化', icon: Rocket, variant: 'secondary' },
  docs: { label: '文档', icon: FileText, variant: 'outline' },
  chore: { label: '构建', icon: Wrench, variant: 'outline' },
  other: defaultConfig,
}

// 按日期分组
const groupedCommits = computed(() => {
  const groups: Record<string, CommitInfo[]> = {}
  commits.value.forEach((commit) => {
    const dateKey = formatDate(commit.date, 'YYYY-MM-DD')
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(commit)
  })
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
})

const hasMore = computed(() => commits.value.length < total.value)

async function fetchCommits(isLoadMore = false) {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const res = await getChangelog(page.value, perPage)
    if (isLoadMore) {
      commits.value.push(...res.rows)
    } else {
      commits.value = res.rows
    }
    total.value = res.total
    source.value = res.source
    if (res.repoUrl) {
      repoUrl.value = res.repoUrl
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  page.value++
  fetchCommits(true)
}

function getConfig(type: string): TypeConfigValue {
  return typeConfig[type] || defaultConfig
}

function openCommit(sha: string) {
  if (repoUrl.value) {
    window.open(`${repoUrl.value}/commit/${sha}`, '_blank')
  }
}

onMounted(() => {
  fetchCommits()
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">更新日志</h2>
        <p class="text-muted-foreground">查看项目的 Git 提交记录</p>
      </div>
      <Badge variant="outline" class="gap-1.5">
        <component :is="source === 'github' ? Cloud : HardDrive" class="h-3.5 w-3.5" />
        {{ source === 'github' ? 'GitHub API' : '静态数据' }}
      </Badge>
    </div>

    <!-- 加载骨架屏 -->
    <div v-if="loading" class="space-y-4">
      <Card v-for="i in 3" :key="i">
        <CardHeader>
          <Skeleton class="h-5 w-32" />
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-for="j in 3" :key="j" class="flex items-start gap-3">
            <Skeleton class="h-6 w-16 rounded-full" />
            <Skeleton class="h-4 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 提交记录列表 -->
    <div v-else class="space-y-4">
      <Card v-for="[date, dayCommits] in groupedCommits" :key="date">
        <CardHeader class="pb-3">
          <div class="flex items-center gap-2 text-sm font-medium">
            <GitCommit class="h-4 w-4 text-muted-foreground" />
            {{ date }}
            <Badge variant="secondary" class="ml-auto">{{ dayCommits.length }} 次提交</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul class="space-y-3">
            <li v-for="commit in dayCommits" :key="commit.sha" class="flex items-start gap-3 group">
              <Badge :variant="getConfig(commit.type).variant" class="shrink-0 mt-0.5">
                <component :is="getConfig(commit.type).icon" class="h-3 w-3 mr-1" />
                {{ getConfig(commit.type).label }}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <div class="flex-1 min-w-0 cursor-default">
                      <p class="text-sm truncate">{{ commit.message }}</p>
                      <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Avatar class="h-4 w-4">
                          <AvatarImage v-if="commit.authorAvatar" :src="commit.authorAvatar" />
                          <AvatarFallback class="text-[8px]">{{ commit.author[0] }}</AvatarFallback>
                        </Avatar>
                        <span>{{ commit.author }}</span>
                        <code
                          class="px-1.5 py-0.5 bg-muted rounded text-[10px] cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          @click.stop="openCommit(commit.sha)"
                        >
                          {{ commit.shortSha }}
                        </code>
                        <ExternalLink
                          class="h-3 w-3 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                          @click.stop="openCommit(commit.sha)"
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" class="max-w-md whitespace-pre-wrap">
                    {{ commit.fullMessage || commit.message }}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- 空状态 -->
      <div v-if="commits.length === 0" class="text-center py-12 text-muted-foreground">
        <GitCommit class="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>暂无提交记录</p>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="flex justify-center pt-4">
        <Button variant="outline" :disabled="loadingMore" @click="loadMore">
          <ChevronDown v-if="!loadingMore" class="h-4 w-4 mr-2" />
          <RefreshCw v-else class="h-4 w-4 mr-2 animate-spin" />
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </Button>
      </div>
    </div>
  </div>
</template>

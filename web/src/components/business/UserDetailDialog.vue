<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatDate } from '@/utils/format'
import { listLogininfor } from '@/api/monitor/logininfor'
import { listOperLog } from '@/api/monitor/operlog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SysUser, SysLoginLog, SysOperLog } from '@/api/system/types'

interface Props {
  open: boolean
  user: SysUser | null
}

const props = defineProps<Props>()

// 获取完整的头像URL
function getAvatarUrl(avatar: string | undefined | null): string {
  if (!avatar) return ''
  // 如果已经是完整URL,直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  // 如果是相对路径,拼接后端地址
  return `${import.meta.env.VITE_API_URL}${avatar}`
}
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const dialogOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// 登录历史数据
const loginLogs = ref<SysLoginLog[]>([])
const loadingLogs = ref(false)

// 操作日志数据
const operLogs = ref<SysOperLog[]>([])
const loadingOperLogs = ref(false)

// 获取业务类型文本
function getBusinessTypeText(type: number | undefined): string {
  const map: Record<number, string> = {
    0: '其它',
    1: '新增',
    2: '修改',
    3: '删除',
    4: '授权',
    5: '导出',
    6: '导入',
    7: '强退',
    8: '清空'
  }
  return map[type ?? 0] || '未知'
}

// 监听用户变化,加载登录历史和操作日志
watch(() => props.user, async (newUser) => {
  if (newUser && newUser.userName) {
    // 加载登录历史
    loadingLogs.value = true
    try {
      const res = await listLogininfor({
        userName: newUser.userName,
        pageNum: 1,
        pageSize: 20
      })
      loginLogs.value = res.rows || []
    } catch (error) {
      console.error('加载登录历史失败:', error)
      loginLogs.value = []
    } finally {
      loadingLogs.value = false
    }

    // 加载操作日志 (查询URL中包含该用户ID的操作)
    loadingOperLogs.value = true
    try {
      const res = await listOperLog({
        pageNum: 1,
        pageSize: 50 // 增加查询数量
      })
      // 过滤出与该用户相关的操作 (URL中包含用户ID或用户名)
      const userId = newUser.userId?.toString()
      const userName = newUser.userName
      
      operLogs.value = (res.rows || []).filter((log: SysOperLog) => {
        const url = log.operUrl || ''
        const param = log.operParam || ''
        
        // 检查URL或参数中是否包含用户ID或用户名
        return url.includes(`/system/user/${userId}`) ||
               url.includes(`user/${userId}`) ||
               param.includes(`"userId":"${userId}"`) ||
               param.includes(`userId=${userId}`) ||
               param.includes(`"userName":"${userName}"`) ||
               param.includes(`userName=${userName}`)
      })
      
    } catch {
      // 加载操作日志失败，静默处理
      operLogs.value = []
    } finally {
      loadingOperLogs.value = false
    }
  } else {
    loginLogs.value = []
    operLogs.value = []
  }
}, { immediate: true })
</script>

<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="sm:max-w-[800px] max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>用户详情</DialogTitle>
        <DialogDescription>查看用户的详细信息、登录历史和操作记录</DialogDescription>
      </DialogHeader>

      <Tabs default-value="basic" class="w-full">
        <TabsList class="grid w-full grid-cols-4">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="permissions">权限信息</TabsTrigger>
          <TabsTrigger value="operlog">操作日志</TabsTrigger>
          <TabsTrigger value="loginlog">登录历史</TabsTrigger>
        </TabsList>

        <!-- 基本信息 -->
        <TabsContent value="basic" class="space-y-4">
          <div class="flex items-start gap-6 p-4 border rounded-lg">
            <Avatar class="h-24 w-24">
              <AvatarImage :src="getAvatarUrl(user?.avatar)" />
              <AvatarFallback>{{ user?.nickName?.charAt(0) || 'U' }}</AvatarFallback>
            </Avatar>
            <div class="flex-1 space-y-3">
              <div class="flex items-center gap-3">
                <h3 class="text-xl font-semibold">{{ user?.nickName }}</h3>
                <Badge :variant="user?.status === '0' ? 'default' : 'destructive'">
                  {{ user?.status === '0' ? '正常' : '停用' }}
                </Badge>
              </div>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-muted-foreground">用户名:</span>
                  <span class="ml-2">{{ user?.userName }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">部门:</span>
                  <span class="ml-2">{{ user?.dept?.deptName || '-' }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">手机号:</span>
                  <span class="ml-2">{{ user?.phonenumber || '-' }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">邮箱:</span>
                  <span class="ml-2">{{ user?.email || '-' }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">性别:</span>
                  <span class="ml-2">
                    {{ user?.sex === '0' ? '男' : user?.sex === '1' ? '女' : '未知' }}
                  </span>
                </div>
                <div>
                  <span class="text-muted-foreground">创建时间:</span>
                  <span class="ml-2">{{ formatDate(user?.createTime) }}</span>
                </div>
              </div>
              <div v-if="user?.remark" class="text-sm">
                <span class="text-muted-foreground">备注:</span>
                <span class="ml-2">{{ user.remark }}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- 权限信息 -->
        <TabsContent value="permissions" class="space-y-4">
          <div class="p-4 border rounded-lg space-y-4">
            <div>
              <h4 class="font-semibold mb-2">角色信息</h4>
              <div class="flex flex-wrap gap-2">
                <Badge
                  v-for="role in user?.roles"
                  :key="role.roleId"
                  variant="secondary"
                >
                  {{ role.roleName }}
                </Badge>
                <span v-if="!user?.roles || user.roles.length === 0" class="text-sm text-muted-foreground">
                  暂无角色
                </span>
              </div>
            </div>
            
            <div>
              <h4 class="font-semibold mb-2">数据权限</h4>
              <div class="text-sm text-muted-foreground">
                <p v-for="role in user?.roles" :key="role.roleId" class="py-1">
                  {{ role.roleName }}:
                  <span class="ml-2">
                    {{
                      role.dataScope === '1' ? '全部数据权限' :
                      role.dataScope === '2' ? '自定义数据权限' :
                      role.dataScope === '3' ? '本部门数据权限' :
                      role.dataScope === '4' ? '本部门及以下数据权限' :
                      '仅本人数据权限'
                    }}
                  </span>
                </p>
                <p v-if="!user?.roles || user.roles.length === 0">暂无数据权限</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- 操作日志 -->
        <TabsContent value="operlog">
          <ScrollArea class="h-[400px] rounded-md border">
            <div v-if="loadingOperLogs" class="p-8 text-center text-muted-foreground">
              加载中...
            </div>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>操作模块</TableHead>
                  <TableHead>操作类型</TableHead>
                  <TableHead>操作人员</TableHead>
                  <TableHead>操作时间</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="log in operLogs" :key="log.operId">
                  <TableCell>{{ log.title }}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {{ getBusinessTypeText(log.businessType) }}
                    </Badge>
                  </TableCell>
                  <TableCell>{{ log.operName }}</TableCell>
                  <TableCell>{{ formatDate(log.operTime) }}</TableCell>
                  <TableCell>
                    <Badge :variant="log.status === 0 ? 'default' : 'destructive'">
                      {{ log.status === 0 ? '成功' : '失败' }}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow v-if="operLogs.length === 0">
                  <TableCell colspan="5" class="text-center text-muted-foreground">
                    暂无操作日志
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <!-- 登录历史 -->
        <TabsContent value="loginlog">
          <ScrollArea class="h-[400px] rounded-md border">
            <div v-if="loadingLogs" class="p-8 text-center text-muted-foreground">
              加载中...
            </div>
            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>登录IP</TableHead>
                  <TableHead>登录地点</TableHead>
                  <TableHead>浏览器</TableHead>
                  <TableHead>操作系统</TableHead>
                  <TableHead>登录时间</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="log in loginLogs" :key="log.infoId">
                  <TableCell>{{ log.ipaddr }}</TableCell>
                  <TableCell>{{ log.loginLocation || '-' }}</TableCell>
                  <TableCell>{{ log.browser || '-' }}</TableCell>
                  <TableCell>{{ log.os || '-' }}</TableCell>
                  <TableCell>{{ formatDate(log.loginTime) }}</TableCell>
                  <TableCell>
                    <Badge :variant="log.status === '0' ? 'default' : 'destructive'">
                      {{ log.status === '0' ? '成功' : '失败' }}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow v-if="loginLogs.length === 0">
                  <TableCell colspan="6" class="text-center text-muted-foreground">
                    暂无登录历史
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>

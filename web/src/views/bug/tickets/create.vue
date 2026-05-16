<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast/use-toast'
import { addBugTicket, bugProjectOptions, listBugModules, listBugVersions } from '@/api/bug'
import { dispatchBugPendingCountRefresh } from '../shared/bug-events'
import type { BugAttachment, BugModule, BugProject, BugVersion } from '@/api/bug/types'
import { BUG_ENVIRONMENT_OPTIONS, BUG_PRIORITY_OPTIONS, BUG_SEVERITY_OPTIONS, BUG_TYPE_OPTIONS, NONE_OPTION_VALUE, normalizeOptional } from '../shared/bug-options'
import AttachmentUploader from './components/AttachmentUploader.vue'

const router = useRouter()
const { toast } = useToast()
const projects = ref<BugProject[]>([])
const modules = ref<BugModule[]>([])
const versions = ref<BugVersion[]>([])
const attachments = ref<BugAttachment[]>([])
const submitLoading = ref(false)
const attachmentUploading = ref(false)

const form = reactive({
  title: '',
  projectId: '',
  moduleId: '',
  versionId: '',
  type: 'function',
  severity: 'major',
  priority: 'medium',
  description: '',
  reproduceSteps: '',
  expectedResult: '',
  actualResult: '',
  environment: 'testing',
  deviceInfo: navigator.userAgent,
})

const canSubmit = computed(() => Boolean(form.title.trim()))

async function loadBase() {
  projects.value = await bugProjectOptions()
  if (!form.projectId && projects.value[0]) {
    form.projectId = projects.value[0].projectId
    await loadProjectData()
  }
}

async function loadProjectData() {
  if (!form.projectId) return
  const [moduleRes, versionRes] = await Promise.all([
    listBugModules({ projectId: form.projectId, pageNum: 1, pageSize: 100 }),
    listBugVersions({ projectId: form.projectId, pageNum: 1, pageSize: 100 }),
  ])
  modules.value = moduleRes.rows.filter((item) => item.status !== '1')
  versions.value = versionRes.rows.filter((item) => item.status !== 'archived')
  form.moduleId = NONE_OPTION_VALUE
  form.versionId = versions.value[0]?.versionId || NONE_OPTION_VALUE
}

async function submit() {
  if (!canSubmit.value) {
    toast({ title: '验证失败', description: '请填写标题', variant: 'destructive' })
    return
  }
  submitLoading.value = true
  try {
    await addBugTicket({
      ...form,
      projectId: normalizeOptional(form.projectId),
      moduleId: normalizeOptional(form.moduleId),
      versionId: normalizeOptional(form.versionId),
      attachmentIds: attachments.value.map((item) => item.attachmentId),
    })
    dispatchBugPendingCountRefresh()
    toast({ title: '提交成功', description: 'Bug 已进入待确认流程' })
    router.push('/bug/tickets')
  } finally {
    submitLoading.value = false
  }
}

onMounted(loadBase)
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <div>
      <h2 class="text-2xl font-bold">提交缺陷</h2>
      <p class="text-muted-foreground">只需填写标题即可提交；可补充项目、模块、复现步骤、截图、日志或录屏，截图支持上传前标注。</p>
    </div>
    <div class="grid gap-6 xl:grid-cols-[minmax(22rem,0.85fr)_minmax(34rem,1.15fr)]">
      <section class="grid gap-4 rounded-lg border bg-background p-4 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2"><Label>标题 *</Label><Input v-model="form.title" placeholder="一句话描述问题" /></div>
        <div class="space-y-2"><Label>项目</Label><Select v-model="form.projectId" @update:model-value="loadProjectData"><SelectTrigger><SelectValue placeholder="请选择项目" /></SelectTrigger><SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId">{{ p.projectName }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-2"><Label>模块</Label><Select v-model="form.moduleId"><SelectTrigger><SelectValue placeholder="请选择模块" /></SelectTrigger><SelectContent><SelectItem :value="NONE_OPTION_VALUE">暂不选择</SelectItem><SelectItem v-for="m in modules" :key="m.moduleId" :value="m.moduleId">{{ m.moduleName }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-2"><Label>版本</Label><Select v-model="form.versionId"><SelectTrigger><SelectValue placeholder="请选择版本" /></SelectTrigger><SelectContent><SelectItem :value="NONE_OPTION_VALUE">暂不选择</SelectItem><SelectItem v-for="v in versions" :key="v.versionId" :value="v.versionId">{{ v.versionNo }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-2"><Label>运行环境</Label><Select v-model="form.environment"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_ENVIRONMENT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-2"><Label>类型</Label><Select v-model="form.type"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-2"><Label>严重程度</Label><Select v-model="form.severity"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_SEVERITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-2"><Label>优先级</Label><Select v-model="form.priority"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_PRIORITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-2 md:col-span-2"><Label>问题描述</Label><Textarea v-model="form.description" rows="4" placeholder="说明问题现象、影响范围和发生频率" /></div>
        <div class="space-y-2 md:col-span-2"><Label>复现步骤</Label><Textarea v-model="form.reproduceSteps" rows="4" placeholder="1. 打开...&#10;2. 点击...&#10;3. 出现..." /></div>
        <div class="space-y-2"><Label>期望结果</Label><Textarea v-model="form.expectedResult" rows="3" /></div>
        <div class="space-y-2"><Label>实际结果</Label><Textarea v-model="form.actualResult" rows="3" /></div>
        <div class="space-y-2 md:col-span-2"><Label>设备信息</Label><Textarea v-model="form.deviceInfo" rows="2" /></div>
      </section>
      <aside class="rounded-lg border bg-background p-4 xl:sticky xl:top-4 xl:self-start">
        <AttachmentUploader v-model="attachments" @uploading-change="attachmentUploading = $event" />
      </aside>
    </div>
    <div class="flex justify-end gap-2"><Button variant="outline" @click="router.back()">取消</Button><Button :disabled="submitLoading || attachmentUploading" @click="submit">提交</Button></div>
  </div>
</template>

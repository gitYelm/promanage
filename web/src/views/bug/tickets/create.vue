<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FormFieldBlock from '@/components/common/FormFieldBlock.vue'
import ProjectSelectOption from '@/components/common/ProjectSelectOption.vue'
import ProjectSelectValue from '@/components/common/ProjectSelectValue.vue'
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
        <FormFieldBlock label="标题" field-id="bug-create-title" required class="md:col-span-2" description="用一句话描述问题现象，是最少必填信息。"><Input id="bug-create-title" v-model="form.title" placeholder="例如：新增需求弹窗保存失败" /></FormFieldBlock>
        <FormFieldBlock label="项目" field-id="bug-create-project" description="决定 Bug 归属、模块和版本候选范围。"><Select v-model="form.projectId" @update:model-value="loadProjectData"><SelectTrigger id="bug-create-project"><ProjectSelectValue :model-value="form.projectId" :projects="projects" placeholder="请选择项目" /></SelectTrigger><SelectContent><SelectItem v-for="p in projects" :key="p.projectId" :value="p.projectId"><ProjectSelectOption :name="p.projectName" :code="p.projectKey" :stage="p.projectStage" :owner-name="p.owner?.nickName || p.owner?.userName" /></SelectItem></SelectContent></Select></FormFieldBlock>
        <FormFieldBlock label="模块" field-id="bug-create-module" optional description="用于定位功能范围；暂不选择时不会按模块自动带默认处理人。"><Select v-model="form.moduleId"><SelectTrigger id="bug-create-module"><SelectValue placeholder="请选择模块" /></SelectTrigger><SelectContent><SelectItem :value="NONE_OPTION_VALUE">暂不选择模块</SelectItem><SelectItem v-for="m in modules" :key="m.moduleId" :value="m.moduleId">{{ m.moduleName }}</SelectItem></SelectContent></Select></FormFieldBlock>
        <FormFieldBlock label="版本" field-id="bug-create-version" optional description="用于记录问题出现或修复的版本；暂不选择时后续可补充。"><Select v-model="form.versionId"><SelectTrigger id="bug-create-version"><SelectValue placeholder="请选择版本" /></SelectTrigger><SelectContent><SelectItem :value="NONE_OPTION_VALUE">暂不选择版本</SelectItem><SelectItem v-for="v in versions" :key="v.versionId" :value="v.versionId">{{ v.versionNo }}</SelectItem></SelectContent></Select></FormFieldBlock>
        <FormFieldBlock label="运行环境" field-id="bug-create-environment" description="说明问题出现在哪类环境，便于复现和定位。"><Select v-model="form.environment"><SelectTrigger id="bug-create-environment"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_ENVIRONMENT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select></FormFieldBlock>
        <FormFieldBlock label="类型" field-id="bug-create-type" description="用于统计缺陷来源和分类处理。"><Select v-model="form.type"><SelectTrigger id="bug-create-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select></FormFieldBlock>
        <FormFieldBlock label="严重程度" field-id="bug-create-severity" description="表示对业务和用户的影响程度。"><Select v-model="form.severity"><SelectTrigger id="bug-create-severity"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_SEVERITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select></FormFieldBlock>
        <FormFieldBlock label="优先级" field-id="bug-create-priority" description="表示建议排期顺序，高优先级需要优先关注。"><Select v-model="form.priority"><SelectTrigger id="bug-create-priority"><SelectValue /></SelectTrigger><SelectContent><SelectItem v-for="o in BUG_PRIORITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem></SelectContent></Select></FormFieldBlock>
        <FormFieldBlock label="问题描述" field-id="bug-create-description" optional class="md:col-span-2" description="说明问题现象、影响范围和发生频率。"><Textarea id="bug-create-description" v-model="form.description" rows="4" placeholder="说明问题现象、影响范围和发生频率" /></FormFieldBlock>
        <FormFieldBlock label="复现步骤" field-id="bug-create-steps" optional class="md:col-span-2" description="按步骤描述如何稳定复现，便于开发和测试验证。"><Textarea id="bug-create-steps" v-model="form.reproduceSteps" rows="4" placeholder="1. 打开...&#10;2. 点击...&#10;3. 出现..." /></FormFieldBlock>
        <FormFieldBlock label="期望结果" field-id="bug-create-expected" optional description="描述正确情况下用户应该看到或得到的结果。"><Textarea id="bug-create-expected" v-model="form.expectedResult" rows="3" placeholder="例如：保存成功并刷新列表" /></FormFieldBlock>
        <FormFieldBlock label="实际结果" field-id="bug-create-actual" optional description="描述当前真实发生的错误结果，用于和期望结果对比。"><Textarea id="bug-create-actual" v-model="form.actualResult" rows="3" placeholder="例如：弹窗未关闭且数据未保存" /></FormFieldBlock>
        <FormFieldBlock label="设备信息" field-id="bug-create-device" optional class="md:col-span-2" description="记录浏览器、系统、设备或网络信息，便于排查环境相关问题。"><Textarea id="bug-create-device" v-model="form.deviceInfo" rows="2" /></FormFieldBlock>
      </section>
      <aside class="rounded-lg border bg-background p-4 xl:sticky xl:top-4 xl:self-start">
        <AttachmentUploader v-model="attachments" @uploading-change="attachmentUploading = $event" />
      </aside>
    </div>
    <div class="flex justify-end gap-2"><Button variant="outline" @click="router.back()">取消</Button><Button permission="bug:ticket:add" :disabled="submitLoading || attachmentUploading" @click="submit">提交</Button></div>
  </div>
</template>

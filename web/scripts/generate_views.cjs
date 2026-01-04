const fs = require('fs')
const path = require('path')

const views = [
  { path: 'src/views/system/dict/index.vue', title: '字典管理' },
  { path: 'src/views/system/config/index.vue', title: '参数管理' },
  { path: 'src/views/system/notice/index.vue', title: '通知公告' },
  { path: 'src/views/monitor/operlog/index.vue', title: '操作日志' },
  { path: 'src/views/monitor/logininfor/index.vue', title: '登录日志' },
  { path: 'src/views/monitor/online/index.vue', title: '在线用户' },
  { path: 'src/views/monitor/server/index.vue', title: '服务监控' },
  { path: 'src/views/monitor/cache/index.vue', title: '缓存监控' },
  { path: 'src/views/monitor/druid/index.vue', title: '连接池监控' },
  { path: 'src/views/monitor/job/index.vue', title: '定时任务' },
  { path: 'src/views/tool/gen/index.vue', title: '代码生成' },
  { path: 'src/views/tool/build/index.vue', title: '表单构建' },
  { path: 'src/views/tool/swagger/index.vue', title: '系统接口' },
]

const template = (title) => `<script setup lang="ts">
import ConstructionPlaceholder from '@/components/ConstructionPlaceholder.vue'
</script>

<template>
  <ConstructionPlaceholder title="${title}" />
</template>
`

views.forEach((view) => {
  const fullPath = path.join(process.cwd(), view.path)
  fs.writeFileSync(fullPath, template(view.title))
  console.log(`Created ${view.path}`)
})

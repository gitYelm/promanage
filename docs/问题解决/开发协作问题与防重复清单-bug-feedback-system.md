# 开发协作问题与防重复清单 - bug-feedback-system

最后更新时间：2026-05-15

## 当前项目事实

- 项目路径：`/Volumes/data/fzl/pro/bug-feedback-system`
- 前端：Vue 3.5 + Vite 7 + TypeScript + shadcn-vue + Pinia
- 后端：NestJS 11 + Prisma 7 + PostgreSQL + Redis
- 权限：已有 RBAC、动态菜单、按钮权限、`@RequirePermission`
- 上传：已有 `StorageService` 和 `/api/upload/*`，支持本地/对象存储

## 已确认产品方向

- 内部团队使用
- 支持多个项目
- 后台登录后提交 Bug
- 支持截图、日志、录屏附件
- 截图需要在线标注：画框、箭头、线条、编号、文字
- 第一版启用站内通知，但只通知下一步处理人；tester 提交后通知 reviewer/负责人，不通知 developer
- 流程完整：tester 提交 → reviewer 确认/驳回 → reviewer 分派 developer → developer 修复 → tester 验证/关闭

## 防重复规则

1. 开发前先读：`docs/项目管理/需求分析.md`、`docs/项目管理/角色权限设计.md`、`docs/架构文档/业务流程图.md`。
2. 不能跳过项目既有错误总结：重点遵循 `docs/前端/组件问题修复汇总.md`、`docs/开发规范/错误处理规范.md`、`docs/开发规范/时间处理规范.md`。
3. 新代码必须模块化，任何自有代码文件接近 450 行必须拆分。
4. 后端 Service 禁止 `throw new Error()` 和 `console.log`，必须使用 `BusinessException` / `LoggerService`。
5. 新接口必须加 Swagger、JWT、PermissionGuard、权限标识。
6. 前端按钮权限必须使用 `v-hasPermi`，后端仍需做权限校验。
7. 状态流转必须集中管理，不允许页面直接写状态字段绕过流程。
8. 数据库必须新建独立库或独立 schema，避免污染已有本地数据。
9. Redis 必须使用独立 DB 或键前缀，避免污染已有缓存。
10. 附件上传必须校验类型、大小和内容，图片标注优先在浏览器本地完成后再上传。

## 写入前检查

- 写入 `.ts`、`.vue` 前先执行 `wc -l` 查看目标文件行数。
- 修改 Prisma schema 前先检查现有关系、索引、命名风格。
- 修改种子数据前先确认幂等写法，不直接盲目插入。
- 修改前端页面前先确认是否已有通用组件可复用。

## 写入后验收

- 检查文件行数不超过 500 行。
- 检查权限标识、菜单路径、前端组件路径一致。
- 检查新 DTO 有校验和中文说明。
- 检查无敏感信息输出到日志或前端。
- 不执行 build/install/打包；如需验证，列出用户可执行命令。

## 附件上传与截图标注防重复规则

### 现象

- 截图标注后点击“保存并上传”，弹窗关闭不稳定或用户感觉无法关闭。
- 点击右上角关闭按钮无响应或关闭后又弹出。
- 附件上传完成后页面没有直观展示已上传图片/附件。
- 上传一个附件后，不能继续选择并上传新附件。

### 根因

1. 上传、标注弹窗、文件 input 重置、附件列表展示逻辑混在提交页中，状态耦合过高。
2. 图片保存时如果等待上传完成后才关闭弹窗，会让用户误以为“保存后卡住、关不掉”。
3. 文件 input 没有在选择后和上传后都重置时，浏览器会吞掉同一个文件的二次选择事件。
4. 上传返回值没有立即进入前端 `attachments` 响应式列表时，用户看不到“已上传”的任何反馈。
5. `FormData` 上传不应手写 `Content-Type: multipart/form-data`；应让浏览器自动附带 boundary，否则部分环境后端无法解析文件。

### 防重复规则

- Bug 附件上传必须集中在独立组件中维护：选择文件、队列、标注窗口、上传状态、已上传列表、移除操作。
- 图片点击“保存并上传”后应立即关闭标注窗口，并在后台继续上传，避免弹窗长时间阻塞；默认只上传标注图，原图必须由用户显式勾选保留。
- 文件选择后、上传成功/失败后都必须重置 file input，保证可以继续上传同一个或新的附件。
- 上传成功后必须立刻把后端返回的附件记录追加到响应式附件列表，并展示缩略图/视频预览/文件入口。
- `FormData` 请求不要手写 multipart `Content-Type`，由浏览器/axios 自动生成 boundary；上传超时判断应识别 `config.data instanceof FormData`。

### 写入前检查

- 修改附件组件前检查：
  - `web/src/views/bug/tickets/components/AttachmentUploader.vue`
  - `web/src/views/bug/tickets/components/AttachmentList.vue`
  - `web/src/views/bug/tickets/components/ImageAnnotator.vue`
  - `web/src/views/bug/tickets/create.vue`
  - `web/src/api/bug/index.ts`
  - `web/src/utils/request.ts`
- 所有 `.vue` / `.ts` 自有代码写入前必须先 `wc -l`，接近 450 行先拆分。

### 写入后验收

- `vue-tsc --noEmit` 必须通过。
- Vite 能编译 `create.vue`、`AttachmentUploader.vue`、`ImageAnnotator.vue`。
- 页面附件区初始显示“还没有上传附件”。
- 非图片上传成功后显示文件卡片，且可继续选择附件。
- 图片保存标注后弹窗立即关闭，默认只显示标注图卡片；只有勾选“同时保留原图”时才额外显示原图卡片。
- 右上角 `×` 和遮罩点击只负责取消本轮图片标注，并清空待处理图片队列，不能关闭后马上又弹出。

### 相关文件路径

- `web/src/views/bug/tickets/create.vue`
- `web/src/views/bug/tickets/components/AttachmentUploader.vue`
- `web/src/views/bug/tickets/components/AttachmentList.vue`
- `web/src/views/bug/tickets/components/ImageAnnotator.vue`
- `web/src/api/bug/index.ts`
- `web/src/utils/request.ts`

## 附件浏览器预览防重复规则

### 现象

- 用户上传附件后，需要在 Bug 提交面板内直接看清截图、标注图、日志或录屏信息。
- 只显示附件文字链接、只显示单个卡片，或上传后看不到已上传附件，都会影响开发人员快速定位问题。
- 多附件场景需要缩略图列表、主预览区和全屏预览协同工作。

### 根因

1. 附件上传和附件浏览如果没有拆成独立组件，后续容易因为提交表单调整而丢失预览能力。
2. 只把附件当作链接列表渲染，无法满足标注图“直接看清问题点”的核心诉求。
3. 提交页和详情页如果使用两套附件展示逻辑，会出现一处支持缩略图、另一处退化成文字链接的问题。

### 防重复规则

- 附件展示统一复用 `AttachmentList.vue`，不要在提交页或详情弹窗内重新手写附件链接列表。
- `AttachmentList.vue` 必须保持“主预览 + 缩略图列表 + 全屏预览”的结构。
- 提交页附件上传入口不要使用浏览器原生文件选择按钮；应隐藏原生 input，并通过附件列表末尾的加号卡片触发上传。
- 提交页附件缩略图列表应横向排列，最后一个同尺寸虚线加号卡片用于继续添加附件。
- 附件缩略图列表只允许一个方向滚动：横排列表只能左右滑动并禁用上下滚动；竖排列表只能上下滑动并禁用左右滚动。
- 缩略图点击必须切换主预览；主预览左右按钮必须支持循环切换；主预览点击必须打开全屏预览。
- 全屏预览必须支持右上角关闭、遮罩点击关闭、`Esc` 关闭，以及左右方向键切换多附件。
- 图片用缩略图和大图直观看图；视频用播放器；其他文件保留打开原文件入口。
- Bug 提交表单只允许“标题”作为用户必填项；项目、模块、版本、问题描述、复现步骤、期望结果、实际结果均不可在前端必填。
- 后端创建 Bug 时标题必须非空；项目为空时由服务端自动使用当前用户可见的第一个启用项目，不能因为前端未传项目导致 500 或数据库约束错误。

### 写入前检查

- 修改附件浏览器前检查：
  - `web/src/views/bug/tickets/components/AttachmentList.vue`
  - `web/src/views/bug/tickets/components/AttachmentPreviewPanel.vue`
  - `web/src/views/bug/tickets/components/AttachmentThumbnailList.vue`
  - `web/src/views/bug/tickets/components/AttachmentFullscreenPreview.vue`
  - `web/src/views/bug/tickets/components/attachment-utils.ts`
- 所有 `.vue` / `.ts` 自有代码写入前必须先 `wc -l`，接近 450 行先拆分。

### 写入后验收

- `vue-tsc --noEmit` 必须通过。
- Vite 能编译附件浏览器组件和 `create.vue`。
- 提交页右侧附件区在桌面端应大于表单侧的视觉权重，并 sticky 展示。
- 提交页不应出现独立的原生“选择文件”按钮，上传入口应在横排附件列表末尾。
- 上传多个附件后，缩略图列表可滚动，点击缩略图能切换主预览。
- 点击主预览能打开全屏；全屏状态下 `Esc`、遮罩、右上角 `×` 都能关闭。

### 相关文件路径

- `web/src/views/bug/tickets/components/AttachmentList.vue`
- `web/src/views/bug/tickets/components/AttachmentPreviewPanel.vue`
- `web/src/views/bug/tickets/components/AttachmentThumbnailList.vue`
- `web/src/views/bug/tickets/components/AttachmentFullscreenPreview.vue`
- `web/src/views/bug/tickets/components/attachment-utils.ts`

## Bug 流程与快捷操作防重复规则

### 现象

- 已确认新逻辑：tester 提交 Bug 后先进入 reviewer/负责人审核池，developer 在分派前不应看到也不应收到通知。
- 旧规则“Bug 可以不指派负责人、开发可直接开始修复”已废弃，避免绕过审核与分派。
- 所有状态操作说明当前仍为选填，不能因为未填说明阻塞状态流转；但修复/验证说明业务上建议填写。
- 列表页需要直接展示服务端计算出的常用状态快捷操作，不能只在详情弹窗里操作。
- “我的 Bug”菜单右侧需要显示当前待处理 Bug 数量。

### 防重复规则

- 状态流转仍必须集中在 `server-nestjs/src/bug/constants/bug-workflow.config.ts` 和 `BugTicketService.action`，页面不得直接写状态字段。
- `start_fix` 只能从 `assigned` 进入 `fixing`，`submit_verify` 只能由被分派的开发人员执行。
- `confirmed` / `reopened` 必须先由 reviewer/项目负责人/产品负责人执行 `assign`，再通知指定 developer 处理。
- tester 提交 Bug 的 `notifyCreated` 只通知 owner/product/reviewer，禁止通知 developer、模块默认负责人或项目全部成员。
- Bug 数据范围必须区分角色：reviewer/owner/product 可看项目审核池；developer 只能看分派给自己或自己参与评论的 Bug；tester/submitter 看本人相关。
- Bug 列表、详情、统计、项目驾驶舱都必须复用服务端数据范围，不能只在列表页过滤。
- Bug 列表行应携带按当前用户和当前工单计算的 `availableActions`，列表快捷按钮复用服务端结果。
- 快捷操作组件应独立维护，避免把列表页继续堆成长文件。
- “我的 Bug”待处理数量通过后端 `pending-count` 接口获取；提交或状态变更后通过前端事件刷新徽标。
- 标记重复不要让用户手动填写重复 Bug ID；必须提供编号/标题搜索选择器，并在确认前校验已选择原 Bug。

### 写入后验收

- `server-nestjs` 的 `tsc --noEmit` 必须通过。
- `web` 的 `vue-tsc --noEmit` 必须通过。
- Vite 能编译 `BugQuickActions.vue`、`DynamicMenu.vue`、Bug 列表页和提交页。

### 相关文件路径

- `server-nestjs/src/bug/constants/bug-workflow.config.ts`
- `server-nestjs/src/bug/bug-access.service.ts`
- `server-nestjs/src/bug/ticket/bug-ticket.service.ts`
- `server-nestjs/src/bug/ticket/bug-ticket.controller.ts`
- `web/src/views/bug/tickets/index.vue`
- `web/src/views/bug/tickets/components/BugQuickActions.vue`
- `web/src/views/bug/tickets/components/DuplicateBugSelector.vue`
- `web/src/components/DynamicMenu.vue`
- `web/src/views/bug/shared/bug-events.ts`

## 表格/列表刷新按钮规范迁移说明

页面级“刷新当前数据”已经沉淀为全局项目开发规范，不再作为单次防重复章节维护。

正式规范路径：`docs/开发规范/前端页面交互与视觉规范.md#3-页面级刷新按钮规范`

以后新增或改造表格、列表、看板和统计数据页时，按上述开发规范执行；本问题解决文档只保留具体问题现象、根因和排障经验。

## Prisma P2022 与数据库漂移防重复规则

### 现象

- Bug 列表、项目选项、项目管理相关接口返回 500。
- 后端错误码为 `PrismaClientKnownRequestError P2022`。
- 报错 SQL 位置可能出现在 `this.prisma.bugTicket.findMany()`、`this.prisma.bugProject.findMany()` 等查询。
- PostgreSQL 原始错误可能为：
  - `column bug_ticket.requirement_id does not exist`
  - `column bug_project.project_stage does not exist`

### 根因

1. `server-nestjs/prisma/schema.prisma` 已包含项目管理字段/表，例如 `BugProject.projectStage`、`BugTicket.requirementId`、`ProjectIteration`、`ProjectMilestone`、`ProjectRequirement`。
2. Prisma Client 会按当前 schema 查询 `bug_project.project_stage`、`bug_ticket.requirement_id` 等真实数据库列。
3. 当前数据库真实表结构没有完整同步 `20260515000100_add_project_management` 迁移，导致 Prisma 查询时报 P2022。
4. 这属于数据库迁移未执行、执行到一半，或 `_prisma_migrations` 记录与真实表结构不一致的数据库漂移问题；如果连续出现不同缺列，说明不是单个字段问题，而是整段迁移未完整落地。

### 错误决策链路

- 不能通过删除 `ticketInclude()` 里的 `requirement`、`iteration`、`milestone` 临时绕过。
- 不能通过删除 `BugProject` 查询里的项目阶段、计划时间、风险字段临时绕过。
- 不能通过移除 DTO 查询字段绕过。
- 不能只改前端列表字段隐藏问题。
- 正确方向是补齐数据库表结构，并确保后续环境迁移一致。

### 防重复规则

- Prisma schema 新增字段后，必须同时提交对应迁移文件。
- 遇到 P2022 优先检查数据库真实表结构，而不是先改业务查询。
- 对已存在环境的补丁迁移必须使用幂等 SQL，例如 `ADD COLUMN IF NOT EXISTS`、`CREATE INDEX IF NOT EXISTS`。
- 外键约束补丁必须先判断约束是否存在，避免重复执行失败。
- 未经用户明确同意，不主动执行数据库迁移或数据变更命令。

### 写入前检查

- 检查 `server-nestjs/prisma/schema.prisma` 中模型字段和 `@map` 数据库列名。
- 检查 `server-nestjs/prisma/migrations/*/migration.sql` 是否已经包含对应列。
- 如需确认数据库现状，先只读查询 `information_schema.columns` 和 `_prisma_migrations`。

### 写入后验收

- 新增迁移后，提醒用户手动执行迁移命令。
- 迁移执行后，确认 `bug_project` 至少包含：
  - `project_stage`
  - `planned_start_time`
  - `planned_end_time`
  - `progress`
  - `risk_level`
- 确认 `bug_ticket` 至少包含：
  - `requirement_id`
  - `iteration_id`
  - `milestone_id`
- 确认存在项目管理表：
  - `project_iteration`
  - `project_milestone`
  - `project_requirement`
  - `project_activity`
- 再访问 Bug 列表和项目选项接口，确认不再出现 P2022。

### 相关文件路径

- `server-nestjs/prisma/schema.prisma`
- `server-nestjs/prisma/migrations/20260515000100_add_project_management/migration.sql`
- `server-nestjs/prisma/migrations/20260516000100_fix_bug_ticket_project_links/migration.sql`
- `server-nestjs/prisma/migrations/20260516000200_fix_project_management_schema_drift/migration.sql`
- `server-nestjs/src/bug/project/bug-project.service.ts`
- `server-nestjs/src/bug/ticket/bug-ticket.service.ts`

## 环境与发布边界防重复规则

### 现象

后续协作中容易把“本地开发版”和“Docker 内测版”混为一谈，导致未确认时重建或重启 Docker 内测环境。

### 已确认约定

1. 本地开发版：指源码目录中的开发运行环境，用于日常开发、调试和修复。
2. Docker 内测版：指本地 OrbStack / Docker 中部署的 `http://localhost:18001` 版本，用于内测验收。
3. 没有用户明确允许时，不得修改、重建、重启或清理 Docker 内测版。
4. 只有用户明确要求“更新 Docker 版本”“重新部署内测版”“启动/重启 Docker 内测版”等，才允许操作 Docker。

### 防重复规则

1. 默认所有功能完善都只针对本地开发版源码。
2. 执行任何 `docker compose up/down/restart/build/pull` 或影响 `http://localhost:18001` 的操作前，必须确认用户已明确授权。
3. 如果只是完成本地开发任务，最终只能建议用户是否更新 Docker 内测版，不能主动更新。
4. 二期 AI 修复中的“本地项目”默认指本地开发源码目录，不是 Docker 内测版。

### 相关文件路径

- `docs/部署运维/环境与发布边界.md`
- `docker-compose.orbstack-18001.yml`

### 分支与数据管理补充

1. `main` 是本地开发主分支。
2. `codex/docker-internal-test-18001` 是 Docker 内测版基线分支。
3. 后续只有用户明确要求时，才把 `main` 的指定版本同步到 Docker 内测分支。
4. 同步分支不等于更新 Docker 容器；更新 Docker 容器仍需用户单独明确允许。
5. 本地开发数据库和 Docker 内测数据库必须分开管理，禁止未经确认互相覆盖。

相关正式文档：`docs/部署运维/分支与数据管理约定.md`

# 开发协作问题与防重复清单 - bug-feedback-system

最后更新时间：2026-05-17

## 当前项目事实

- 项目路径：`/Volumes/data/fzl/pro/bug-feedback-system`
- 前端：Vue 3.5 + Vite 7 + TypeScript + shadcn-vue + Pinia
- 后端：NestJS 11 + Prisma 7 + PostgreSQL + Redis
- 权限：已有 RBAC、动态菜单、按钮权限、`@RequirePermission`；Bug 业务采用系统 RBAC + 项目成员角色双层权限
- 上传：已有 `StorageService` 和 `/api/upload/*`，支持本地/对象存储

## 已确认产品方向

- 内部团队使用
- 支持多个项目
- 后台登录后提交 Bug
- 支持截图、日志、录屏附件
- 截图需要在线标注：画框、箭头、线条、编号、文字
- 第一版启用站内通知，但只通知下一步处理人；tester 提交后通知 reviewer/负责人，不通知 developer
- 流程完整：tester 提交 → reviewer 确认/驳回 → reviewer 分派 developer → developer 修复 → tester 验证/关闭
- 已确认新增 `bug_reviewer` 系统角色和项目成员 `reviewer`；`bug_viewer`/`bug_operator` 作为历史可选系统角色默认停用，项目成员 `viewer` 仅作为可选只读成员角色保留。

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

### Bug 角色权限防重复规则

- `bug_reviewer` 必须作为独立系统角色存在，不能只依赖产品负责人兼职；项目成员字典必须包含 `reviewer`。
- `bug_viewer`/`bug_operator` 默认停用，不进入常规角色列表；如未来启用只读观察，应优先复用项目成员 `viewer` 并确保不得授予提交、评论、上传或状态流转权限。
- `developer` 分派前不可见 tester 新提交 Bug，不能给开发角色授予审核池数据范围。
- 项目/模块/版本列表应按 `visibleProjectIds` 限制数据范围，不能因为有菜单权限就返回所有项目基础数据。
- 种子链路必须包含 `server-nestjs/prisma/seed-bug-workflow-permissions.ts`，确保 reviewer 角色、项目成员字典和权限幂等补齐。
- 演示/验收用户名不要带业务模块前缀，建议使用：`project_owner`、`product_owner`、`reviewer01`、`developer01`、`developer02`、`tester01`、`submitter01`；如需只读观察再启用 `viewer01`。

### 项目数据权限越权防重复规则

#### 现象

- 使用 `project_owner` 登录后，曾能看到“后台管理系统”项目。
- “后台管理系统”的负责人是 `admin/超级管理员`，不属于 `project_owner` 负责或参与的项目。

#### 根因

1. 演示账号初始化脚本曾把 `project_owner`、`product_owner`、`reviewer01`、`developer01`、`developer02`、`tester01` 自动加入所有项目，导致 `bug_project_member` 中存在错误 active 成员关系。
2. 项目管理模块和缺陷模块曾存在多个 `visibleProjectIds` 实现，容易出现一个入口已修、另一个入口仍按旧逻辑判断的情况。
3. 系统角色 `bug_project_owner` 只是功能权限角色，不能理解成“所有项目负责人”；数据范围必须另看 `BugProject.ownerId` 和 active 项目成员关系。
4. 过去曾把 `roleSort` 当成角色上下级依据，但 `roleSort` 只是展示排序，不能表达安全等级，容易导致普通角色和业务角色高低误判。
5. 曾只在前端下拉过滤候选人，后端字段级校验不足，存在绕过前端直接传 `ownerId`、`assigneeId`、`developerId`、`testerId` 的风险。

#### 防重复规则

- 演示/验收脚本不得把业务演示账号加入所有项目，只能加入其被明确授权的项目。
- 普通业务角色的项目可见范围统一为：`BugProject.ownerId = 当前用户` 或 `bug_project_member.status = '0'` 的项目；超级管理员才可见全部项目。
- `bug_project_owner`、`bug_product_owner`、`bug_reviewer` 等系统角色只控制菜单/按钮能力，不直接扩大项目数据范围。
- 项目/模块/版本、项目管理仪表盘、需求、迭代、里程碑、项目概览都必须复用服务端项目可见范围，不能只在前端过滤。
- 查询时即使传入不可见 `projectId`，列表接口也只能返回空数据；详情/概览类接口必须返回无权访问。
- 角色上下级必须使用 `sys_role.security_level`，不得使用 `roleSort` 判断权限高低；多角色用户按最高安全等级计算。
- 项目负责人可以新增项目，但普通项目负责人新增时项目负责人只能是自己，不能指定超级管理员或其他用户作为负责人。
- 项目负责人只能维护自己负责或自己是 `owner` 成员的项目配置；后端必须校验，不能只靠菜单权限。
- 项目负责人不能维护权限高于自己的项目成员关系，不能把超级管理员、系统管理员、管理层或其他更高权限用户加入/移除/停用为项目成员。
- 项目负责人不能移除或停用 `BugProject.ownerId` 对应的项目负责人成员；如需更换负责人，必须先走明确的项目负责人变更逻辑。
- 普通项目负责人不能直接变更 `BugProject.ownerId`；负责人交接必须由超级管理员或专门交接流程处理。
- 系统用户管理也必须接入角色安全等级：非 `admin` 不能给用户分配高于自己的角色，用户列表/详情/导出不能暴露权限高于自己的用户，不能编辑、停用、删除、重置密码权限高于自己的用户。
- 系统角色管理必须接入同一套安全等级：非 `admin` 的角色列表/详情不能暴露权限高于自己的角色，不能编辑、停用、删除权限高于自己的角色；新增/编辑角色只能设置小于等于自己安全等级的 `securityLevel`。
- 系统角色授权菜单时，非 `admin` 只能授予自己已经拥有的菜单/按钮权限，不能通过编辑低等级角色间接创造更高系统权限。
- 菜单授权树、工作台配置角色选项、工作台配置列表/详情/编辑/删除都必须接入同一套角色安全等级，不能成为绕过角色管理页面的旁路入口。
- 菜单授权树只能返回操作者已有的菜单/按钮；保存角色授权时也必须再次校验，不能把自己没有的权限授给别人。
- `/system/user/getInfo` 只能返回启用且未删除角色推导出的角色列表和按钮权限，避免停用角色导致前端菜单/按钮误显示。
- 通用导出任务 `/export/task` 不能只校验登录态；创建任务、读取导出列必须按模块校验导出权限，用户导出还必须按操作者安全等级过滤数据。
- 缺陷统计导出必须按操作者可见项目过滤；导出任务详情、下载、删除只能操作本人创建的任务，下载时还要重新校验当前导出权限，避免降权后继续下载旧敏感文件。
- 历史角色或未知角色也必须有 `security_level`；非 `admin` 能否分配、维护或作为候选人出现，统一按 `security_level` 判断。
- 项目成员角色必须和系统角色匹配：`owner -> bug_project_owner`、`product -> bug_product_owner`、`reviewer -> bug_reviewer`、`developer -> bug_developer`、`tester -> bug_tester`。
- 缺陷指派、模块默认负责人、需求负责人/开发/测试负责人、迭代负责人、里程碑负责人都必须做后端字段级校验：目标用户必须是当前项目有效成员，并且权限等级不能高于操作者。
- 缺陷创建或编辑时传入 `projectId` 必须属于当前用户可见项目；关联的模块、版本、需求、迭代、里程碑必须属于同一项目，禁止通过接口构造跨项目关联。
- 前端候选人下拉必须传明确分配场景：`assignContext`、必要时传 `projectId`，并传 `assignableOnly=true`；但禁止把前端下拉当作唯一权限控制。
- 当需求、迭代、里程碑切换项目时，不能把旧项目负责人/开发/测试负责人或旧项目模块/版本/迭代/里程碑等关联对象静默带入新项目；后端必须校验保留字段在新项目中仍然合法。
- 项目删除权限默认仅超级管理员拥有，项目负责人不应拥有 `bug:project:remove`。
- 后端 `/getRouters` 必须过滤没有可见子菜单的目录；按钮权限带出的上级目录不能作为空菜单显示，例如只有通知按钮权限时不能显示空的“系统管理”。

#### 相关文件

- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/bug/bug-access.service.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/bug/project/bug-project-helper.service.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/bug/security/role-security.config.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/bug/security/role-security.service.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/bug/ticket/bug-ticket.service.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/bug/project-management/project-requirement.service.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/bug/project-management/project-iteration.service.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/bug/project-management/project-milestone.service.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/common/security/role-level.config.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/system/security/system-role-security.service.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/system/user/user.controller.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/system/role/role.controller.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/system/menu/system-menu.controller.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/system/workspace/workspace-config.controller.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/src/system/workspace/workspace-config.service.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/scripts/ensure-bug-team-roles.mjs`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/prisma/seed-role-user-cleanup.ts`
- `/Volumes/data/fzl/pro/bug-feedback-system/server-nestjs/prisma/seed-bug-workflow-permissions.ts`

#### 写入后验收

- `project_owner` 调 `/api/bug/projects/options`、`/api/bug/projects`、`/api/project-management/executive-dashboard/projects` 只能看到“飞鸟探亲”。
- `project_owner` 访问 `/api/project-management/projects/1/overview` 必须返回无权访问。
- `project_owner` 查询 `projectId=1` 的需求、迭代、里程碑列表必须为空。
- `project_owner` 调 `/api/bug/projects` 可新增自己负责的项目，但指定 `ownerId=admin` 必须返回无权访问。
- `project_owner` 修改“后台管理系统”或维护超级管理员项目成员关系必须返回无权访问。
- `project_owner` 删除自己负责项目的 owner 成员必须返回无权访问。
- `project_owner` 在成员管理中不能添加、移除、停用权限高于自己的用户；目标用户系统角色与项目成员角色不匹配时必须失败。
- `project_owner` 如果拥有系统用户管理权限，也不能在用户列表/详情中看到更高权限用户，不能给用户分配 `admin/system_admin/pm_executive` 等更高角色，不能查询、编辑、停用、删除、重置密码更高权限用户。
- `project_owner` 如果拥有系统角色管理权限，也不能在角色列表/详情中看到更高权限角色，不能查询、编辑、停用、删除更高权限角色，不能新增或分配未纳入安全等级配置的角色 key。
- `project_owner` 如果拥有系统用户导出权限，导出的用户数据也不能包含更高权限用户。
- `project_owner` 通过通用导出任务导出用户时，也不能导出更高权限用户；没有 `system:user:export` 时不能创建用户导出任务或读取用户导出列。
- 有 `bug:statistics:export` 的非管理员导出缺陷统计时，只能导出自己可见项目的数据。
- `project_owner` 如果拥有系统角色管理权限，给角色勾选菜单时不能授予自己未拥有的菜单/按钮权限。
- `project_owner` 打开角色授权菜单树时，也只能看到自己已有的菜单/按钮。
- `project_owner` 如果拥有工作台配置权限，也不能在角色选项、列表、详情、编辑、删除中维护更高权限角色的工作台配置。
- `project_owner` 分派缺陷时只能选择当前项目有效开发人员，不能指派给权限高于自己的用户。
- `project_owner` 创建缺陷时指定不可见 `projectId` 必须返回无权访问；编辑缺陷时不能把项目切到不可见项目。
- 缺陷关联需求、迭代、里程碑或模块/版本时，目标对象不属于当前缺陷项目必须返回参数错误。
- `project_owner` 编辑需求、迭代、里程碑或模块默认负责人时，只能选择当前项目有效成员，且不能选择权限高于自己的用户。
- 编辑需求、迭代、里程碑时切换项目，如果原负责人不属于新项目有效成员，或原模块/版本/迭代/里程碑不属于新项目，必须返回参数错误，不能静默保留。
- `project_owner` 调 `/api/getRouters` 不应返回空的“系统管理”目录；返回的每个目录都必须至少有一个可见子菜单。
- 停用或逻辑删除某个角色后，`/system/user/getInfo` 不应再把该角色的 `roleKey` 或按钮权限返回给前端。

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

## 开发进程挂掉与前端代理拒绝连接防重复规则

### 现象

- 用户反馈“项目进程又挂了”。
- 浏览器或 Vite 控制台出现 `/api/*` 代理错误：`AggregateError [ECONNREFUSED]`。
- `lsof` 检查发现前端 `5173` 可能已启动，但后端 `3001` 未监听。

### 根因

1. 这次根因不是数据库、Redis 或端口占用，而是 Nest watch 编译失败。
2. 具体错误位于 `server-nestjs/src/bug/project/bug-project.service.ts`：
   - `scopedProjectIdFilter()` 返回类型绑定为 `Prisma.BugProjectModuleWhereInput['projectId']`。
   - 该返回值又被复用到 `BugProjectVersionWhereInput.projectId`。
   - Prisma 7 的模型泛型会把过滤器类型绑定到具体模型，导致 `BugProjectModule` 的 `BigIntFilter` 不能赋给 `BugProjectVersion`。
3. 后端编译失败后不会监听 `3001`，前端请求 `/api/*` 只能表现为代理拒绝连接。

### 错误决策链路

- 不能只看 Vite `ECONNREFUSED` 就判断是前端问题。
- 不能先重启 Docker 内测版；本地开发版和 Docker 内测版必须分开处理。
- 不能先改数据库或重跑迁移；应先看 `pnpm dev` 后端 watch 编译输出。
- 不能继续把具体 Prisma 模型的 where 字段类型复用到另一个模型。

### 防重复规则

- 遇到“项目挂了”先三步确认：
  1. `lsof -nP -iTCP -sTCP:LISTEN | grep -E ':(3001|5173)\b'`
  2. 查看 `pnpm dev` 终端是否有 TypeScript 编译错误。
  3. 再看 `server-nestjs/logs/*当天日期*.log` 是否有运行期异常。
- 前端 `ECONNREFUSED` 优先表示后端未启动或未监听，不等于前端 API 封装错误。
- 可复用的 Prisma where 过滤器不要写成某个具体模型的字段类型；跨模型复用时应返回通用结构，或分别提供模块/版本专用过滤器。
- 修复后必须确认：
  - watch 输出 `Found 0 errors`
  - 后端监听 `3001`
  - 前端监听 `5173`
  - `curl http://127.0.0.1:3001/api/health` 返回 200。

### 相关文件路径

- `server-nestjs/src/bug/project/bug-project.service.ts`
- `docs/问题解决/README.md`

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
- Bug 列表、详情、统计、项目仪表盘都必须复用服务端数据范围，不能只在列表页过滤。
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

## 角色等级展示防误读规则

### 现象

角色管理页面过去只展示“显示顺序”，没有展示真正用于权限上下级判断的安全等级，容易让管理员误以为 `roleSort` 就是角色等级。

### 根因

安全等级最初只在后端 `ROLE_SECURITY_LEVEL` 配置中参与校验，导致新增角色无法设置安全等级，也容易把安全等级误解为只读推导字段。

### 防重复规则

1. 角色上下级只能使用 `sys_role.security_level`，不能使用 `roleSort`。
2. 角色列表、新增/编辑弹窗、角色详情和权限预览必须展示“安全等级”。
3. 新增/编辑角色可以填写安全等级，但后端必须校验：非 `admin` 只能设置小于等于自己安全等级的值。
4. 用户分配角色、角色维护、工作台配置角色选择、项目负责人/成员/缺陷/需求/迭代/里程碑候选人都必须按 `security_level` 判断上下级。
5. 内置角色默认等级可由迁移初始化；运行时以后端数据库字段为准。

### 相关文件路径

- `server-nestjs/src/common/security/role-level.config.ts`
- `server-nestjs/src/system/role/role.service.ts`
- `web/src/views/system/role/index.vue`
- `web/src/views/system/role/components/RoleTable.vue`
- `web/src/views/system/role/components/RoleFormDialog.vue`
- `web/src/views/system/role/components/RolePreviewDialog.vue`
- `web/src/api/system/types.ts`

## 表单字段说明缺失防重复规则

### 现象

新增/编辑需求等弹窗表单曾只展示输入框、下拉框和日期控件，字段缺少可见标签和帮助说明。多个下拉框同时显示“暂不指定”，日期控件只显示“年/月/日”，用户无法判断字段用途、默认值含义和不填写的后果。

### 根因

1. 表单实现过度依赖 placeholder 和默认选项，误把 placeholder 当成字段标签。
2. 人员、日期、分类等业务字段没有说明其在流程、统计、提醒或权限中的作用。
3. 同类表单缺少全局可用性规范，导致新增页面时只追求排版紧凑，忽略用户理解成本。
4. 对“暂不指定”这类空值选项没有解释业务后果，多个字段同时出现时尤其容易误导。

### 错误决策链路

- 不能只把 placeholder 改长来代替标签。
- 不能只给第一个字段加标签，其他字段继续裸露。
- 不能把所有“暂不指定”都当作通用文案，不区分需求负责人、开发负责人、项目负责人等角色差异。
- 不能把日期字段只交给浏览器默认格式显示，必须说明日期用途。

### 防重复规则

1. 新增或改造表单时，每个可编辑字段必须有可见标签。
2. 出现“暂不指定”“默认”“无”等空值选项时，必须在字段说明中解释不指定的后果。
3. 人员字段必须说明角色职责，例如需求负责人负责澄清与验收、开发负责人负责开发承接。
4. 日期字段必须说明用途，例如计划开始/完成用于排期、统计和逾期判断。
5. placeholder 只能作为示例或输入提示，不能替代字段名称和帮助说明。
6. 优先把规则写入 `docs/开发规范/前端页面交互与视觉规范.md`，不要只在单点页面修复。

### 写入前检查

- 检查弹窗或表单是否存在无标签的 `Input`、`Select`、`Textarea`、日期控件。
- 检查是否存在多个相同“暂不指定”但用户无法区分含义的字段。
- 检查日期/时间字段是否说明用途。
- 检查必填与可选是否清楚。
- 检查相关自有代码文件行数，接近 500 行时先拆分或优先抽公共组件。

### 写入后验收

- 用户只看界面即可理解每个字段是什么、为何填写、不填会怎样。
- 表单字段标签、说明、错误提示在浅色/深色模式下均可读。
- 同类角色、日期、分类字段在不同页面文案一致。
- 需求管理、迭代计划、里程碑、项目概览、Bug 提交/编辑/执行操作、项目/模块/版本配置等表单应按该规范分批改造。

### 已沉淀的复用措施

- 正式规范写入 `docs/开发规范/前端页面交互与视觉规范.md#8-表单可用性规范`。
- 新增统一字段结构组件 `web/src/components/common/FormFieldBlock.vue`，用于收敛“标签 + 控件 + 必填/可选 + 帮助说明”。
- 后续同类页面出现 3 个以上业务字段时，应优先复用该组件或同等级公共组件，不应继续复制裸 `Input` / `Select` / `Textarea`。

### 相关文件路径

- `docs/开发规范/前端页面交互与视觉规范.md`
- `web/src/components/common/FormFieldBlock.vue`
- `web/src/views/project-management/requirements/index.vue`
- `web/src/views/project-management/iterations/index.vue`
- `web/src/views/project-management/milestones/index.vue`
- `web/src/views/project-management/overview/index.vue`
- `web/src/views/bug/tickets/create.vue`
- `web/src/views/bug/tickets/index.vue`
- `web/src/views/bug/projects/index.vue`
- `web/src/views/bug/modules/index.vue`
- `web/src/views/bug/versions/index.vue`

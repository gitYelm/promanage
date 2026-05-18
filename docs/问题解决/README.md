# 问题解决索引

本目录用于记录开发协作问题、防重复清单和排障经验。

## 按模块/主题读取索引

| 主题 | 文档 | 适用范围 |
|---|---|---|
| Bug 反馈系统防重复 | [开发协作问题与防重复清单-bug-feedback-system.md](./开发协作问题与防重复清单-bug-feedback-system.md) | Bug 反馈系统后端、前端、数据库、权限、上传实现 |
| 角色与项目数据权限 | [开发协作问题与防重复清单-bug-feedback-system.md#项目数据权限越权防重复规则](./开发协作问题与防重复清单-bug-feedback-system.md#项目数据权限越权防重复规则) | 系统角色、项目成员、项目负责人、角色安全等级、负责人候选人、项目/需求/仪表盘数据范围 |
| 角色等级展示 | [开发协作问题与防重复清单-bug-feedback-system.md#角色等级展示防误读规则](./开发协作问题与防重复清单-bug-feedback-system.md#角色等级展示防误读规则) | 角色管理页面、安全等级新增/编辑、roleSort 防误读 |
| 附件上传与截图标注 | [开发协作问题与防重复清单-bug-feedback-system.md#附件上传与截图标注防重复规则](./开发协作问题与防重复清单-bug-feedback-system.md#附件上传与截图标注防重复规则) | Bug 提交页附件上传、截图标注、上传后预览、继续上传 |
| 附件浏览器预览 | [开发协作问题与防重复清单-bug-feedback-system.md#附件浏览器预览防重复规则](./开发协作问题与防重复清单-bug-feedback-system.md#附件浏览器预览防重复规则) | Bug 提交页和详情页附件缩略图、主预览、全屏预览、左右切换 |
| Bug 流程与快捷操作 | [开发协作问题与防重复清单-bug-feedback-system.md#bug-流程与快捷操作防重复规则](./开发协作问题与防重复清单-bug-feedback-system.md#bug-流程与快捷操作防重复规则) | Bug 状态流转、reviewer 分派前 developer 不可见、站内通知不泛发、列表快捷按钮、我的 Bug 待处理数量徽标 |
| 开发进程挂掉/前端代理拒绝连接 | [开发协作问题与防重复清单-bug-feedback-system.md#开发进程挂掉与前端代理拒绝连接防重复规则](./开发协作问题与防重复清单-bug-feedback-system.md#开发进程挂掉与前端代理拒绝连接防重复规则) | `pnpm dev`、Nest watch 编译失败、Vite `ECONNREFUSED`、后端 3001 未监听 |
| Prisma P2022 与数据库漂移 | [开发协作问题与防重复清单-bug-feedback-system.md#prisma-p2022-与数据库漂移防重复规则](./开发协作问题与防重复清单-bug-feedback-system.md#prisma-p2022-与数据库漂移防重复规则) | Prisma schema/客户端字段已存在，但 PostgreSQL 真实表结构缺列导致接口 500 |
| 表单字段说明缺失 | [开发协作问题与防重复清单-bug-feedback-system.md#表单字段说明缺失防重复规则](./开发协作问题与防重复清单-bug-feedback-system.md#表单字段说明缺失防重复规则) | 新增/编辑弹窗、负责人下拉、日期字段、placeholder、暂不指定空值说明 |
| 表单焦点态边框裁切 | [开发协作问题与防重复清单-bug-feedback-system.md#表单焦点态边框裁切防重复规则](./开发协作问题与防重复清单-bug-feedback-system.md#表单焦点态边框裁切防重复规则) | 全局 Input、Textarea、Select、Checkbox、Radio 焦点态，角色管理新增/编辑弹窗等表单 |
| 环境与发布边界 | [开发协作问题与防重复清单-bug-feedback-system.md#环境与发布边界防重复规则](./开发协作问题与防重复清单-bug-feedback-system.md#环境与发布边界防重复规则) | 本地开发版、Docker 内测版、18001 内测环境、禁止未授权 Docker 操作 |

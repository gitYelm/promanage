export type PermissionFlagInput = string | string[] | undefined

interface RouteActionPermissionRule {
  pattern: RegExp
  actions: Record<string, string[]>
}

export interface ButtonPermissionDescriptor {
  text?: string
  title?: string
  ariaLabel?: string
  iconKeys?: string[]
}

function normalizeActionKey(value?: string) {
  return (value || '').replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase()
}

function normalizeActionMap(actions: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(actions).map(([key, permissions]) => [normalizeActionKey(key), permissions]),
  )
}

function routeRule(pattern: RegExp, actions: Record<string, string[]>): RouteActionPermissionRule {
  return { pattern, actions: normalizeActionMap(actions) }
}

const ROUTE_BUTTON_PERMISSION_RULES: RouteActionPermissionRule[] = [
  routeRule(/^\/system\/user\/?$/, {
    新增用户: ['system:user:add'], plus: ['system:user:add'],
    导入用户: ['system:user:import'], 导入: ['system:user:import'], fileup: ['system:user:import'], 下载模板: ['system:user:import'], 确认导入: ['system:user:import'], 开始导入: ['system:user:import'], 确定: ['system:user:add', 'system:user:edit'],
    导出: ['system:user:export'], 开始导出: ['system:user:export'], 导出任务: ['system:user:export'], filedown: ['system:user:export'],
    查看详情: ['system:user:query'], eye: ['system:user:query'],
    修改用户: ['system:user:edit'], 修改: ['system:user:edit'], 编辑: ['system:user:edit'], edit: ['system:user:edit'], 上传头像: ['system:user:add', 'system:user:edit'], 批量启用: ['system:user:edit'], 批量停用: ['system:user:edit'], 确认启用: ['system:user:edit'], 确认停用: ['system:user:edit'], 确认批量启用: ['system:user:edit'], 确认批量停用: ['system:user:edit'],
    重置密码: ['system:user:resetPwd'], key: ['system:user:resetPwd'],
    删除: ['system:user:remove'], 确认删除: ['system:user:remove'], 批量删除: ['system:user:remove'], 确认批量删除: ['system:user:remove'], trash2: ['system:user:remove'],
  }),
  routeRule(/^\/system\/role\/?$/, {
    新增角色: ['system:role:add'], plus: ['system:role:add'], 确定: ['system:role:add', 'system:role:edit'],
    查看权限: ['system:role:query'], eye: ['system:role:query'],
    修改角色: ['system:role:edit'], 修改: ['system:role:edit'], 编辑: ['system:role:edit'], edit: ['system:role:edit'], 批量启用: ['system:role:edit'], 批量停用: ['system:role:edit'], 确认批量启用: ['system:role:edit'], 确认批量停用: ['system:role:edit'],
    删除: ['system:role:remove'], 确认删除: ['system:role:remove'], 批量删除: ['system:role:remove'], 确认批量删除: ['system:role:remove'], trash2: ['system:role:remove'],
  }),
  routeRule(/^\/system\/menu\/?$/, {
    新增菜单: ['system:menu:add'], plus: ['system:menu:add'],
    修改菜单: ['system:menu:edit'], 修改: ['system:menu:edit'], 编辑: ['system:menu:edit'], edit: ['system:menu:edit'], 确定: ['system:menu:add', 'system:menu:edit'],
    删除: ['system:menu:remove'], 确认删除: ['system:menu:remove'], trash2: ['system:menu:remove'],
  }),
  routeRule(/^\/system\/dept\/?$/, {
    新增部门: ['system:dept:add'], plus: ['system:dept:add'],
    修改部门: ['system:dept:edit'], 修改: ['system:dept:edit'], 编辑: ['system:dept:edit'], edit: ['system:dept:edit'], 确定: ['system:dept:add', 'system:dept:edit'],
    删除: ['system:dept:remove'], 确认删除: ['system:dept:remove'], trash2: ['system:dept:remove'],
  }),
  routeRule(/^\/system\/post\/?$/, {
    新增岗位: ['system:post:add'], plus: ['system:post:add'],
    修改岗位: ['system:post:edit'], 修改: ['system:post:edit'], 编辑: ['system:post:edit'], edit: ['system:post:edit'], 确定: ['system:post:add', 'system:post:edit'], 批量启用: ['system:post:edit'], 批量停用: ['system:post:edit'], 确认批量启用: ['system:post:edit'], 确认批量停用: ['system:post:edit'],
    删除: ['system:post:remove'], 确认删除: ['system:post:remove'], 批量删除: ['system:post:remove'], 确认批量删除: ['system:post:remove'], trash2: ['system:post:remove'],
  }),
  routeRule(/^\/system\/dict\/?$/, {
    新增字典: ['system:dict:add'], 添加字典类型: ['system:dict:add'], 添加字典数据: ['system:dict:add'], 新增: ['system:dict:add'], plus: ['system:dict:add'],
    字典数据: ['system:dict:list'], list: ['system:dict:list'],
    修改字典类型: ['system:dict:edit'], 修改字典数据: ['system:dict:edit'], 修改: ['system:dict:edit'], 编辑: ['system:dict:edit'], edit: ['system:dict:edit'], 确定: ['system:dict:add', 'system:dict:edit'],
    删除: ['system:dict:remove'], 确认删除: ['system:dict:remove'], trash2: ['system:dict:remove'],
  }),
  routeRule(/^\/system\/config\/?$/, {
    新增参数: ['system:config:add'], plus: ['system:config:add'],
    刷新缓存: ['system:config:edit'], rotatecw: ['system:config:edit'],
    修改参数: ['system:config:edit'], 修改: ['system:config:edit'], 编辑: ['system:config:edit'], edit: ['system:config:edit'], 确定: ['system:config:add', 'system:config:edit'],
    删除: ['system:config:remove'], 确认删除: ['system:config:remove'], trash2: ['system:config:remove'],
  }),
  routeRule(/^\/system\/notice\/?$/, {
    新增公告: ['system:notice:add'], plus: ['system:notice:add'],
    预览: ['system:notice:query'], eye: ['system:notice:query'],
    修改公告: ['system:notice:edit'], 修改: ['system:notice:edit'], 编辑: ['system:notice:edit'], edit: ['system:notice:edit'], 确定: ['system:notice:add', 'system:notice:edit'],
    删除: ['system:notice:remove'], 确认删除: ['system:notice:remove'], 批量删除: ['system:notice:remove'], 确认批量删除: ['system:notice:remove'], trash2: ['system:notice:remove'],
  }),
  routeRule(/^\/system\/workspace(?:-config)?\/?$/, {
    新增工作台配置: ['system:workspace:add'], 新增: ['system:workspace:add'], plus: ['system:workspace:add'],
    修改工作台配置: ['system:workspace:edit'], 修改: ['system:workspace:edit'], 编辑: ['system:workspace:edit'], edit: ['system:workspace:edit'], 保存: ['system:workspace:add', 'system:workspace:edit'],
    删除: ['system:workspace:remove'], 删除工作台配置: ['system:workspace:remove'], trash2: ['system:workspace:remove'],
  }),
  routeRule(/^\/system\/setting\/?$/, {
    保存设置: ['system:setting:edit'], 选择文件: ['system:setting:edit'], 移除图片: ['system:setting:edit'], 测试发送: ['system:setting:edit'], 解锁: ['system:setting:edit'], unlock: ['system:setting:edit'],
  }),
  routeRule(/^\/system\/notification\/?$/, {
    全部已读: ['system:notification:read'],
  }),
  routeRule(/^\/monitor\/job\/?$/, {
    新增任务: ['monitor:job:add'], plus: ['monitor:job:add'], 确定: ['monitor:job:add', 'monitor:job:edit'],
    执行一次: ['monitor:job:changeStatus'], 执行任务: ['monitor:job:changeStatus'], play: ['monitor:job:changeStatus'],
    修改任务: ['monitor:job:edit'], 修改: ['monitor:job:edit'], 编辑: ['monitor:job:edit'], edit: ['monitor:job:edit'],
    批量启用: ['monitor:job:changeStatus'], 批量暂停: ['monitor:job:changeStatus'], 确认批量启用: ['monitor:job:changeStatus'], 确认批量暂停: ['monitor:job:changeStatus'],
    删除任务: ['monitor:job:remove'], 删除: ['monitor:job:remove'], 确认删除: ['monitor:job:remove'], 批量删除: ['monitor:job:remove'], 确认批量删除: ['monitor:job:remove'], trash2: ['monitor:job:remove'],
  }),
  routeRule(/^\/monitor\/online\/?$/, {
    强退: ['monitor:online:forceLogout'], 确认强退: ['monitor:online:forceLogout'], 批量强退: ['monitor:online:forceLogout'], logout: ['monitor:online:forceLogout'],
  }),
  routeRule(/^\/monitor\/operlog\/?$/, {
    清空: ['monitor:operlog:remove'], 确认清空: ['monitor:operlog:remove'], 删除: ['monitor:operlog:remove'], 批量删除: ['monitor:operlog:remove'], 确认批量删除: ['monitor:operlog:remove'], trash2: ['monitor:operlog:remove'],
    查看: ['monitor:operlog:query'], eye: ['monitor:operlog:query'],
  }),
  routeRule(/^\/monitor\/logininfor\/?$/, {
    清空: ['monitor:logininfor:remove'], 确认清空: ['monitor:logininfor:remove'], 删除: ['monitor:logininfor:remove'], 批量删除: ['monitor:logininfor:remove'], 确认批量删除: ['monitor:logininfor:remove'], trash2: ['monitor:logininfor:remove'],
  }),
  routeRule(/^\/(?:bug|project-management)\/projects\/?$/, {
    新增项目: ['bug:project:add'], plus: ['bug:project:add'],
    成员: ['bug:project:member'], 添加更新成员: ['bug:project:member'], 移除: ['bug:project:member'],
    编辑项目: ['bug:project:edit'], 修改: ['bug:project:edit'], 编辑: ['bug:project:edit'], edit: ['bug:project:edit'], 保存: ['bug:project:add', 'bug:project:edit'],
    删除: ['bug:project:remove'], 确认删除: ['bug:project:remove'], trash2: ['bug:project:remove'],
  }),
  routeRule(/^\/(?:bug|project-management)\/modules\/?$/, {
    新增模块: ['bug:module:add'], plus: ['bug:module:add'],
    编辑模块: ['bug:module:edit'], 修改: ['bug:module:edit'], 编辑: ['bug:module:edit'], edit: ['bug:module:edit'], 保存: ['bug:module:add', 'bug:module:edit'],
    删除: ['bug:module:remove'], 确认删除: ['bug:module:remove'], trash2: ['bug:module:remove'],
  }),
  routeRule(/^\/(?:bug|project-management)\/versions\/?$/, {
    新增版本: ['bug:version:add'], plus: ['bug:version:add'],
    编辑版本: ['bug:version:edit'], 修改: ['bug:version:edit'], 编辑: ['bug:version:edit'], edit: ['bug:version:edit'], 保存: ['bug:version:add', 'bug:version:edit'],
    删除: ['bug:version:remove'], 确认删除: ['bug:version:remove'], trash2: ['bug:version:remove'],
  }),
  routeRule(/^\/project-management\/overview\/?$/, {
    更新项目进度: ['pm:project:update'], 更新进度: ['pm:project:update'], 保存: ['pm:project:update'],
  }),
  routeRule(/^\/project-management\/requirements\/?$/, {
    新增需求: ['pm:requirement:create'], plus: ['pm:requirement:create'],
    编辑需求: ['pm:requirement:update'], 编辑: ['pm:requirement:update'], 修改: ['pm:requirement:update'], edit: ['pm:requirement:update'],
    删除: ['pm:requirement:update'], 确认删除: ['pm:requirement:update'], trash2: ['pm:requirement:update'],
    提交评审: ['pm:requirement:status'], 排期: ['pm:requirement:status'], 开始开发: ['pm:requirement:status'], 提交测试: ['pm:requirement:status'], 验收通过: ['pm:requirement:status'], 发布: ['pm:requirement:status'], 关闭: ['pm:requirement:status'],
    开始评审: ['pm:requirement:review'], 评审通过: ['pm:requirement:review'],
    保存: ['pm:requirement:create', 'pm:requirement:update'],
  }),
  routeRule(/^\/project-management\/iterations\/?$/, {
    新增迭代: ['pm:iteration:manage'], plus: ['pm:iteration:manage'],
    编辑迭代: ['pm:iteration:manage'], 编辑: ['pm:iteration:manage'], 修改: ['pm:iteration:manage'], 删除: ['pm:iteration:manage'], 确认删除: ['pm:iteration:manage'], 保存: ['pm:iteration:manage'],
    开始: ['pm:iteration:manage'], 进入测试: ['pm:iteration:manage'], 完成: ['pm:iteration:manage'], 暂停: ['pm:iteration:manage'], 取消: ['pm:iteration:manage'],
    trash2: ['pm:iteration:manage'],
  }),
  routeRule(/^\/project-management\/milestones\/?$/, {
    新增里程碑: ['pm:milestone:manage'], plus: ['pm:milestone:manage'],
    编辑里程碑: ['pm:milestone:manage'], 编辑: ['pm:milestone:manage'], 修改: ['pm:milestone:manage'], 删除: ['pm:milestone:manage'], 确认删除: ['pm:milestone:manage'], 保存: ['pm:milestone:manage'],
    开始: ['pm:milestone:manage'], 达成: ['pm:milestone:manage'], 延期: ['pm:milestone:manage'], 取消: ['pm:milestone:manage'],
    trash2: ['pm:milestone:manage'],
  }),
  routeRule(/^\/(?:bug|project-management)\/statistics\/?$/, {
    导出统计: ['bug:statistics:export'], 开始导出: ['bug:statistics:export'],
  }),
  routeRule(/^\/bug\/create\/?$/, {
    提交: ['bug:ticket:add'], 保存并上传: ['bug:attachment:upload'], 添加附件: ['bug:attachment:upload'], 上传附件: ['bug:attachment:upload'],
  }),
  routeRule(/^\/bug\/(?:tickets|my)\/?$/, {
    提交缺陷: ['bug:ticket:add'], 详情: ['bug:ticket:query'], 编辑: ['bug:ticket:edit'], 保存: ['bug:ticket:edit'], 评论: ['bug:comment:add'],
  }),
]


const ICON_PERMISSION_KEYS = new Set([
  'plus',
  'fileup',
  'filedown',
  'eye',
  'edit',
  'key',
  'trash2',
  'list',
  'rotatecw',
  'unlock',
  'play',
  'logout',
])

const ROUTE_STATUS_SWITCH_PERMISSIONS: Array<{ pattern: RegExp; permissions: string[] }> = [
  { pattern: /^\/system\/user\/?$/, permissions: ['system:user:edit'] },
  { pattern: /^\/system\/role\/?$/, permissions: ['system:role:edit'] },
  { pattern: /^\/system\/menu\/?$/, permissions: ['system:menu:edit'] },
  { pattern: /^\/system\/dept\/?$/, permissions: ['system:dept:edit'] },
  { pattern: /^\/system\/post\/?$/, permissions: ['system:post:edit'] },
  { pattern: /^\/system\/dict\/?$/, permissions: ['system:dict:edit'] },
  { pattern: /^\/system\/notice\/?$/, permissions: ['system:notice:edit'] },
  { pattern: /^\/monitor\/job\/?$/, permissions: ['monitor:job:changeStatus'] },
]

const ROUTE_EXPORT_PERMISSIONS: Array<{ pattern: RegExp; permission: string }> = [
  { pattern: /^\/system\/user\/?$/, permission: 'system:user:export' },
  { pattern: /^\/(?:bug|project-management)\/statistics\/?$/, permission: 'bug:statistics:export' },
]

export function normalizePermissionFlags(value: PermissionFlagInput): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export function stringAttr(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function attrHasKey(attrs: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(attrs, key)
}

export function slotTextFromNodes(nodes: unknown): string {
  if (typeof nodes === 'string' || typeof nodes === 'number') return String(nodes)
  if (Array.isArray(nodes)) return nodes.map(slotTextFromNodes).join('')
  if (nodes && typeof nodes === 'object' && 'children' in nodes) {
    return slotTextFromNodes((nodes as { children?: unknown }).children)
  }
  return ''
}

export function slotIconKeysFromNodes(nodes: unknown): string[] {
  if (!Array.isArray(nodes)) return []
  return nodes.flatMap((node) => {
    if (!node || typeof node !== 'object') return []
    const vnode = node as { type?: unknown; children?: unknown }
    const type = vnode.type as { name?: string; __name?: string; displayName?: string } | string
    const name = typeof type === 'string' ? type : type?.name || type?.__name || type?.displayName
    return [name, ...slotIconKeysFromNodes(vnode.children)].filter(Boolean) as string[]
  })
}

export function buttonPermissionsForRoute(path: string, descriptor: ButtonPermissionDescriptor): string[] {
  const rule = ROUTE_BUTTON_PERMISSION_RULES.find((item) => item.pattern.test(path))
  if (!rule) return []

  const textKeys = [descriptor.text, descriptor.title, descriptor.ariaLabel]
    .map(normalizeActionKey)
    .filter(Boolean)
  const iconKeys = (descriptor.iconKeys || [])
    .map(normalizeActionKey)
    .filter((key) => ICON_PERMISSION_KEYS.has(key))

  for (const key of [...textKeys, ...iconKeys]) {
    const permissions = rule.actions[key]
    if (permissions?.length) return permissions
  }
  return []
}

export function statusSwitchPermissionsForRoute(path: string): string[] {
  return ROUTE_STATUS_SWITCH_PERMISSIONS.find((item) => item.pattern.test(path))?.permissions || []
}

export function exportPermissionForRoute(path: string): string | undefined {
  return ROUTE_EXPORT_PERMISSIONS.find((item) => item.pattern.test(path))?.permission
}

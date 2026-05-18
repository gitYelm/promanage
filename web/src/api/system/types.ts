export interface PageQuery {
  pageNum?: number
  pageSize?: number
}

/** 通用分页响应 */
export interface PageResult<T> {
  rows: T[]
  total: number
}

/** 用户查询参数 */
export interface UserQuery extends PageQuery {
  userName?: string
  phonenumber?: string
  status?: string
  deptId?: string | number
  roleId?: string | number
  beginTime?: string
  endTime?: string
}

/** 角色查询参数 */
export interface RoleQuery extends PageQuery {
  roleName?: string
  roleKey?: string
  status?: string
}

/** 岗位查询参数 */
export interface PostQuery extends PageQuery {
  postCode?: string
  postName?: string
  status?: string
}

/** 字典类型查询参数 */
export interface DictTypeQuery extends PageQuery {
  dictName?: string
  dictType?: string
  status?: string
}

/** 字典数据查询参数 */
export interface DictDataQuery extends PageQuery {
  dictType?: string
  dictLabel?: string
  status?: string
}

/** 参数配置查询参数 */
export interface ConfigQuery extends PageQuery {
  configName?: string
  configKey?: string
  configType?: string
}

/** 通知公告查询参数 */
export interface NoticeQuery extends PageQuery {
  noticeTitle?: string
  noticeType?: string
  createBy?: string
}

/** 菜单查询参数 */
export interface MenuQuery {
  menuName?: string
  status?: string
}

export interface BaseEntity {
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
  remark?: string
}

// 1. 部门表 sys_dept
export interface SysDept extends BaseEntity {
  deptId: string
  parentId: string | null
  ancestors: string
  deptName: string
  orderNum: number
  leader: string
  phone: string
  email: string
  status: '0' | '1' // 0正常 1停用
  delFlag: '0' | '2'
  children?: SysDept[] // 前端树形结构使用
}

// 2. 用户表 sys_user
export interface SysUser extends BaseEntity {
  userId: string
  deptId: string | null
  userName: string
  nickName: string
  userType: string
  email: string
  phonenumber: string
  sex: '0' | '1' | '2' // 0男 1女 2未知
  avatar: string
  password?: string
  status: '0' | '1'
  delFlag: '0' | '2'
  loginIp: string
  loginDate: string
  dept?: SysDept // 关联部门对象
  roles?: SysRole[] // 关联角色列表
  roleIds?: string[] // 用于表单提交
  postIds?: string[] // 用于表单提交
}

// 3. 岗位表 sys_post
export interface SysPost extends BaseEntity {
  postId: string
  postCode: string
  postName: string
  postSort: number
  status: '0' | '1'
}

// 4. 角色表 sys_role
export interface SysRole extends BaseEntity {
  roleId: string
  roleName: string
  roleKey: string
  roleSort: number
  dataScope: '1' | '2' | '3' | '4' | '5' // 1全部 2自定 3本部门 4本部门及以下 5仅本人
  menuCheckStrictly: boolean
  deptCheckStrictly: boolean
  status: '0' | '1'
  delFlag: '0' | '2'
  menuIds?: string[] // 菜单权限ID列表，用于表单
  deptIds?: string[] // 部门权限ID列表，用于表单
  userCount?: number // 用户数统计
  securityLevel?: number // 安全等级，用于限制角色维护、用户分配和候选人范围
}

// 5. 菜单表 sys_menu
export interface SysMenu extends BaseEntity {
  menuId: string
  menuName: string
  parentId: string | null
  orderNum: number
  path: string
  component: string
  isFrame: number // 0是 1否
  isCache: number // 0缓存 1不缓存
  menuType: 'M' | 'C' | 'F' // M目录 C菜单 F按钮
  visible: '0' | '1' // 0显示 1隐藏
  status: '0' | '1' // 0正常 1停用
  perms: string
  icon: string
  children?: SysMenu[]
}

// 11. 字典类型 sys_dict_type
export interface SysDictType extends BaseEntity {
  dictId: string // 注意：Schema是UUID，但之前mock可能是number，这里统一用string匹配Schema
  dictName: string
  dictType: string
  status: '0' | '1'
}

// 12. 字典数据 sys_dict_data
export interface SysDictData extends BaseEntity {
  dictCode: string
  dictSort: number
  dictLabel: string
  dictValue: string
  dictType: string
  cssClass: string
  listClass: string
  isDefault: 'Y' | 'N'
  status: '0' | '1'
}

// 15. 通知公告 sys_notice
export interface SysNotice extends BaseEntity {
  noticeId: string
  noticeTitle: string
  noticeType: '1' | '2' // 1通知 2公告
  noticeContent: string
  status: '0' | '1'
}

// 16. 定时任务 sys_job
export interface SysJob extends BaseEntity {
  jobId: string
  jobName: string
  jobGroup: string
  invokeTarget: string
  cronExpression: string
  misfirePolicy: string
  concurrent: '0' | '1'
  status: '0' | '1'
}

// 10. 操作日志 sys_oper_log
export interface SysOperLog {
  operId: string
  title: string
  businessType: number
  method: string
  requestMethod: string
  operatorType: number
  operName: string
  deptName: string
  operUrl: string
  operIp: string
  operLocation: string
  operParam: string
  jsonResult: string
  status: number
  errorMsg: string
  operTime: string
  browser?: string
  os?: string
  costTime?: number
  operUserId?: string
  userAgent?: string
}

// 14. 登录日志 sys_login_log
export interface SysLoginLog {
  infoId: string
  userName: string
  ipaddr: string
  loginLocation: string
  browser: string
  os: string
  status: '0' | '1'
  msg: string
  loginTime: string
}
// 6. 参数配置 sys_config
export interface SysConfig extends BaseEntity {
  configId: string
  configName: string
  configKey: string
  configValue: string
  configType: 'Y' | 'N'
}

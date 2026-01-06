/**
 * 业务错误码枚举
 *
 * 错误码规范:
 * - 1xxxx: 通用错误
 * - 2xxxx: 认证授权相关
 * - 3xxxx: 用户管理相关
 * - 4xxxx: 角色管理相关
 * - 5xxxx: 部门管理相关
 * - 6xxxx: 菜单管理相关
 * - 7xxxx: 字典管理相关
 * - 8xxxx: 系统配置相关
 * - 9xxxx: 监控日志相关
 */
export enum ErrorCode {
  // ==================== 通用错误 (1xxxx) ====================
  /** 成功 */
  SUCCESS = 200,
  /** 操作失败 */
  FAIL = 500,
  /** 参数错误 */
  INVALID_PARAMS = 10001,
  /** 数据不存在 */
  DATA_NOT_FOUND = 10002,
  /** 数据已存在 */
  DATA_ALREADY_EXISTS = 10003,
  /** 操作被拒绝 */
  OPERATION_DENIED = 10004,
  /** 数据库操作失败 */
  DATABASE_ERROR = 10005,
  /** 系统内部错误 */
  INTERNAL_ERROR = 10006,

  // ==================== 认证授权 (2xxxx) ====================
  /** 未登录 */
  UNAUTHORIZED = 20001,
  /** 登录失败 */
  LOGIN_FAILED = 20002,
  /** 用户名或密码错误 */
  INVALID_CREDENTIALS = 20003,
  /** Token 无效 */
  INVALID_TOKEN = 20004,
  /** Token 已过期 */
  TOKEN_EXPIRED = 20005,
  /** 无权限访问 */
  FORBIDDEN = 20006,
  /** 账号已被停用 */
  ACCOUNT_DISABLED = 20007,
  /** 账号已被锁定 */
  ACCOUNT_LOCKED = 20008,
  /** 验证码错误 */
  CAPTCHA_ERROR = 20009,

  // ==================== 用户管理 (3xxxx) ====================
  /** 用户不存在 */
  USER_NOT_FOUND = 30001,
  /** 用户名已存在 */
  USERNAME_EXISTS = 30002,
  /** 手机号已存在 */
  PHONE_EXISTS = 30003,
  /** 邮箱已存在 */
  EMAIL_EXISTS = 30004,
  /** 原密码错误 */
  OLD_PASSWORD_ERROR = 30005,
  /** 新密码不能与原密码相同 */
  SAME_PASSWORD = 30006,
  /** 不能删除当前登录用户 */
  CANNOT_DELETE_SELF = 30007,
  /** 不能删除超级管理员 */
  CANNOT_DELETE_ADMIN = 30008,
  /** 用户已分配角色,不能删除 */
  USER_HAS_ROLES = 30009,

  // ==================== 角色管理 (4xxxx) ====================
  /** 角色不存在 */
  ROLE_NOT_FOUND = 40001,
  /** 角色名称已存在 */
  ROLE_NAME_EXISTS = 40002,
  /** 角色权限字符已存在 */
  ROLE_KEY_EXISTS = 40003,
  /** 不能删除超级管理员角色 */
  CANNOT_DELETE_ADMIN_ROLE = 40004,
  /** 角色已分配用户,不能删除 */
  ROLE_HAS_USERS = 40005,
  /** 角色已分配权限,不能删除 */
  ROLE_HAS_PERMISSIONS = 40006,

  // ==================== 部门管理 (5xxxx) ====================
  /** 部门不存在 */
  DEPT_NOT_FOUND = 50001,
  /** 部门名称已存在 */
  DEPT_NAME_EXISTS = 50002,
  /** 父部门不存在 */
  PARENT_DEPT_NOT_FOUND = 50003,
  /** 不能将部门设置为自己的子部门 */
  CANNOT_SET_SELF_AS_CHILD = 50004,
  /** 部门存在子部门,不能删除 */
  DEPT_HAS_CHILDREN = 50005,
  /** 部门已分配用户,不能删除 */
  DEPT_HAS_USERS = 50006,
  /** 部门状态异常 */
  DEPT_STATUS_ERROR = 50007,

  // ==================== 菜单管理 (6xxxx) ====================
  /** 菜单不存在 */
  MENU_NOT_FOUND = 60001,
  /** 菜单名称已存在 */
  MENU_NAME_EXISTS = 60002,
  /** 父菜单不存在 */
  PARENT_MENU_NOT_FOUND = 60003,
  /** 不能将菜单设置为自己的子菜单 */
  CANNOT_SET_SELF_AS_CHILD_MENU = 60004,
  /** 菜单存在子菜单,不能删除 */
  MENU_HAS_CHILDREN = 60005,
  /** 菜单已分配角色,不能删除 */
  MENU_HAS_ROLES = 60006,
  /** 菜单类型错误 */
  MENU_TYPE_ERROR = 60007,

  // ==================== 字典管理 (7xxxx) ====================
  /** 字典类型不存在 */
  DICT_TYPE_NOT_FOUND = 70001,
  /** 字典类型已存在 */
  DICT_TYPE_EXISTS = 70002,
  /** 字典数据不存在 */
  DICT_DATA_NOT_FOUND = 70003,
  /** 字典标签已存在 */
  DICT_LABEL_EXISTS = 70004,
  /** 字典类型已分配数据,不能删除 */
  DICT_TYPE_HAS_DATA = 70005,

  // ==================== 岗位管理 (7xxxx) ====================
  /** 岗位不存在 */
  POST_NOT_FOUND = 71001,
  /** 岗位编码已存在 */
  POST_CODE_EXISTS = 71002,
  /** 岗位名称已存在 */
  POST_NAME_EXISTS = 71003,
  /** 岗位已分配用户,不能删除 */
  POST_HAS_USERS = 71004,

  // ==================== 系统配置 (8xxxx) ====================
  /** 参数配置不存在 */
  CONFIG_NOT_FOUND = 80001,
  /** 参数键名已存在 */
  CONFIG_KEY_EXISTS = 80002,
  /** 系统内置参数,不能删除 */
  CANNOT_DELETE_BUILTIN_CONFIG = 80003,
  /** 通知公告不存在 */
  NOTICE_NOT_FOUND = 80004,

  // ==================== 监控日志 (9xxxx) ====================
  /** 操作日志不存在 */
  OPER_LOG_NOT_FOUND = 90001,
  /** 登录日志不存在 */
  LOGIN_LOG_NOT_FOUND = 90002,
  /** 在线用户不存在 */
  ONLINE_USER_NOT_FOUND = 90003,
  /** 定时任务不存在 */
  JOB_NOT_FOUND = 90004,
  /** 定时任务名称已存在 */
  JOB_NAME_EXISTS = 90005,
  /** 定时任务正在运行 */
  JOB_IS_RUNNING = 90006,
}

/**
 * 错误码消息映射
 */
export const ErrorCodeMessage: Record<ErrorCode, string> = {
  // 通用错误
  [ErrorCode.SUCCESS]: '操作成功',
  [ErrorCode.FAIL]: '操作失败',
  [ErrorCode.INVALID_PARAMS]: '参数错误',
  [ErrorCode.DATA_NOT_FOUND]: '数据不存在',
  [ErrorCode.DATA_ALREADY_EXISTS]: '数据已存在',
  [ErrorCode.OPERATION_DENIED]: '操作被拒绝',
  [ErrorCode.DATABASE_ERROR]: '数据库操作失败',
  [ErrorCode.INTERNAL_ERROR]: '系统内部错误',

  // 认证授权
  [ErrorCode.UNAUTHORIZED]: '未登录或登录已过期',
  [ErrorCode.LOGIN_FAILED]: '登录失败',
  [ErrorCode.INVALID_CREDENTIALS]: '用户名或密码错误',
  [ErrorCode.INVALID_TOKEN]: 'Token 无效',
  [ErrorCode.TOKEN_EXPIRED]: 'Token 已过期',
  [ErrorCode.FORBIDDEN]: '无权限访问',
  [ErrorCode.ACCOUNT_DISABLED]: '账号已被停用',
  [ErrorCode.ACCOUNT_LOCKED]: '账号已被锁定',
  [ErrorCode.CAPTCHA_ERROR]: '验证码错误',

  // 用户管理
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.USERNAME_EXISTS]: '用户名已存在',
  [ErrorCode.PHONE_EXISTS]: '手机号已存在',
  [ErrorCode.EMAIL_EXISTS]: '邮箱已存在',
  [ErrorCode.OLD_PASSWORD_ERROR]: '原密码错误',
  [ErrorCode.SAME_PASSWORD]: '新密码不能与原密码相同',
  [ErrorCode.CANNOT_DELETE_SELF]: '不能删除当前登录用户',
  [ErrorCode.CANNOT_DELETE_ADMIN]: '不能删除超级管理员',
  [ErrorCode.USER_HAS_ROLES]: '用户已分配角色,不能删除',

  // 角色管理
  [ErrorCode.ROLE_NOT_FOUND]: '角色不存在',
  [ErrorCode.ROLE_NAME_EXISTS]: '角色名称已存在',
  [ErrorCode.ROLE_KEY_EXISTS]: '角色权限字符已存在',
  [ErrorCode.CANNOT_DELETE_ADMIN_ROLE]: '不能删除超级管理员角色',
  [ErrorCode.ROLE_HAS_USERS]: '角色已分配用户,不能删除',
  [ErrorCode.ROLE_HAS_PERMISSIONS]: '角色已分配权限,不能删除',

  // 部门管理
  [ErrorCode.DEPT_NOT_FOUND]: '部门不存在',
  [ErrorCode.DEPT_NAME_EXISTS]: '部门名称已存在',
  [ErrorCode.PARENT_DEPT_NOT_FOUND]: '父部门不存在',
  [ErrorCode.CANNOT_SET_SELF_AS_CHILD]: '不能将部门设置为自己的子部门',
  [ErrorCode.DEPT_HAS_CHILDREN]: '部门存在子部门,不能删除',
  [ErrorCode.DEPT_HAS_USERS]: '部门已分配用户,不能删除',
  [ErrorCode.DEPT_STATUS_ERROR]: '部门状态异常',

  // 菜单管理
  [ErrorCode.MENU_NOT_FOUND]: '菜单不存在',
  [ErrorCode.MENU_NAME_EXISTS]: '菜单名称已存在',
  [ErrorCode.PARENT_MENU_NOT_FOUND]: '父菜单不存在',
  [ErrorCode.CANNOT_SET_SELF_AS_CHILD_MENU]: '不能将菜单设置为自己的子菜单',
  [ErrorCode.MENU_HAS_CHILDREN]: '菜单存在子菜单,不能删除',
  [ErrorCode.MENU_HAS_ROLES]: '菜单已分配角色,不能删除',
  [ErrorCode.MENU_TYPE_ERROR]: '菜单类型错误',

  // 字典管理
  [ErrorCode.DICT_TYPE_NOT_FOUND]: '字典类型不存在',
  [ErrorCode.DICT_TYPE_EXISTS]: '字典类型已存在',
  [ErrorCode.DICT_DATA_NOT_FOUND]: '字典数据不存在',
  [ErrorCode.DICT_LABEL_EXISTS]: '字典标签已存在',
  [ErrorCode.DICT_TYPE_HAS_DATA]: '字典类型已分配数据,不能删除',

  // 岗位管理
  [ErrorCode.POST_NOT_FOUND]: '岗位不存在',
  [ErrorCode.POST_CODE_EXISTS]: '岗位编码已存在',
  [ErrorCode.POST_NAME_EXISTS]: '岗位名称已存在',
  [ErrorCode.POST_HAS_USERS]: '岗位已分配用户,不能删除',

  // 系统配置
  [ErrorCode.CONFIG_NOT_FOUND]: '参数配置不存在',
  [ErrorCode.CONFIG_KEY_EXISTS]: '参数键名已存在',
  [ErrorCode.CANNOT_DELETE_BUILTIN_CONFIG]: '系统内置参数,不能删除',
  [ErrorCode.NOTICE_NOT_FOUND]: '通知公告不存在',

  // 监控日志
  [ErrorCode.OPER_LOG_NOT_FOUND]: '操作日志不存在',
  [ErrorCode.LOGIN_LOG_NOT_FOUND]: '登录日志不存在',
  [ErrorCode.ONLINE_USER_NOT_FOUND]: '在线用户不存在',
  [ErrorCode.JOB_NOT_FOUND]: '定时任务不存在',
  [ErrorCode.JOB_NAME_EXISTS]: '定时任务名称已存在',
  [ErrorCode.JOB_IS_RUNNING]: '定时任务正在运行',
}

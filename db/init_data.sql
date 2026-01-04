-- =============================================
-- RBAC Admin Pro - 初始化数据脚本
-- 说明：本脚本用于初始化系统基础数据
-- 注意：密码使用 bcrypt 加密，默认密码为 admin123
-- 前置条件：需先执行 schema.sql 创建表结构和索引
-- =============================================

-- 1. 初始化部门数据（层级结构）
-- 1.1 总公司（根部门）
INSERT INTO sys_dept (dept_name, order_num, status, parent_id, ancestors, leader, phone, email, del_flag, create_time)
VALUES ('总公司', 0, '0', NULL, '0', '张总', '', '', '0', NOW())
ON CONFLICT DO NOTHING;

-- 1.2 技术部
INSERT INTO sys_dept (dept_name, order_num, status, parent_id, ancestors, leader, phone, email, del_flag, create_time)
SELECT '技术部', 1, '0', dept_id, '0,' || dept_id, '李工', '', '', '0', NOW()
FROM sys_dept WHERE dept_name = '总公司' AND del_flag = '0'
ON CONFLICT DO NOTHING;

-- 1.3 研发一部
INSERT INTO sys_dept (dept_name, order_num, status, parent_id, ancestors, leader, phone, email, del_flag, create_time)
SELECT '研发一部', 2, '0', dept_id, 
  (SELECT '0,' || parent.dept_id || ',' || child.dept_id 
   FROM sys_dept parent, sys_dept child 
   WHERE parent.dept_name = '总公司' AND child.dept_name = '技术部' AND parent.del_flag = '0' AND child.del_flag = '0'),
  '王工', '', '', '0', NOW()
FROM sys_dept WHERE dept_name = '技术部' AND del_flag = '0'
ON CONFLICT DO NOTHING;

-- 1.4 测试一部
INSERT INTO sys_dept (dept_name, order_num, status, parent_id, ancestors, leader, phone, email, del_flag, create_time)
SELECT '测试一部', 3, '0', dept_id,
  (SELECT '0,' || parent.dept_id || ',' || child.dept_id 
   FROM sys_dept parent, sys_dept child 
   WHERE parent.dept_name = '总公司' AND child.dept_name = '技术部' AND parent.del_flag = '0' AND child.del_flag = '0'),
  '赵工', '', '', '0', NOW()
FROM sys_dept WHERE dept_name = '技术部' AND del_flag = '0'
ON CONFLICT DO NOTHING;

-- 1.5 人事部
INSERT INTO sys_dept (dept_name, order_num, status, parent_id, ancestors, leader, phone, email, del_flag, create_time)
SELECT '人事部', 4, '0', dept_id, '0,' || dept_id, '刘姐', '', '', '0', NOW()
FROM sys_dept WHERE dept_name = '总公司' AND del_flag = '0'
ON CONFLICT DO NOTHING;

-- 1.6 财务部
INSERT INTO sys_dept (dept_name, order_num, status, parent_id, ancestors, leader, phone, email, del_flag, create_time)
SELECT '财务部', 5, '0', dept_id, '0,' || dept_id, '钱会', '', '', '0', NOW()
FROM sys_dept WHERE dept_name = '总公司' AND del_flag = '0'
ON CONFLICT DO NOTHING;

-- 1.7 华东分公司
INSERT INTO sys_dept (dept_name, order_num, status, parent_id, ancestors, leader, phone, email, del_flag, create_time)
SELECT '华东分公司', 6, '0', dept_id, '0,' || dept_id, '孙总', '', '', '0', NOW()
FROM sys_dept WHERE dept_name = '总公司' AND del_flag = '0'
ON CONFLICT DO NOTHING;

-- 1.8 上海办事处
INSERT INTO sys_dept (dept_name, order_num, status, parent_id, ancestors, leader, phone, email, del_flag, create_time)
SELECT '上海办事处', 7, '0', dept_id,
  (SELECT '0,' || parent.dept_id || ',' || child.dept_id 
   FROM sys_dept parent, sys_dept child 
   WHERE parent.dept_name = '总公司' AND child.dept_name = '华东分公司' AND parent.del_flag = '0' AND child.del_flag = '0'),
  '周主任', '', '', '0', NOW()
FROM sys_dept WHERE dept_name = '华东分公司' AND del_flag = '0'
ON CONFLICT DO NOTHING;

-- 1.9 杭州办事处
INSERT INTO sys_dept (dept_name, order_num, status, parent_id, ancestors, leader, phone, email, del_flag, create_time)
SELECT '杭州办事处', 8, '0', dept_id,
  (SELECT '0,' || parent.dept_id || ',' || child.dept_id 
   FROM sys_dept parent, sys_dept child 
   WHERE parent.dept_name = '总公司' AND child.dept_name = '华东分公司' AND parent.del_flag = '0' AND child.del_flag = '0'),
  '吴主任', '', '', '0', NOW()
FROM sys_dept WHERE dept_name = '华东分公司' AND del_flag = '0'
ON CONFLICT DO NOTHING;


-- 2. 初始化角色数据(所有角色启用状态)
INSERT INTO sys_role (role_name, role_key, role_sort, status, data_scope, menu_check_strictly, dept_check_strictly, del_flag, remark, create_time)
VALUES 
  ('超级管理员', 'admin', 1, '0', '1', true, true, '0', '拥有系统所有权限', NOW()),
  ('系统管理员', 'system_admin', 2, '0', '2', true, true, '0', '负责系统管理模块', NOW()),
  ('监控管理员', 'monitor_admin', 3, '0', '1', true, true, '0', '负责系统监控模块', NOW()),
  ('普通用户', 'common_user', 4, '0', '3', true, true, '0', '只读权限,无增删改权限', NOW())
ON CONFLICT DO NOTHING;


-- 3. 初始化用户数据
-- 注意：这里的密码是 bcrypt 加密后的 'admin123'，salt rounds = 10
INSERT INTO sys_user (user_name, nick_name, email, phonenumber, sex, password, status, dept_id, del_flag, remark, create_time)
SELECT 'admin', '超级管理员', 'admin@example.com', '13800000000', '0',
  '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqgBi1SY2lCb1S6Y8VpFl5K4bXKq2', -- admin123
  '0', dept_id, '0', '系统超级管理员账号', NOW()
FROM sys_dept WHERE dept_name = '总公司' AND del_flag = '0'
ON CONFLICT (user_name) WHERE del_flag = '0' DO NOTHING;

INSERT INTO sys_user (user_name, nick_name, email, phonenumber, sex, password, status, dept_id, del_flag, remark, create_time)
SELECT 'system_admin', '系统管理员', 'system@example.com', '13800000001', '0',
  '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqgBi1SY2lCb1S6Y8VpFl5K4bXKq2', -- admin123
  '0', dept_id, '0', '负责系统管理', NOW()
FROM sys_dept WHERE dept_name = '技术部' AND del_flag = '0'
ON CONFLICT (user_name) WHERE del_flag = '0' DO NOTHING;

INSERT INTO sys_user (user_name, nick_name, email, phonenumber, sex, password, status, dept_id, del_flag, remark, create_time)
SELECT 'monitor_admin', '监控管理员', 'monitor@example.com', '13800000002', '1',
  '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqgBi1SY2lCb1S6Y8VpFl5K4bXKq2', -- admin123
  '0', dept_id, '0', '负责系统监控', NOW()
FROM sys_dept WHERE dept_name = '研发一部' AND del_flag = '0'
ON CONFLICT (user_name) WHERE del_flag = '0' DO NOTHING;

INSERT INTO sys_user (user_name, nick_name, email, phonenumber, sex, password, status, dept_id, del_flag, remark, create_time)
SELECT 'user', '普通用户', 'user@example.com', '13800000003', '1',
  '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqgBi1SY2lCb1S6Y8VpFl5K4bXKq2', -- admin123
  '0', dept_id, '0', '普通用户账号', NOW()
FROM sys_dept WHERE dept_name = '测试一部' AND del_flag = '0'
ON CONFLICT (user_name) WHERE del_flag = '0' DO NOTHING;


-- 4. 绑定用户角色
-- 4.1 超级管理员
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.user_id, r.role_id
FROM sys_user u, sys_role r
WHERE u.user_name = 'admin' AND u.del_flag = '0' 
  AND r.role_key = 'admin' AND r.del_flag = '0'
ON CONFLICT DO NOTHING;

-- 4.2 系统管理员
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.user_id, r.role_id
FROM sys_user u, sys_role r
WHERE u.user_name = 'system_admin' AND u.del_flag = '0'
  AND r.role_key = 'system_admin' AND r.del_flag = '0'
ON CONFLICT DO NOTHING;

-- 4.3 监控管理员
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.user_id, r.role_id
FROM sys_user u, sys_role r
WHERE u.user_name = 'monitor_admin' AND u.del_flag = '0'
  AND r.role_key = 'monitor_admin' AND r.del_flag = '0'
ON CONFLICT DO NOTHING;

-- 4.4 普通用户
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.user_id, r.role_id
FROM sys_user u, sys_role r
WHERE u.user_name = 'user' AND u.del_flag = '0'
  AND r.role_key = 'common_user' AND r.del_flag = '0'
ON CONFLICT DO NOTHING;


-- 5. 初始化岗位数据
INSERT INTO sys_post (post_code, post_name, post_sort, status, create_time)
VALUES 
  ('dev', '开发', 1, '0', NOW()),
  ('pm', '产品经理', 2, '0', NOW())
ON CONFLICT (post_code) DO NOTHING;


-- 6. 绑定用户岗位
INSERT INTO sys_user_post (user_id, post_id)
SELECT u.user_id, p.post_id
FROM sys_user u, sys_post p
WHERE u.user_name = 'admin' AND u.del_flag = '0' AND p.post_code = 'dev'
ON CONFLICT DO NOTHING;

INSERT INTO sys_user_post (user_id, post_id)
SELECT u.user_id, p.post_id
FROM sys_user u, sys_post p
WHERE u.user_name = 'system_admin' AND u.del_flag = '0' AND p.post_code = 'dev'
ON CONFLICT DO NOTHING;

INSERT INTO sys_user_post (user_id, post_id)
SELECT u.user_id, p.post_id
FROM sys_user u, sys_post p
WHERE u.user_name = 'monitor_admin' AND u.del_flag = '0' AND p.post_code = 'dev'
ON CONFLICT DO NOTHING;

INSERT INTO sys_user_post (user_id, post_id)
SELECT u.user_id, p.post_id
FROM sys_user u, sys_post p
WHERE u.user_name = 'user' AND u.del_flag = '0' AND p.post_code = 'pm'
ON CONFLICT DO NOTHING;


-- 7. 初始化字典类型
INSERT INTO sys_dict_type (dict_name, dict_type, status, create_time)
VALUES
  ('显示隐藏', 'sys_show_hide', '0', NOW()),
  ('正常停用', 'sys_normal_disable', '0', NOW()),
  ('是否', 'sys_yes_no', '0', NOW()),
  ('用户性别', 'sys_user_sex', '0', NOW()),
  ('任务状态', 'sys_job_status', '0', NOW()),
  ('任务分组', 'sys_job_group', '0', NOW()),
  ('通知类型', 'sys_notice_type', '0', NOW()),
  ('通知状态', 'sys_notice_status', '0', NOW()),
  ('操作类型', 'sys_oper_type', '0', NOW()),
  ('通用状态', 'sys_common_status', '0', NOW())
ON CONFLICT (dict_type) DO NOTHING;


-- 8. 初始化字典数据
INSERT INTO sys_dict_data (dict_type, dict_label, dict_value, dict_sort, status, is_default, create_time)
VALUES
  -- 显示隐藏
  ('sys_show_hide', '显示', '0', 1, '0', 'N', NOW()),
  ('sys_show_hide', '隐藏', '1', 2, '0', 'N', NOW()),
  -- 正常停用
  ('sys_normal_disable', '正常', '0', 1, '0', 'Y', NOW()),
  ('sys_normal_disable', '停用', '1', 2, '0', 'N', NOW()),
  -- 是否
  ('sys_yes_no', '是', 'Y', 1, '0', 'Y', NOW()),
  ('sys_yes_no', '否', 'N', 2, '0', 'N', NOW()),
  -- 用户性别
  ('sys_user_sex', '男', '0', 1, '0', 'N', NOW()),
  ('sys_user_sex', '女', '1', 2, '0', 'N', NOW()),
  ('sys_user_sex', '未知', '2', 3, '0', 'Y', NOW()),
  -- 任务状态
  ('sys_job_status', '正常', '0', 1, '0', 'Y', NOW()),
  ('sys_job_status', '暂停', '1', 2, '0', 'N', NOW()),
  -- 任务分组
  ('sys_job_group', 'DEFAULT', 'DEFAULT', 1, '0', 'Y', NOW()),
  ('sys_job_group', 'SYSTEM', 'SYSTEM', 2, '0', 'N', NOW()),
  -- 通知类型
  ('sys_notice_type', '通知', '1', 1, '0', 'N', NOW()),
  ('sys_notice_type', '公告', '2', 2, '0', 'N', NOW()),
  -- 通知状态
  ('sys_notice_status', '正常', '0', 1, '0', 'Y', NOW()),
  ('sys_notice_status', '关闭', '1', 2, '0', 'N', NOW()),
  -- 操作类型
  ('sys_oper_type', '其它', '0', 0, '0', 'N', NOW()),
  ('sys_oper_type', '新增', '1', 1, '0', 'N', NOW()),
  ('sys_oper_type', '修改', '2', 2, '0', 'N', NOW()),
  ('sys_oper_type', '删除', '3', 3, '0', 'N', NOW()),
  ('sys_oper_type', '授权', '4', 4, '0', 'N', NOW()),
  ('sys_oper_type', '导出', '5', 5, '0', 'N', NOW()),
  ('sys_oper_type', '导入', '6', 6, '0', 'N', NOW()),
  ('sys_oper_type', '强退', '7', 7, '0', 'N', NOW()),
  ('sys_oper_type', '生成代码', '8', 8, '0', 'N', NOW()),
  ('sys_oper_type', '清空数据', '9', 9, '0', 'N', NOW()),
  -- 通用状态
  ('sys_common_status', '成功', '0', 1, '0', 'Y', NOW()),
  ('sys_common_status', '失败', '1', 2, '0', 'N', NOW())
ON CONFLICT (dict_type, dict_value) DO NOTHING;


-- 9. 初始化系统配置
INSERT INTO sys_config (config_name, config_key, config_value, config_type, create_time)
VALUES
  -- 账户安全设置
  ('初始密码', 'sys.account.initPassword', 'admin123', 'Y', NOW()),
  ('验证码开关', 'sys.account.captchaEnabled', 'false', 'Y', NOW()),
  ('两步验证开关', 'sys.account.twoFactorEnabled', 'false', 'Y', NOW()),

  -- 网站信息设置
  ('网站名称', 'sys.app.name', 'RBAC Admin Pro', 'Y', NOW()),
  ('网站描述', 'sys.app.description', '企业级全栈权限管理系统', 'Y', NOW()),
  ('版权信息', 'sys.app.copyright', '© 2025 RBAC Admin Pro. All rights reserved.', 'Y', NOW()),
  ('ICP备案号', 'sys.app.icp', '', 'Y', NOW()),
  ('联系邮箱', 'sys.app.email', 'admin@example.com', 'Y', NOW()),
  -- 邮件设置
  ('邮件服务开关', 'sys.mail.enabled', 'false', 'Y', NOW()),
  ('SMTP服务器', 'sys.mail.host', '', 'Y', NOW()),
  ('SMTP端口', 'sys.mail.port', '465', 'Y', NOW()),
  ('邮箱账号', 'sys.mail.username', '', 'Y', NOW()),
  ('邮箱密码', 'sys.mail.password', '', 'Y', NOW()),
  ('发件人地址', 'sys.mail.from', '', 'Y', NOW()),
  -- 存储设置
  ('存储类型', 'sys.storage.type', 'local', 'Y', NOW()),
  ('本地存储路径', 'sys.storage.local.path', './uploads', 'Y', NOW()),
  ('OSS端点', 'sys.storage.oss.endpoint', '', 'Y', NOW()),
  ('OSS存储桶', 'sys.storage.oss.bucket', '', 'Y', NOW()),
  ('OSS AccessKey', 'sys.storage.oss.accessKey', '', 'Y', NOW()),
  ('OSS SecretKey', 'sys.storage.oss.secretKey', '', 'Y', NOW()),
  -- 网站Logo和图标
  ('网站Logo', 'sys.app.logo', '', 'Y', NOW()),
  ('网站图标', 'sys.app.favicon', '', 'Y', NOW()),

  -- 安全入口
  ('安全登录路径', 'sys.security.loginPath', '/login', 'Y', NOW()),
  -- 登录限制
  ('登录失败次数', 'sys.login.maxRetry', '5', 'Y', NOW()),
  ('账户锁定时长', 'sys.login.lockTime', '10', 'Y', NOW()),
  -- 会话设置
  ('会话超时时间', 'sys.session.timeout', '30', 'Y', NOW()),
  -- 邮件SSL
  ('SSL/TLS开关', 'sys.mail.ssl', 'true', 'Y', NOW())
ON CONFLICT (config_key) DO NOTHING;


-- 10. 初始化通知公告
INSERT INTO sys_notice (notice_title, notice_type, notice_content, status, create_time)
VALUES ('系统维护', '2', '本周日凌晨进行系统维护。', '0', NOW())
ON CONFLICT DO NOTHING;


-- 11. 初始化定时任务
INSERT INTO sys_job (job_name, job_group, invoke_target, cron_expression, misfire_policy, concurrent, status, create_time)
VALUES ('示例任务', 'DEFAULT', 'log:示例任务执行成功', '0/30 * * * * *', '3', '1', '0', NOW())
ON CONFLICT DO NOTHING;


-- 12. 初始化菜单数据
-- 12.1 系统管理目录
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
VALUES ('系统管理', 'system', 'Layout', 1, 'M', '0', '0', 'settings', 1, NULL, NULL)
ON CONFLICT DO NOTHING;

-- 12.2 系统管理子菜单
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '用户管理', 'user', 'system/user/index', 1, 'C', '0', '0', 'user', 1, menu_id, 'system:user:list'
FROM sys_menu WHERE path = 'system' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '角色管理', 'role', 'system/role/index', 2, 'C', '0', '0', 'users', 1, menu_id, 'system:role:list'
FROM sys_menu WHERE path = 'system' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '菜单管理', 'menu', 'system/menu/index', 3, 'C', '0', '0', 'menu', 1, menu_id, 'system:menu:list'
FROM sys_menu WHERE path = 'system' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '部门管理', 'dept', 'system/dept/index', 4, 'C', '0', '0', 'building-2', 1, menu_id, 'system:dept:list'
FROM sys_menu WHERE path = 'system' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '岗位管理', 'post', 'system/post/index', 5, 'C', '0', '0', 'badge-check', 1, menu_id, 'system:post:list'
FROM sys_menu WHERE path = 'system' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '字典管理', 'dict', 'system/dict/index', 6, 'C', '0', '0', 'book-a', 1, menu_id, 'system:dict:list'
FROM sys_menu WHERE path = 'system' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '参数设置', 'config', 'system/config/index', 7, 'C', '0', '0', 'settings-2', 1, menu_id, 'system:config:list'
FROM sys_menu WHERE path = 'system' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '系统设置', 'setting', 'system/setting/index', 8, 'C', '0', '0', 'sliders-vertical', 1, menu_id, 'system:setting:view'
FROM sys_menu WHERE path = 'system' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '通知公告', 'notice', 'system/notice/index', 9, 'C', '0', '0', 'megaphone', 1, menu_id, 'system:notice:list'
FROM sys_menu WHERE path = 'system' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '更新日志', 'changelog', 'system/changelog/index', 10, 'C', '0', '0', 'scroll-text', 1, menu_id, NULL
FROM sys_menu WHERE path = 'system' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 12.3 系统监控目录
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
VALUES ('系统监控', 'monitor', 'Layout', 2, 'M', '0', '0', 'monitor', 1, NULL, NULL)
ON CONFLICT DO NOTHING;

-- 12.4 系统监控子菜单
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '在线用户', 'online', 'monitor/online/index', 1, 'C', '0', '0', 'user-check', 1, menu_id, 'monitor:online:list'
FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '操作日志', 'operlog', 'monitor/operlog/index', 2, 'C', '0', '0', 'list', 1, menu_id, 'monitor:operlog:list'
FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '登录日志', 'logininfor', 'monitor/logininfor/index', 3, 'C', '0', '0', 'log-in', 1, menu_id, 'monitor:logininfor:list'
FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '定时任务', 'job', 'monitor/job/index', 4, 'C', '0', '0', 'alarm-clock', 1, menu_id, 'monitor:job:list'
FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '服务监控', 'server', 'monitor/server/index', 5, 'C', '0', '0', 'server', 1, menu_id, 'monitor:server:list'
FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '缓存监控', 'cache', 'monitor/cache/index', 6, 'C', '0', '0', 'database-backup', 1, menu_id, 'monitor:cache:view'
FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '数据监控', 'druid', 'monitor/druid/index', 7, 'C', '0', '0', 'database', 1, menu_id, 'monitor:druid:view'
FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

-- 12.5 系统工具目录
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
VALUES ('系统工具', 'tool', 'Layout', 3, 'M', '0', '0', 'wrench', 1, NULL, NULL)
ON CONFLICT DO NOTHING;

-- 12.6 系统工具子菜单
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '接口文档', 'apidoc', 'tool/swagger/index', 1, 'C', '0', '0', 'file-text', 1, menu_id, 'tool:apidoc:view'
FROM sys_menu WHERE path = 'tool' AND parent_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '表单构建', 'build', 'tool/build/index', 2, 'C', '0', '0', 'factory', 1, menu_id, 'tool:build:view'
FROM sys_menu WHERE path = 'tool' AND parent_id IS NULL
ON CONFLICT DO NOTHING;


-- 13. 初始化按钮权限（F 类型）
-- 13.1 用户管理按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '用户查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'system:user:query'
FROM sys_menu WHERE path = 'user' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '用户新增', '', '', 2, 'F', '1', '0', '#', 1, menu_id, 'system:user:add'
FROM sys_menu WHERE path = 'user' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '用户修改', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'system:user:edit'
FROM sys_menu WHERE path = 'user' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '用户删除', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'system:user:remove'
FROM sys_menu WHERE path = 'user' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '重置密码', '', '', 5, 'F', '1', '0', '#', 1, menu_id, 'system:user:resetPwd'
FROM sys_menu WHERE path = 'user' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '用户导出', '', '', 6, 'F', '1', '0', '#', 1, menu_id, 'system:user:export'
FROM sys_menu WHERE path = 'user' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '用户导入', '', '', 7, 'F', '1', '0', '#', 1, menu_id, 'system:user:import'
FROM sys_menu WHERE path = 'user' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.2 角色管理按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '角色查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'system:role:query'
FROM sys_menu WHERE path = 'role' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '角色新增', '', '', 2, 'F', '1', '0', '#', 1, menu_id, 'system:role:add'
FROM sys_menu WHERE path = 'role' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '角色修改', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'system:role:edit'
FROM sys_menu WHERE path = 'role' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '角色删除', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'system:role:remove'
FROM sys_menu WHERE path = 'role' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.3 菜单管理按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '菜单查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'system:menu:query'
FROM sys_menu WHERE path = 'menu' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '菜单新增', '', '', 2, 'F', '1', '0', '#', 1, menu_id, 'system:menu:add'
FROM sys_menu WHERE path = 'menu' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '菜单修改', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'system:menu:edit'
FROM sys_menu WHERE path = 'menu' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '菜单删除', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'system:menu:remove'
FROM sys_menu WHERE path = 'menu' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.4 部门管理按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '部门查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'system:dept:query'
FROM sys_menu WHERE path = 'dept' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '部门新增', '', '', 2, 'F', '1', '0', '#', 1, menu_id, 'system:dept:add'
FROM sys_menu WHERE path = 'dept' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '部门修改', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'system:dept:edit'
FROM sys_menu WHERE path = 'dept' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '部门删除', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'system:dept:remove'
FROM sys_menu WHERE path = 'dept' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.5 岗位管理按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '岗位查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'system:post:query'
FROM sys_menu WHERE path = 'post' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '岗位新增', '', '', 2, 'F', '1', '0', '#', 1, menu_id, 'system:post:add'
FROM sys_menu WHERE path = 'post' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '岗位修改', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'system:post:edit'
FROM sys_menu WHERE path = 'post' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '岗位删除', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'system:post:remove'
FROM sys_menu WHERE path = 'post' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.6 字典管理按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '字典查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'system:dict:query'
FROM sys_menu WHERE path = 'dict' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '字典新增', '', '', 2, 'F', '1', '0', '#', 1, menu_id, 'system:dict:add'
FROM sys_menu WHERE path = 'dict' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '字典修改', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'system:dict:edit'
FROM sys_menu WHERE path = 'dict' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '字典删除', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'system:dict:remove'
FROM sys_menu WHERE path = 'dict' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.7 参数设置按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '参数查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'system:config:query'
FROM sys_menu WHERE path = 'config' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '参数新增', '', '', 2, 'F', '1', '0', '#', 1, menu_id, 'system:config:add'
FROM sys_menu WHERE path = 'config' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '参数修改', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'system:config:edit'
FROM sys_menu WHERE path = 'config' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '参数删除', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'system:config:remove'
FROM sys_menu WHERE path = 'config' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.8 通知公告按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '公告查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'system:notice:query'
FROM sys_menu WHERE path = 'notice' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '公告新增', '', '', 2, 'F', '1', '0', '#', 1, menu_id, 'system:notice:add'
FROM sys_menu WHERE path = 'notice' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '公告修改', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'system:notice:edit'
FROM sys_menu WHERE path = 'notice' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '公告删除', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'system:notice:remove'
FROM sys_menu WHERE path = 'notice' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.9 定时任务按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '任务查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'monitor:job:query'
FROM sys_menu WHERE path = 'job' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '任务新增', '', '', 2, 'F', '1', '0', '#', 1, menu_id, 'monitor:job:add'
FROM sys_menu WHERE path = 'job' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '任务修改', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'monitor:job:edit'
FROM sys_menu WHERE path = 'job' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '任务删除', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'monitor:job:remove'
FROM sys_menu WHERE path = 'job' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '状态变更', '', '', 5, 'F', '1', '0', '#', 1, menu_id, 'monitor:job:changeStatus'
FROM sys_menu WHERE path = 'job' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.10 缓存监控按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '清理指定', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'monitor:cache:clearName'
FROM sys_menu WHERE path = 'cache' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '清理全部', '', '', 2, 'F', '1', '0', '#', 1, menu_id, 'monitor:cache:clearAll'
FROM sys_menu WHERE path = 'cache' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.11 在线用户按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '强退用户', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'monitor:online:forceLogout'
FROM sys_menu WHERE path = 'online' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.12 操作日志按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '日志删除', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'monitor:operlog:remove'
FROM sys_menu WHERE path = 'operlog' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 13.13 登录日志按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '日志删除', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'monitor:logininfor:remove'
FROM sys_menu WHERE path = 'logininfor' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;


-- 14. 为不同角色分配菜单权限
-- 14.1 超级管理员 - 拥有所有权限
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.role_id, m.menu_id
FROM sys_role r, sys_menu m
WHERE r.role_key = 'admin' AND r.del_flag = '0'
ON CONFLICT DO NOTHING;

-- 14.2 系统管理员 - 拥有系统管理模块的所有权限
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.role_id, m.menu_id
FROM sys_role r, sys_menu m
WHERE r.role_key = 'system_admin' AND r.del_flag = '0'
  AND (
    -- 系统管理目录
    (m.path = 'system' AND m.parent_id IS NULL)
    -- 系统管理下的所有菜单和按钮
    OR m.parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
    OR m.parent_id IN (
      SELECT menu_id FROM sys_menu 
      WHERE parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
    )
  )
ON CONFLICT DO NOTHING;

-- 14.3 监控管理员 - 拥有系统监控模块的所有权限
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.role_id, m.menu_id
FROM sys_role r, sys_menu m
WHERE r.role_key = 'monitor_admin' AND r.del_flag = '0'
  AND (
    -- 系统监控目录
    (m.path = 'monitor' AND m.parent_id IS NULL)
    -- 系统监控下的所有菜单和按钮
    OR m.parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
    OR m.parent_id IN (
      SELECT menu_id FROM sys_menu 
      WHERE parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
    )
    -- 系统工具(接口文档)
    OR (m.path = 'tool' AND m.parent_id IS NULL)
    OR m.path = 'apidoc'
  )
ON CONFLICT DO NOTHING;

-- 14.4 普通用户 - 只有查看权限,无增删改权限
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.role_id, m.menu_id
FROM sys_role r, sys_menu m
WHERE r.role_key = 'common_user' AND r.del_flag = '0'
  AND (
    -- 系统管理目录(只读)
    (m.path = 'system' AND m.parent_id IS NULL)
    -- 系统管理下的菜单(不包括按钮)
    OR (m.parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL) AND m.menu_type = 'C')
    -- 系统监控目录(只读)
    OR (m.path = 'monitor' AND m.parent_id IS NULL)
    -- 系统监控下的菜单(不包括按钮)
    OR (m.parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL) AND m.menu_type = 'C')
  )
ON CONFLICT DO NOTHING;


-- 15. 任务日志样例
INSERT INTO sys_job_log (job_name, job_group, invoke_target, job_message, status, exception_info, create_time)
VALUES 
  ('示例任务', 'DEFAULT', 'log:示例任务执行成功', '执行成功', '0', '', NOW()),
  ('示例任务', 'DEFAULT', 'log:示例任务执行成功', '执行失败：模拟异常', '1', 'MockError: something wrong', NOW())
ON CONFLICT DO NOTHING;


-- 16. 登录日志样例
INSERT INTO sys_login_log (user_name, ipaddr, browser, os, status, msg, login_time)
VALUES 
  ('admin', '127.0.0.1', 'Chrome', 'macOS', '0', '登录成功', NOW()),
  ('user', '127.0.0.1', 'Chrome', 'macOS', '1', '密码错误', NOW())
ON CONFLICT DO NOTHING;


-- 17. 操作日志样例
INSERT INTO sys_oper_log (title, business_type, method, request_method, oper_name, dept_name, oper_url, oper_ip, oper_location, oper_param, json_result, status, oper_time)
VALUES 
  ('部门管理', 1, 'DeptController.create', 'POST', 'admin', '总公司', '/system/dept', '127.0.0.1', '内网', '{"deptName":"技术部"}', '{"code":200}', 0, NOW()),
  ('岗位管理', 3, 'PostController.remove', 'DELETE', 'admin', '总公司', '/system/post', '127.0.0.1', '内网', '{"ids":"1,2"}', '{"code":200}', 0, NOW())
ON CONFLICT DO NOTHING;


-- 提示信息
DO $$
DECLARE
  menu_count INTEGER;
  role_menu_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO menu_count FROM sys_menu;
  SELECT COUNT(*) INTO role_menu_count FROM sys_role_menu WHERE role_id = (SELECT role_id FROM sys_role WHERE role_key = 'admin' AND del_flag = '0');
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '初始化数据导入完成！';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '默认账号(密码均为 admin123)：';
  RAISE NOTICE '- admin - 超级管理员';
  RAISE NOTICE '- system_admin - 系统管理员';
  RAISE NOTICE '- monitor_admin - 监控管理员';
  RAISE NOTICE '- user - 普通用户';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '数据统计：';
  RAISE NOTICE '- 部门：9 个';
  RAISE NOTICE '- 角色：4 个(全部启用)';
  RAISE NOTICE '- 用户：4 个';
  RAISE NOTICE '  * admin - 超级管理员(所有权限)';
  RAISE NOTICE '  * system_admin - 系统管理员(系统管理模块)';
  RAISE NOTICE '  * monitor_admin - 监控管理员(系统监控模块)';
  RAISE NOTICE '  * user - 普通用户(只读权限)';
  RAISE NOTICE '- 岗位：2 个';
  RAISE NOTICE '- 菜单：% 个', menu_count;
  RAISE NOTICE '- 超级管理员权限：% 个菜单', role_menu_count;
  RAISE NOTICE '- 字典类型：10 个';
  RAISE NOTICE '- 字典数据：29 条';
  RAISE NOTICE '- 系统配置：27 条';
  RAISE NOTICE '- 任务日志样例：2 条';
  RAISE NOTICE '- 登录日志样例：2 条';
  RAISE NOTICE '- 操作日志样例：2 条';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '注意事项：';
  RAISE NOTICE '1. 生产环境请立即修改默认密码';
  RAISE NOTICE '2. 本脚本与 Prisma seed.ts 保持完全一致';
  RAISE NOTICE '3. 可重复执行，使用 ON CONFLICT DO NOTHING';
  RAISE NOTICE '==============================================';
END $$;


-- =============================================
-- 补充缺失的按钮权限
-- =============================================

-- 操作日志按钮补充
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '日志查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'monitor:operlog:query'
FROM sys_menu WHERE path = 'operlog' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '日志导出', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'monitor:operlog:export'
FROM sys_menu WHERE path = 'operlog' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '日志清空', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'monitor:operlog:clear'
FROM sys_menu WHERE path = 'operlog' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 登录日志按钮补充
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '日志查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'monitor:logininfor:query'
FROM sys_menu WHERE path = 'logininfor' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '日志导出', '', '', 3, 'F', '1', '0', '#', 1, menu_id, 'monitor:logininfor:export'
FROM sys_menu WHERE path = 'logininfor' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '日志清空', '', '', 4, 'F', '1', '0', '#', 1, menu_id, 'monitor:logininfor:clear'
FROM sys_menu WHERE path = 'logininfor' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '账户解锁', '', '', 5, 'F', '1', '0', '#', 1, menu_id, 'monitor:logininfor:unlock'
FROM sys_menu WHERE path = 'logininfor' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 在线用户按钮补充
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '用户查询', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'monitor:online:query'
FROM sys_menu WHERE path = 'online' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 定时任务按钮补充
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '立即执行', '', '', 6, 'F', '1', '0', '#', 1, menu_id, 'monitor:job:run'
FROM sys_menu WHERE path = 'job' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '查看日志', '', '', 7, 'F', '1', '0', '#', 1, menu_id, 'monitor:job:log'
FROM sys_menu WHERE path = 'job' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'monitor' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 系统设置按钮
INSERT INTO sys_menu (menu_name, path, component, order_num, menu_type, visible, status, icon, is_frame, parent_id, perms)
SELECT '设置修改', '', '', 1, 'F', '1', '0', '#', 1, menu_id, 'system:setting:edit'
FROM sys_menu WHERE path = 'setting' AND parent_id = (SELECT menu_id FROM sys_menu WHERE path = 'system' AND parent_id IS NULL)
ON CONFLICT DO NOTHING;

-- 为超级管理员分配新增的按钮权限
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.role_id, m.menu_id
FROM sys_role r, sys_menu m
WHERE r.role_key = 'admin' AND r.del_flag = '0'
  AND m.menu_id NOT IN (SELECT menu_id FROM sys_role_menu WHERE role_id = r.role_id)
ON CONFLICT DO NOTHING;

-- 为监控管理员分配新增的监控模块按钮权限
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.role_id, m.menu_id
FROM sys_role r, sys_menu m
WHERE r.role_key = 'monitor_admin' AND r.del_flag = '0'
  AND m.perms LIKE 'monitor:%'
  AND m.menu_id NOT IN (SELECT menu_id FROM sys_role_menu WHERE role_id = r.role_id)
ON CONFLICT DO NOTHING;

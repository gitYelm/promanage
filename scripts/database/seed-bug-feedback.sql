-- Bug 反馈系统基础数据（幂等）
-- 用途：在已有 RBAC 基础库上补齐 Bug 角色、菜单、权限、字典和默认项目。
BEGIN;

WITH role_data(role_name, role_key, role_sort, remark) AS (
  VALUES
    ('Bug 项目负责人','bug_project_owner',20,'管理项目内 Bug、成员、分派和统计'),
    ('Bug 产品负责人','bug_product_owner',21,'确认 Bug 有效性并分派处理'),
    ('Bug 开发人员','bug_developer',22,'处理分派给自己的 Bug'),
    ('Bug 测试人员','bug_tester',23,'提交、验证和关闭 Bug'),
    ('Bug 提交人','bug_submitter',24,'提交并跟踪本人 Bug'),
    ('Bug 运营客服','bug_operator',25,'内部代提交和协助跟进 Bug')
)
INSERT INTO sys_role (role_name, role_key, role_sort, data_scope, menu_check_strictly, dept_check_strictly, status, del_flag, remark)
SELECT role_name, role_key, role_sort, '2', true, true, '0', '0', remark FROM role_data
ON CONFLICT (role_key, del_flag) DO UPDATE SET role_name = EXCLUDED.role_name, status = '0', remark = EXCLUDED.remark;

INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon)
SELECT 'Bug 管理', NULL, 4, '/bug', 'Layout', 1, 0, 'M', '0', '0', NULL, 'bug'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id IS NULL AND path = '/bug');

WITH root_menu AS (
  SELECT menu_id FROM sys_menu WHERE parent_id IS NULL AND path = '/bug' ORDER BY menu_id LIMIT 1
), page_data(menu_name, path, component, perms, icon, order_num) AS (
  VALUES
    ('Bug 列表','tickets','bug/tickets/index','bug:ticket:list','list-checks',1),
    ('我的 Bug','my','bug/tickets/index','bug:ticket:my','user-check',2),
    ('提交 Bug','create','bug/tickets/create','bug:ticket:add','plus-square',3),
    ('Bug 看板','statistics','bug/statistics/index','bug:statistics:view','bar-chart-3',4),
    ('项目管理','projects','bug/projects/index','bug:project:list','folder-kanban',5),
    ('模块管理','modules','bug/modules/index','bug:module:list','blocks',6),
    ('版本管理','versions','bug/versions/index','bug:version:list','git-branch',7)
)
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon)
SELECT d.menu_name, r.menu_id, d.order_num, d.path, d.component, 1, 0, 'C', '0', '0', d.perms, d.icon
FROM page_data d CROSS JOIN root_menu r
WHERE NOT EXISTS (SELECT 1 FROM sys_menu m WHERE m.parent_id = r.menu_id AND m.path = d.path)
ON CONFLICT DO NOTHING;

WITH root_menu AS (SELECT menu_id FROM sys_menu WHERE parent_id IS NULL AND path = '/bug' LIMIT 1),
button_data(menu_name, parent_path, perms, order_num) AS (
  VALUES
    ('Bug 详情','tickets','bug:ticket:query',1),('Bug 编辑','tickets','bug:ticket:edit',2),('Bug 删除','tickets','bug:ticket:remove',3),
    ('Bug 指派','tickets','bug:ticket:assign',4),('状态变更','tickets','bug:ticket:changeStatus',5),('Bug 确认','tickets','bug:ticket:confirm',6),
    ('Bug 驳回','tickets','bug:ticket:reject',7),('开始修复','tickets','bug:ticket:startFix',8),('提交验证','tickets','bug:ticket:submitVerify',9),
    ('验证 Bug','tickets','bug:ticket:verify',10),('关闭 Bug','tickets','bug:ticket:close',11),('重新打开','tickets','bug:ticket:reopen',12),
    ('新增评论','tickets','bug:comment:add',13),('上传附件','tickets','bug:attachment:upload',14),('删除附件','tickets','bug:attachment:remove',15),
    ('项目查询','projects','bug:project:query',1),('项目新增','projects','bug:project:add',2),('项目修改','projects','bug:project:edit',3),('项目删除','projects','bug:project:remove',4),('项目成员','projects','bug:project:member',5),
    ('模块查询','modules','bug:module:query',1),('模块新增','modules','bug:module:add',2),('模块修改','modules','bug:module:edit',3),('模块删除','modules','bug:module:remove',4),
    ('版本查询','versions','bug:version:query',1),('版本新增','versions','bug:version:add',2),('版本修改','versions','bug:version:edit',3),('版本删除','versions','bug:version:remove',4),
    ('统计导出','statistics','bug:statistics:export',1)
)
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon)
SELECT d.menu_name, p.menu_id, d.order_num, '', NULL, 1, 0, 'F', '1', '0', d.perms, '#'
FROM button_data d JOIN root_menu r ON true JOIN sys_menu p ON p.path = d.parent_path AND p.parent_id = r.menu_id
WHERE NOT EXISTS (SELECT 1 FROM sys_menu x WHERE x.perms = d.perms)
ON CONFLICT DO NOTHING;

WITH root_menu AS (SELECT menu_id FROM sys_menu WHERE parent_id IS NULL AND path = '/bug' LIMIT 1),
bug_menus AS (
  SELECT menu_id FROM sys_menu WHERE menu_id IN (SELECT menu_id FROM root_menu)
  UNION
  SELECT menu_id FROM sys_menu WHERE parent_id IN (SELECT menu_id FROM root_menu)
  UNION
  SELECT c.menu_id FROM sys_menu c JOIN sys_menu p ON c.parent_id = p.menu_id WHERE p.parent_id IN (SELECT menu_id FROM root_menu)
)
DELETE FROM sys_role_menu srm
USING sys_role r, bug_menus m
WHERE srm.role_id = r.role_id AND srm.menu_id = m.menu_id AND r.role_key LIKE 'bug_%';

WITH root_menu AS (SELECT menu_id FROM sys_menu WHERE parent_id IS NULL AND path = '/bug' LIMIT 1),
bug_menus AS (
  SELECT menu_id FROM sys_menu WHERE menu_id IN (SELECT menu_id FROM root_menu)
  UNION
  SELECT menu_id FROM sys_menu WHERE parent_id IN (SELECT menu_id FROM root_menu)
  UNION
  SELECT c.menu_id FROM sys_menu c JOIN sys_menu p ON c.parent_id = p.menu_id WHERE p.parent_id IN (SELECT menu_id FROM root_menu)
),
role_data(role_key) AS (
  VALUES ('bug_project_owner'),('bug_product_owner'),('bug_developer'),('bug_tester'),('bug_submitter'),('bug_operator')
),
role_permissions(role_key, perms) AS (
  VALUES
    ('bug_project_owner','bug:ticket:list'),('bug_project_owner','bug:ticket:my'),('bug_project_owner','bug:ticket:add'),('bug_project_owner','bug:ticket:query'),('bug_project_owner','bug:ticket:edit'),('bug_project_owner','bug:ticket:assign'),('bug_project_owner','bug:ticket:changeStatus'),('bug_project_owner','bug:ticket:confirm'),('bug_project_owner','bug:ticket:reject'),('bug_project_owner','bug:ticket:verify'),('bug_project_owner','bug:ticket:close'),('bug_project_owner','bug:ticket:reopen'),('bug_project_owner','bug:comment:add'),('bug_project_owner','bug:attachment:upload'),('bug_project_owner','bug:attachment:remove'),('bug_project_owner','bug:statistics:view'),('bug_project_owner','bug:statistics:export'),('bug_project_owner','bug:project:list'),('bug_project_owner','bug:project:query'),('bug_project_owner','bug:project:add'),('bug_project_owner','bug:project:edit'),('bug_project_owner','bug:project:member'),('bug_project_owner','bug:module:list'),('bug_project_owner','bug:module:query'),('bug_project_owner','bug:module:add'),('bug_project_owner','bug:module:edit'),('bug_project_owner','bug:module:remove'),('bug_project_owner','bug:version:list'),('bug_project_owner','bug:version:query'),('bug_project_owner','bug:version:add'),('bug_project_owner','bug:version:edit'),('bug_project_owner','bug:version:remove'),
    ('bug_product_owner','bug:ticket:list'),('bug_product_owner','bug:ticket:my'),('bug_product_owner','bug:ticket:add'),('bug_product_owner','bug:ticket:query'),('bug_product_owner','bug:ticket:edit'),('bug_product_owner','bug:ticket:assign'),('bug_product_owner','bug:ticket:changeStatus'),('bug_product_owner','bug:ticket:confirm'),('bug_product_owner','bug:ticket:reject'),('bug_product_owner','bug:ticket:reopen'),('bug_product_owner','bug:comment:add'),('bug_product_owner','bug:attachment:upload'),('bug_product_owner','bug:attachment:remove'),('bug_product_owner','bug:statistics:view'),('bug_product_owner','bug:statistics:export'),('bug_product_owner','bug:project:list'),('bug_product_owner','bug:module:list'),('bug_product_owner','bug:version:list'),
    ('bug_developer','bug:ticket:list'),('bug_developer','bug:ticket:my'),('bug_developer','bug:ticket:add'),('bug_developer','bug:ticket:query'),('bug_developer','bug:ticket:startFix'),('bug_developer','bug:ticket:submitVerify'),('bug_developer','bug:comment:add'),('bug_developer','bug:attachment:upload'),('bug_developer','bug:attachment:remove'),
    ('bug_tester','bug:ticket:list'),('bug_tester','bug:ticket:my'),('bug_tester','bug:ticket:add'),('bug_tester','bug:ticket:query'),('bug_tester','bug:ticket:edit'),('bug_tester','bug:ticket:changeStatus'),('bug_tester','bug:ticket:confirm'),('bug_tester','bug:ticket:reject'),('bug_tester','bug:ticket:verify'),('bug_tester','bug:ticket:close'),('bug_tester','bug:ticket:reopen'),('bug_tester','bug:comment:add'),('bug_tester','bug:attachment:upload'),('bug_tester','bug:attachment:remove'),
    ('bug_submitter','bug:ticket:my'),('bug_submitter','bug:ticket:add'),('bug_submitter','bug:ticket:query'),('bug_submitter','bug:ticket:edit'),('bug_submitter','bug:ticket:reopen'),('bug_submitter','bug:comment:add'),('bug_submitter','bug:attachment:upload'),('bug_submitter','bug:attachment:remove'),
    ('bug_operator','bug:ticket:list'),('bug_operator','bug:ticket:my'),('bug_operator','bug:ticket:add'),('bug_operator','bug:ticket:query'),('bug_operator','bug:ticket:edit'),('bug_operator','bug:comment:add'),('bug_operator','bug:attachment:upload'),('bug_operator','bug:attachment:remove')
)
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT r.role_id, m.menu_id FROM role_data d JOIN sys_role r ON r.role_key = d.role_key CROSS JOIN root_menu m
UNION
SELECT r.role_id, m.menu_id FROM role_permissions rp JOIN sys_role r ON r.role_key = rp.role_key JOIN sys_menu m ON m.perms = rp.perms WHERE m.menu_id IN (SELECT menu_id FROM bug_menus)
ON CONFLICT DO NOTHING;

INSERT INTO sys_dict_type (dict_name, dict_type, status)
VALUES
  ('Bug 状态','bug_status','0'),('Bug 类型','bug_type','0'),('Bug 严重程度','bug_severity','0'),('Bug 优先级','bug_priority','0'),
  ('Bug 环境','bug_environment','0'),('Bug 项目角色','bug_member_role','0'),('Bug 版本状态','bug_version_status','0')
ON CONFLICT (dict_type) DO UPDATE SET dict_name = EXCLUDED.dict_name, status = '0';

WITH dict_data(dict_type, dict_label, dict_value, dict_sort) AS (
  VALUES
    ('bug_status','待确认','pending_confirm',1),('bug_status','已确认','confirmed',2),('bug_status','已分配','assigned',3),('bug_status','修复中','fixing',4),('bug_status','待验证','pending_verify',5),('bug_status','已关闭','closed',6),('bug_status','已驳回','rejected',7),('bug_status','无法复现','cannot_reproduce',8),('bug_status','重复问题','duplicate',9),('bug_status','暂不处理','suspended',10),('bug_status','重新打开','reopened',11),
    ('bug_type','功能异常','function',1),('bug_type','界面问题','ui',2),('bug_type','性能问题','performance',3),('bug_type','兼容问题','compatibility',4),('bug_type','安全问题','security',5),
    ('bug_severity','致命','blocker',1),('bug_severity','严重','critical',2),('bug_severity','一般','major',3),('bug_severity','轻微','minor',4),
    ('bug_priority','紧急','urgent',1),('bug_priority','高','high',2),('bug_priority','中','medium',3),('bug_priority','低','low',4),
    ('bug_environment','生产','production',1),('bug_environment','预发','staging',2),('bug_environment','测试','testing',3),('bug_environment','本地','local',4),
    ('bug_member_role','项目负责人','owner',1),('bug_member_role','产品负责人','product',2),('bug_member_role','开发人员','developer',3),('bug_member_role','测试人员','tester',4),('bug_member_role','观察者','viewer',5),
    ('bug_version_status','规划中','planning',1),('bug_version_status','测试中','testing',2),('bug_version_status','已发布','released',3),('bug_version_status','已归档','archived',4)
)
INSERT INTO sys_dict_data (dict_type, dict_label, dict_value, dict_sort, status, is_default)
SELECT dict_type, dict_label, dict_value, dict_sort, '0', 'N' FROM dict_data d
WHERE NOT EXISTS (SELECT 1 FROM sys_dict_data x WHERE x.dict_type = d.dict_type AND x.dict_value = d.dict_value);

WITH admin_user AS (SELECT user_id FROM sys_user WHERE user_name = 'admin' AND del_flag = '0' LIMIT 1)
INSERT INTO bug_project (project_name, project_key, owner_id, description, status, del_flag, create_by)
SELECT '后台管理系统', 'ADMIN', user_id, 'Bug 反馈系统默认项目', '0', '0', 'admin' FROM admin_user
ON CONFLICT (project_key, del_flag) DO UPDATE SET project_name = EXCLUDED.project_name, status = '0';

WITH admin_user AS (SELECT user_id FROM sys_user WHERE user_name = 'admin' AND del_flag = '0' LIMIT 1),
project AS (SELECT project_id FROM bug_project WHERE project_key = 'ADMIN' AND del_flag = '0' LIMIT 1)
INSERT INTO bug_project_module (project_id, module_name, default_assignee_id, order_num, status, del_flag)
SELECT project_id, 'Bug 管理', user_id, 1, '0', '0' FROM project CROSS JOIN admin_user
ON CONFLICT (project_id, module_name, del_flag) DO UPDATE SET status = '0';

WITH project AS (SELECT project_id FROM bug_project WHERE project_key = 'ADMIN' AND del_flag = '0' LIMIT 1)
INSERT INTO bug_project_version (project_id, version_no, version_name, status, del_flag)
SELECT project_id, 'v1.0.0', '初始版本', 'testing', '0' FROM project
ON CONFLICT (project_id, version_no, del_flag) DO UPDATE SET status = 'testing';

WITH admin_user AS (SELECT user_id FROM sys_user WHERE user_name = 'admin' AND del_flag = '0' LIMIT 1),
project AS (SELECT project_id FROM bug_project WHERE project_key = 'ADMIN' AND del_flag = '0' LIMIT 1)
INSERT INTO bug_project_member (project_id, user_id, member_role, is_default, status)
SELECT project_id, user_id, 'owner', true, '0' FROM project CROSS JOIN admin_user
ON CONFLICT (project_id, user_id, member_role) DO UPDATE SET status = '0', is_default = true;

COMMIT;

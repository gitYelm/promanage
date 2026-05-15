-- 登录策略配置：是否允许同账号多端/多点同时在线
-- true：允许多点登录（默认，兼容原系统行为）
-- false：新登录会踢掉同账号旧会话，并将旧 Token 加入黑名单
INSERT INTO sys_config (
  config_name,
  config_key,
  config_value,
  config_type,
  create_by,
  remark
)
VALUES (
  '允许多点登录',
  'sys.login.allowMultiDevice',
  'true',
  'Y',
  'system',
  '是否允许同一账号在多个浏览器或设备同时在线，true=允许，false=新登录踢掉旧会话'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_name = EXCLUDED.config_name,
  config_type = EXCLUDED.config_type,
  remark = EXCLUDED.remark;

ALTER TABLE "sys_role"
  ADD COLUMN IF NOT EXISTS "security_level" INTEGER NOT NULL DEFAULT 100;

UPDATE "sys_role"
SET "security_level" = CASE "role_key"
  WHEN 'admin' THEN 1000
  WHEN 'system_admin' THEN 900
  WHEN 'monitor_admin' THEN 800
  WHEN 'pm_executive' THEN 700
  WHEN 'bug_project_owner' THEN 600
  WHEN 'bug_product_owner' THEN 550
  WHEN 'bug_reviewer' THEN 520
  WHEN 'bug_developer' THEN 400
  WHEN 'bug_tester' THEN 350
  WHEN 'common_user' THEN 200
  WHEN 'bug_submitter' THEN 100
  ELSE "security_level"
END
WHERE "del_flag" = '0';

CREATE INDEX IF NOT EXISTS "sys_role_security_level_idx" ON "sys_role"("security_level");

COMMENT ON COLUMN public.sys_role.security_level IS '安全等级，用于限制角色维护、用户分配和负责人候选范围';

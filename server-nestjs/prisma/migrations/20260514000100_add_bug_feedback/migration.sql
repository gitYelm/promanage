-- Bug 反馈系统业务表
CREATE TABLE IF NOT EXISTS "bug_project" (
  "project_id" BIGSERIAL PRIMARY KEY,
  "project_name" VARCHAR(100) NOT NULL,
  "project_key" VARCHAR(30) NOT NULL,
  "owner_id" BIGINT,
  "description" VARCHAR(500) DEFAULT '',
  "status" CHAR(1) DEFAULT '0',
  "del_flag" CHAR(1) DEFAULT '0',
  "create_by" VARCHAR(64) DEFAULT '',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "update_by" VARCHAR(64) DEFAULT '',
  "update_time" TIMESTAMP(6),
  CONSTRAINT "bug_project_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "bug_project_project_key_del_flag_key" ON "bug_project"("project_key", "del_flag");
CREATE INDEX IF NOT EXISTS "bug_project_owner_id_idx" ON "bug_project"("owner_id");
CREATE INDEX IF NOT EXISTS "bug_project_status_del_flag_idx" ON "bug_project"("status", "del_flag");

CREATE TABLE IF NOT EXISTS "bug_project_module" (
  "module_id" BIGSERIAL PRIMARY KEY,
  "project_id" BIGINT NOT NULL,
  "module_name" VARCHAR(100) NOT NULL,
  "default_assignee_id" BIGINT,
  "order_num" INTEGER DEFAULT 0,
  "status" CHAR(1) DEFAULT '0',
  "del_flag" CHAR(1) DEFAULT '0',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "update_time" TIMESTAMP(6),
  CONSTRAINT "bug_project_module_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "bug_project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bug_project_module_default_assignee_id_fkey" FOREIGN KEY ("default_assignee_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "bug_project_module_project_id_module_name_del_flag_key" ON "bug_project_module"("project_id", "module_name", "del_flag");
CREATE INDEX IF NOT EXISTS "bug_project_module_project_id_status_del_flag_idx" ON "bug_project_module"("project_id", "status", "del_flag");
CREATE INDEX IF NOT EXISTS "bug_project_module_default_assignee_id_idx" ON "bug_project_module"("default_assignee_id");

CREATE TABLE IF NOT EXISTS "bug_project_version" (
  "version_id" BIGSERIAL PRIMARY KEY,
  "project_id" BIGINT NOT NULL,
  "version_no" VARCHAR(50) NOT NULL,
  "version_name" VARCHAR(100) DEFAULT '',
  "release_date" TIMESTAMP(6),
  "status" VARCHAR(20) DEFAULT 'planning',
  "del_flag" CHAR(1) DEFAULT '0',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "update_time" TIMESTAMP(6),
  CONSTRAINT "bug_project_version_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "bug_project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "bug_project_version_project_id_version_no_del_flag_key" ON "bug_project_version"("project_id", "version_no", "del_flag");
CREATE INDEX IF NOT EXISTS "bug_project_version_project_id_status_del_flag_idx" ON "bug_project_version"("project_id", "status", "del_flag");

CREATE TABLE IF NOT EXISTS "bug_project_member" (
  "member_id" BIGSERIAL PRIMARY KEY,
  "project_id" BIGINT NOT NULL,
  "user_id" BIGINT NOT NULL,
  "member_role" VARCHAR(30) NOT NULL,
  "is_default" BOOLEAN DEFAULT false,
  "status" CHAR(1) DEFAULT '0',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "update_time" TIMESTAMP(6),
  CONSTRAINT "bug_project_member_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "bug_project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bug_project_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "bug_project_member_project_id_user_id_member_role_key" ON "bug_project_member"("project_id", "user_id", "member_role");
CREATE INDEX IF NOT EXISTS "bug_project_member_project_id_status_idx" ON "bug_project_member"("project_id", "status");
CREATE INDEX IF NOT EXISTS "bug_project_member_user_id_idx" ON "bug_project_member"("user_id");

CREATE TABLE IF NOT EXISTS "bug_ticket" (
  "ticket_id" BIGSERIAL PRIMARY KEY,
  "ticket_no" VARCHAR(50) NOT NULL UNIQUE,
  "title" VARCHAR(200) NOT NULL,
  "project_id" BIGINT NOT NULL,
  "module_id" BIGINT,
  "version_id" BIGINT,
  "type" VARCHAR(30) NOT NULL,
  "severity" VARCHAR(30) NOT NULL,
  "priority" VARCHAR(30) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'pending_confirm',
  "description" TEXT NOT NULL,
  "reproduce_steps" TEXT NOT NULL,
  "expected_result" TEXT NOT NULL,
  "actual_result" TEXT NOT NULL,
  "environment" VARCHAR(50) DEFAULT '',
  "device_info" VARCHAR(500) DEFAULT '',
  "submitter_id" BIGINT NOT NULL,
  "assignee_id" BIGINT,
  "verifier_id" BIGINT,
  "due_time" TIMESTAMP(6),
  "fix_note" TEXT,
  "verify_note" TEXT,
  "duplicate_of_id" BIGINT,
  "del_flag" CHAR(1) DEFAULT '0',
  "create_by" VARCHAR(64) DEFAULT '',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "update_by" VARCHAR(64) DEFAULT '',
  "update_time" TIMESTAMP(6),
  CONSTRAINT "bug_ticket_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "bug_project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bug_ticket_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "bug_project_module"("module_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "bug_ticket_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "bug_project_version"("version_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "bug_ticket_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "sys_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bug_ticket_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "bug_ticket_verifier_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "bug_ticket_duplicate_of_id_fkey" FOREIGN KEY ("duplicate_of_id") REFERENCES "bug_ticket"("ticket_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "bug_ticket_project_id_status_del_flag_idx" ON "bug_ticket"("project_id", "status", "del_flag");
CREATE INDEX IF NOT EXISTS "bug_ticket_module_id_idx" ON "bug_ticket"("module_id");
CREATE INDEX IF NOT EXISTS "bug_ticket_version_id_idx" ON "bug_ticket"("version_id");
CREATE INDEX IF NOT EXISTS "bug_ticket_submitter_id_idx" ON "bug_ticket"("submitter_id");
CREATE INDEX IF NOT EXISTS "bug_ticket_assignee_id_idx" ON "bug_ticket"("assignee_id");
CREATE INDEX IF NOT EXISTS "bug_ticket_verifier_id_idx" ON "bug_ticket"("verifier_id");
CREATE INDEX IF NOT EXISTS "bug_ticket_priority_severity_idx" ON "bug_ticket"("priority", "severity");
CREATE INDEX IF NOT EXISTS "bug_ticket_create_time_idx" ON "bug_ticket"("create_time");

CREATE TABLE IF NOT EXISTS "bug_comment" (
  "comment_id" BIGSERIAL PRIMARY KEY,
  "ticket_id" BIGINT NOT NULL,
  "user_id" BIGINT NOT NULL,
  "content" TEXT NOT NULL,
  "del_flag" CHAR(1) DEFAULT '0',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bug_comment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "bug_ticket"("ticket_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bug_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "bug_comment_ticket_id_del_flag_idx" ON "bug_comment"("ticket_id", "del_flag");
CREATE INDEX IF NOT EXISTS "bug_comment_user_id_idx" ON "bug_comment"("user_id");

CREATE TABLE IF NOT EXISTS "bug_attachment" (
  "attachment_id" BIGSERIAL PRIMARY KEY,
  "ticket_id" BIGINT,
  "comment_id" BIGINT,
  "uploader_id" BIGINT NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "original_name" VARCHAR(255) NOT NULL,
  "file_url" VARCHAR(500) NOT NULL,
  "file_type" VARCHAR(100) NOT NULL,
  "file_size" BIGINT NOT NULL,
  "attachment_type" VARCHAR(30) NOT NULL DEFAULT 'file',
  "original_attachment_id" BIGINT,
  "annotation_data" TEXT,
  "del_flag" CHAR(1) DEFAULT '0',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bug_attachment_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "bug_ticket"("ticket_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "bug_attachment_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "bug_comment"("comment_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "bug_attachment_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "sys_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bug_attachment_original_attachment_id_fkey" FOREIGN KEY ("original_attachment_id") REFERENCES "bug_attachment"("attachment_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "bug_attachment_ticket_id_del_flag_idx" ON "bug_attachment"("ticket_id", "del_flag");
CREATE INDEX IF NOT EXISTS "bug_attachment_comment_id_idx" ON "bug_attachment"("comment_id");
CREATE INDEX IF NOT EXISTS "bug_attachment_uploader_id_idx" ON "bug_attachment"("uploader_id");
CREATE INDEX IF NOT EXISTS "bug_attachment_original_attachment_id_idx" ON "bug_attachment"("original_attachment_id");

CREATE TABLE IF NOT EXISTS "bug_history" (
  "history_id" BIGSERIAL PRIMARY KEY,
  "ticket_id" BIGINT NOT NULL,
  "operator_id" BIGINT NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "from_value" VARCHAR(500),
  "to_value" VARCHAR(500),
  "remark" VARCHAR(1000),
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bug_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "bug_ticket"("ticket_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "bug_history_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "sys_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "bug_history_ticket_id_create_time_idx" ON "bug_history"("ticket_id", "create_time");
CREATE INDEX IF NOT EXISTS "bug_history_operator_id_idx" ON "bug_history"("operator_id");


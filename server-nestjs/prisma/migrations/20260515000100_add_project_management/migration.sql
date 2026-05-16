-- Add project management fields to existing Bug project tables.
ALTER TABLE "bug_project" ADD COLUMN IF NOT EXISTS "project_stage" VARCHAR(30) DEFAULT 'requirement';
ALTER TABLE "bug_project" ADD COLUMN IF NOT EXISTS "planned_start_time" TIMESTAMP(6);
ALTER TABLE "bug_project" ADD COLUMN IF NOT EXISTS "planned_end_time" TIMESTAMP(6);
ALTER TABLE "bug_project" ADD COLUMN IF NOT EXISTS "actual_start_time" TIMESTAMP(6);
ALTER TABLE "bug_project" ADD COLUMN IF NOT EXISTS "actual_end_time" TIMESTAMP(6);
ALTER TABLE "bug_project" ADD COLUMN IF NOT EXISTS "progress" INTEGER DEFAULT 0;
ALTER TABLE "bug_project" ADD COLUMN IF NOT EXISTS "risk_level" VARCHAR(20) DEFAULT 'low';
ALTER TABLE "bug_project" ADD COLUMN IF NOT EXISTS "risk_note" VARCHAR(1000) DEFAULT '';

CREATE INDEX IF NOT EXISTS "bug_project_project_stage_idx" ON "bug_project"("project_stage");
CREATE INDEX IF NOT EXISTS "bug_project_risk_level_idx" ON "bug_project"("risk_level");
CREATE INDEX IF NOT EXISTS "bug_project_planned_end_time_idx" ON "bug_project"("planned_end_time");

CREATE TABLE IF NOT EXISTS "project_iteration" (
  "iteration_id" BIGSERIAL PRIMARY KEY,
  "project_id" BIGINT NOT NULL,
  "iteration_name" VARCHAR(100) NOT NULL,
  "goal" VARCHAR(500) DEFAULT '',
  "status" VARCHAR(30) NOT NULL DEFAULT 'planned',
  "owner_id" BIGINT,
  "start_date" TIMESTAMP(6),
  "end_date" TIMESTAMP(6),
  "summary" VARCHAR(1000) DEFAULT '',
  "risk_note" VARCHAR(1000) DEFAULT '',
  "del_flag" CHAR(1) DEFAULT '0',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_iteration_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "bug_project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "project_iteration_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "project_iteration_project_id_status_del_flag_idx" ON "project_iteration"("project_id", "status", "del_flag");
CREATE INDEX IF NOT EXISTS "project_iteration_owner_id_idx" ON "project_iteration"("owner_id");
CREATE INDEX IF NOT EXISTS "project_iteration_start_date_idx" ON "project_iteration"("start_date");
CREATE INDEX IF NOT EXISTS "project_iteration_end_date_idx" ON "project_iteration"("end_date");

CREATE TABLE IF NOT EXISTS "project_milestone" (
  "milestone_id" BIGSERIAL PRIMARY KEY,
  "project_id" BIGINT NOT NULL,
  "milestone_name" VARCHAR(100) NOT NULL,
  "stage" VARCHAR(30) NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
  "owner_id" BIGINT,
  "target_date" TIMESTAMP(6),
  "completed_time" TIMESTAMP(6),
  "completion_criteria" VARCHAR(1000) DEFAULT '',
  "remark" VARCHAR(1000) DEFAULT '',
  "del_flag" CHAR(1) DEFAULT '0',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_milestone_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "bug_project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "project_milestone_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "project_milestone_project_id_status_del_flag_idx" ON "project_milestone"("project_id", "status", "del_flag");
CREATE INDEX IF NOT EXISTS "project_milestone_stage_idx" ON "project_milestone"("stage");
CREATE INDEX IF NOT EXISTS "project_milestone_owner_id_idx" ON "project_milestone"("owner_id");
CREATE INDEX IF NOT EXISTS "project_milestone_target_date_idx" ON "project_milestone"("target_date");

ALTER TABLE "bug_project_version" ADD COLUMN IF NOT EXISTS "iteration_id" BIGINT;
ALTER TABLE "bug_project_version" ADD COLUMN IF NOT EXISTS "milestone_id" BIGINT;
ALTER TABLE "bug_project_version" ADD COLUMN IF NOT EXISTS "release_note" TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS "bug_project_version_iteration_id_idx" ON "bug_project_version"("iteration_id");
CREATE INDEX IF NOT EXISTS "bug_project_version_milestone_id_idx" ON "bug_project_version"("milestone_id");
DO $$ BEGIN
  ALTER TABLE "bug_project_version" ADD CONSTRAINT "bug_project_version_iteration_id_fkey" FOREIGN KEY ("iteration_id") REFERENCES "project_iteration"("iteration_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "bug_project_version" ADD CONSTRAINT "bug_project_version_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "project_milestone"("milestone_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "project_requirement" (
  "requirement_id" BIGSERIAL PRIMARY KEY,
  "requirement_no" VARCHAR(50) NOT NULL UNIQUE,
  "title" VARCHAR(200) NOT NULL,
  "project_id" BIGINT NOT NULL,
  "module_id" BIGINT,
  "type" VARCHAR(30) NOT NULL DEFAULT 'feature',
  "source" VARCHAR(50) DEFAULT '',
  "priority" VARCHAR(30) NOT NULL DEFAULT 'medium',
  "value_score" INTEGER DEFAULT 0,
  "difficulty_score" INTEGER DEFAULT 0,
  "status" VARCHAR(30) NOT NULL DEFAULT 'draft',
  "owner_id" BIGINT,
  "developer_id" BIGINT,
  "tester_id" BIGINT,
  "iteration_id" BIGINT,
  "milestone_id" BIGINT,
  "version_id" BIGINT,
  "planned_start_time" TIMESTAMP(6),
  "planned_end_time" TIMESTAMP(6),
  "actual_end_time" TIMESTAMP(6),
  "description" TEXT DEFAULT '',
  "acceptance_criteria" TEXT DEFAULT '',
  "remark" VARCHAR(1000) DEFAULT '',
  "del_flag" CHAR(1) DEFAULT '0',
  "create_by" VARCHAR(64) DEFAULT '',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "update_by" VARCHAR(64) DEFAULT '',
  "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_requirement_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "bug_project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "project_requirement_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "bug_project_module"("module_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "project_requirement_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "project_requirement_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "project_requirement_tester_id_fkey" FOREIGN KEY ("tester_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "project_requirement_iteration_id_fkey" FOREIGN KEY ("iteration_id") REFERENCES "project_iteration"("iteration_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "project_requirement_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "project_milestone"("milestone_id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "project_requirement_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "bug_project_version"("version_id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "project_requirement_project_id_status_del_flag_idx" ON "project_requirement"("project_id", "status", "del_flag");
CREATE INDEX IF NOT EXISTS "project_requirement_module_id_idx" ON "project_requirement"("module_id");
CREATE INDEX IF NOT EXISTS "project_requirement_owner_id_idx" ON "project_requirement"("owner_id");
CREATE INDEX IF NOT EXISTS "project_requirement_developer_id_idx" ON "project_requirement"("developer_id");
CREATE INDEX IF NOT EXISTS "project_requirement_tester_id_idx" ON "project_requirement"("tester_id");
CREATE INDEX IF NOT EXISTS "project_requirement_iteration_id_idx" ON "project_requirement"("iteration_id");
CREATE INDEX IF NOT EXISTS "project_requirement_milestone_id_idx" ON "project_requirement"("milestone_id");
CREATE INDEX IF NOT EXISTS "project_requirement_version_id_idx" ON "project_requirement"("version_id");
CREATE INDEX IF NOT EXISTS "project_requirement_priority_idx" ON "project_requirement"("priority");
CREATE INDEX IF NOT EXISTS "project_requirement_planned_end_time_idx" ON "project_requirement"("planned_end_time");

ALTER TABLE "bug_ticket" ADD COLUMN IF NOT EXISTS "requirement_id" BIGINT;
ALTER TABLE "bug_ticket" ADD COLUMN IF NOT EXISTS "iteration_id" BIGINT;
ALTER TABLE "bug_ticket" ADD COLUMN IF NOT EXISTS "milestone_id" BIGINT;
CREATE INDEX IF NOT EXISTS "bug_ticket_requirement_id_idx" ON "bug_ticket"("requirement_id");
CREATE INDEX IF NOT EXISTS "bug_ticket_iteration_id_idx" ON "bug_ticket"("iteration_id");
CREATE INDEX IF NOT EXISTS "bug_ticket_milestone_id_idx" ON "bug_ticket"("milestone_id");
DO $$ BEGIN
  ALTER TABLE "bug_ticket" ADD CONSTRAINT "bug_ticket_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "project_requirement"("requirement_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "bug_ticket" ADD CONSTRAINT "bug_ticket_iteration_id_fkey" FOREIGN KEY ("iteration_id") REFERENCES "project_iteration"("iteration_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "bug_ticket" ADD CONSTRAINT "bug_ticket_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "project_milestone"("milestone_id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "project_activity" (
  "activity_id" BIGSERIAL PRIMARY KEY,
  "project_id" BIGINT NOT NULL,
  "target_type" VARCHAR(30) NOT NULL,
  "target_id" BIGINT NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "from_value" VARCHAR(500),
  "to_value" VARCHAR(500),
  "remark" VARCHAR(1000),
  "operator_id" BIGINT NOT NULL,
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_activity_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "bug_project"("project_id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "project_activity_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "sys_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "project_activity_project_id_create_time_idx" ON "project_activity"("project_id", "create_time");
CREATE INDEX IF NOT EXISTS "project_activity_target_type_target_id_idx" ON "project_activity"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "project_activity_operator_id_idx" ON "project_activity"("operator_id");

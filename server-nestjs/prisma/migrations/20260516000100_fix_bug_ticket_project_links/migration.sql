-- Repair Bug ticket project-management link columns.
--
-- Context:
-- Some databases may have Prisma migration history or generated client aligned with
-- `20260515000100_add_project_management`, while the physical `bug_ticket` table
-- still misses these columns. Prisma then raises P2022, for example:
--   column bug_ticket.requirement_id does not exist
--
-- This migration intentionally repeats the missing `bug_ticket` link columns in an
-- idempotent way so it is safe for both fresh databases and drifted databases.

ALTER TABLE "bug_ticket" ADD COLUMN IF NOT EXISTS "requirement_id" BIGINT;
ALTER TABLE "bug_ticket" ADD COLUMN IF NOT EXISTS "iteration_id" BIGINT;
ALTER TABLE "bug_ticket" ADD COLUMN IF NOT EXISTS "milestone_id" BIGINT;

CREATE INDEX IF NOT EXISTS "bug_ticket_requirement_id_idx" ON "bug_ticket"("requirement_id");
CREATE INDEX IF NOT EXISTS "bug_ticket_iteration_id_idx" ON "bug_ticket"("iteration_id");
CREATE INDEX IF NOT EXISTS "bug_ticket_milestone_id_idx" ON "bug_ticket"("milestone_id");

DO $$
BEGIN
  IF to_regclass('bug_ticket') IS NOT NULL
    AND to_regclass('project_requirement') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'bug_ticket_requirement_id_fkey'
    )
  THEN
    ALTER TABLE "bug_ticket"
      ADD CONSTRAINT "bug_ticket_requirement_id_fkey"
      FOREIGN KEY ("requirement_id")
      REFERENCES "project_requirement"("requirement_id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('bug_ticket') IS NOT NULL
    AND to_regclass('project_iteration') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'bug_ticket_iteration_id_fkey'
    )
  THEN
    ALTER TABLE "bug_ticket"
      ADD CONSTRAINT "bug_ticket_iteration_id_fkey"
      FOREIGN KEY ("iteration_id")
      REFERENCES "project_iteration"("iteration_id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('bug_ticket') IS NOT NULL
    AND to_regclass('project_milestone') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'bug_ticket_milestone_id_fkey'
    )
  THEN
    ALTER TABLE "bug_ticket"
      ADD CONSTRAINT "bug_ticket_milestone_id_fkey"
      FOREIGN KEY ("milestone_id")
      REFERENCES "project_milestone"("milestone_id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

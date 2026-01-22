-- AlterTable
ALTER TABLE "sys_oper_log" ADD COLUMN     "browser" VARCHAR(50) DEFAULT '',
ADD COLUMN     "cost_time" INTEGER DEFAULT 0,
ADD COLUMN     "oper_user_id" BIGINT,
ADD COLUMN     "os" VARCHAR(50) DEFAULT '',
ADD COLUMN     "user_agent" VARCHAR(500) DEFAULT '';

-- CreateIndex
CREATE INDEX "sys_oper_log_oper_user_id_idx" ON "sys_oper_log"("oper_user_id");

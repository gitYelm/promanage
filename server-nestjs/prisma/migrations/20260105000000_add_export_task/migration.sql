-- 导出任务表
CREATE TABLE "sys_export_task" (
    "task_id" VARCHAR(36) NOT NULL,
    "task_name" VARCHAR(100) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "format" VARCHAR(10) NOT NULL DEFAULT 'xlsx',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "total_rows" INTEGER,
    "processed_rows" INTEGER DEFAULT 0,
    "file_path" VARCHAR(500),
    "file_size" BIGINT,
    "query_params" TEXT,
    "columns" TEXT,
    "error_msg" VARCHAR(500),
    "create_by" VARCHAR(64),
    "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "finish_time" TIMESTAMP(6),
    "expire_time" TIMESTAMP(6),

    CONSTRAINT "sys_export_task_pkey" PRIMARY KEY ("task_id")
);

CREATE INDEX "sys_export_task_status_idx" ON "sys_export_task"("status");
CREATE INDEX "sys_export_task_create_by_idx" ON "sys_export_task"("create_by");
CREATE INDEX "sys_export_task_create_time_idx" ON "sys_export_task"("create_time");

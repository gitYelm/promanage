-- CreateTable
CREATE TABLE "sys_user_notification" (
  "notification_id" BIGSERIAL NOT NULL,
  "recipient_id" BIGINT NOT NULL,
  "actor_id" BIGINT,
  "notification_type" VARCHAR(50) NOT NULL,
  "business_type" VARCHAR(50) NOT NULL,
  "business_id" BIGINT,
  "title" VARCHAR(200) NOT NULL,
  "content" VARCHAR(1000),
  "payload" JSONB,
  "read_time" TIMESTAMP(6),
  "del_flag" CHAR(1) DEFAULT '0',
  "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sys_user_notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE INDEX "sys_user_notification_recipient_id_read_time_create_time_idx" ON "sys_user_notification"("recipient_id", "read_time", "create_time");
CREATE INDEX "sys_user_notification_business_type_business_id_idx" ON "sys_user_notification"("business_type", "business_id");
CREATE INDEX "sys_user_notification_notification_type_idx" ON "sys_user_notification"("notification_type");

-- AddForeignKey
ALTER TABLE "sys_user_notification" ADD CONSTRAINT "sys_user_notification_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "sys_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sys_user_notification" ADD CONSTRAINT "sys_user_notification_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "sys_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON TABLE public.sys_user_notification IS '用户站内通知表';
COMMENT ON COLUMN public.sys_user_notification.notification_id IS '通知ID';
COMMENT ON COLUMN public.sys_user_notification.recipient_id IS '接收用户ID';
COMMENT ON COLUMN public.sys_user_notification.actor_id IS '触发用户ID';
COMMENT ON COLUMN public.sys_user_notification.notification_type IS '通知类型';
COMMENT ON COLUMN public.sys_user_notification.business_type IS '业务类型';
COMMENT ON COLUMN public.sys_user_notification.business_id IS '业务ID';
COMMENT ON COLUMN public.sys_user_notification.title IS '通知标题';
COMMENT ON COLUMN public.sys_user_notification.content IS '通知内容';
COMMENT ON COLUMN public.sys_user_notification.payload IS '扩展载荷JSON';
COMMENT ON COLUMN public.sys_user_notification.read_time IS '已读时间';
COMMENT ON COLUMN public.sys_user_notification.del_flag IS '删除标志（0存在 2删除）';
COMMENT ON COLUMN public.sys_user_notification.create_time IS '创建时间';

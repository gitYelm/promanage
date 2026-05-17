--
-- PostgreSQL database dump
--

\restrict nN1lRXa3BWT9sbG2emCAm1sAj5yCLLzyr7OksCT69of2KUU1uyavncWwXiqImeS

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: bug_project; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.bug_project (project_id, project_name, project_key, owner_id, description, status, del_flag, create_by, create_time, update_by, update_time, project_stage, planned_start_time, planned_end_time, actual_start_time, actual_end_time, progress, risk_level, risk_note) VALUES (7, '青鸟探亲', 'FLYCARD', 8, '', '0', '0', '', '2026-05-14 08:26:51.333', '', '2026-05-16 17:29:50.24', 'requirement', NULL, NULL, NULL, NULL, 0, 'low', '');
INSERT INTO public.bug_project (project_id, project_name, project_key, owner_id, description, status, del_flag, create_by, create_time, update_by, update_time, project_stage, planned_start_time, planned_end_time, actual_start_time, actual_end_time, progress, risk_level, risk_note) VALUES (1, '后台管理系统', 'ADMIN', 1, '后台管理系统：基于 RBAC Admin Pro 扩展 Bug 反馈闭环与轻量项目管理能力，覆盖用户权限、Bug 流程、需求、迭代、里程碑和管理层项目看板。', '0', '0', 'admin', '2026-05-14 06:15:12.938409', 'admin', '2026-05-17 02:27:58.349803', 'internal_test', '2026-05-14 00:00:00', '2026-05-22 23:59:59', '2026-05-14 00:00:00', NULL, 78, 'medium', '项目管理基础版代码已完成，需求/迭代/里程碑/仪表盘已落地；当前重点是数据初始化、页面验收和内测发布确认。Docker 内测版更新需单独授权。');


--
-- Data for Name: bug_project_module; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (7, 7, '小程序端', NULL, 0, '0', '0', '2026-05-14 13:23:46.175', '2026-05-14 13:23:46.175');
INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (8, 7, '管理端', NULL, 0, '0', '0', '2026-05-14 13:23:59.008', '2026-05-14 13:24:16.474');
INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (1, 1, '后端', 11, 1, '0', '0', '2026-05-14 06:15:12.938409', '2026-05-17 02:27:58.349803');
INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (13, 1, '前端', 12, 2, '0', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');
INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (14, 1, '权限与菜单', 9, 3, '0', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');
INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (15, 1, 'Bug反馈闭环', 10, 4, '0', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');
INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (16, 1, '项目管理', 9, 5, '0', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');
INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (17, 1, '附件与通知', 11, 6, '0', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');
INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (18, 1, '部署运维与安全', 8, 7, '0', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');


--
-- Data for Name: project_iteration; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.project_iteration (iteration_id, project_id, iteration_name, goal, status, owner_id, start_date, end_date, summary, risk_note, del_flag, create_time, update_time) VALUES (1, 1, '一期 Bug 闭环完善迭代', '完成内部 Bug 提交、审核、分派、修复、验证、关闭的闭环能力。', 'completed', 10, '2026-05-14 00:00:00', '2026-05-16 23:59:59', '覆盖项目配置、模块版本、成员、Bug 状态流转、附件、评论、历史记录和站内通知。', '已进入验收归档；后续只处理回归问题。', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_iteration (iteration_id, project_id, iteration_name, goal, status, owner_id, start_date, end_date, summary, risk_note, del_flag, create_time, update_time) VALUES (2, 1, '项目管理基础版验收迭代', '让项目负责人和管理层能看到需求、迭代、里程碑、进度、风险、当前处理、历史完成和未处理事项。', 'testing', 9, '2026-05-15 00:00:00', '2026-05-20 23:59:59', '需求管理、迭代计划、里程碑、项目概览、项目仪表盘和只读看板已完成基础版，当前进行数据初始化和页面验收。', '主要风险为菜单/权限 seed、内测环境更新和页面回归验收需要确认。', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_iteration (iteration_id, project_id, iteration_name, goal, status, owner_id, start_date, end_date, summary, risk_note, del_flag, create_time, update_time) VALUES (3, 1, '二期 AI 修复能力预研迭代', '预研本地 AI Runner、Codex 修复、隔离工作区、Diff 回传和人工确认应用。', 'planned', 8, '2026-05-21 00:00:00', '2026-06-05 23:59:59', '二期只做方案和小范围验证，不进入一期交付范围。', '依赖本地项目映射、安全边界、补丁冲突检测和审计日志设计。', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');


--
-- Data for Name: project_milestone; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.project_milestone (milestone_id, project_id, milestone_name, stage, status, owner_id, target_date, completed_time, completion_criteria, remark, del_flag, create_time, update_time) VALUES (1, 1, 'Bug 闭环基础能力完成', 'internal_test', 'achieved', 10, '2026-05-16 23:59:59', '2026-05-16 18:00:00', 'Bug 提交、审核、分派、修复、验证、关闭、附件、评论、通知和历史记录完成可用。', '对应一期 Bug 闭环完善迭代。', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_milestone (milestone_id, project_id, milestone_name, stage, status, owner_id, target_date, completed_time, completion_criteria, remark, del_flag, create_time, update_time) VALUES (2, 1, '项目管理基础版验收', 'internal_test', 'in_progress', 9, '2026-05-20 23:59:59', NULL, '需求、迭代、里程碑、项目概览、项目仪表盘和只读看板均有可展示数据，权限菜单验证通过。', '当前正在补齐后台管理系统项目数据并准备页面验收。', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_milestone (milestone_id, project_id, milestone_name, stage, status, owner_id, target_date, completed_time, completion_criteria, remark, del_flag, create_time, update_time) VALUES (3, 1, '内测版发布准备', 'release_ready', 'pending', 8, '2026-05-22 23:59:59', NULL, '本地验收通过后，经用户明确授权，再同步或更新 Docker 内测版。', '不主动操作 18001 内测环境。', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_milestone (milestone_id, project_id, milestone_name, stage, status, owner_id, target_date, completed_time, completion_criteria, remark, del_flag, create_time, update_time) VALUES (4, 1, 'AI 修复能力二期立项', 'planning', 'pending', 8, '2026-06-05 23:59:59', NULL, '完成 AI Runner、本地项目映射、隔离修复、Diff 回传、冲突检测和审计日志方案确认。', '来自二期 AI 修复规划，一期不实现。', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803');


--
-- Data for Name: bug_project_version; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.bug_project_version (version_id, project_id, version_no, version_name, release_date, status, del_flag, create_time, update_time, iteration_id, milestone_id, release_note) VALUES (7, 7, '0.1', '内测版本', NULL, 'testing', '0', '2026-05-14 14:18:03.057', '2026-05-14 14:18:03.057', NULL, NULL, '');
INSERT INTO public.bug_project_version (version_id, project_id, version_no, version_name, release_date, status, del_flag, create_time, update_time, iteration_id, milestone_id, release_note) VALUES (1, 1, 'v1.0.0', 'RBAC 基础后台可用版', '2026-01-08 00:00:00', 'released', '0', '2026-05-14 06:15:12.938409', '2026-05-17 02:27:58.349803', 1, 1, '基础后台、认证授权、用户角色菜单、部门、字典、配置、监控、日志和安全加固完成。');
INSERT INTO public.bug_project_version (version_id, project_id, version_no, version_name, release_date, status, del_flag, create_time, update_time, iteration_id, milestone_id, release_note) VALUES (12, 1, 'v1.1.0', 'Bug 反馈与项目管理基础版', NULL, 'testing', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803', 2, 2, '内部 Bug 闭环、项目阶段、需求、迭代、里程碑、项目概览、项目仪表盘和只读看板。');
INSERT INTO public.bug_project_version (version_id, project_id, version_no, version_name, release_date, status, del_flag, create_time, update_time, iteration_id, milestone_id, release_note) VALUES (13, 1, 'v2.0.0', 'AI 修复能力规划版', NULL, 'planning', '0', '2026-05-17 02:27:58.349803', '2026-05-17 02:27:58.349803', 3, 4, '规划 AI 分析、AI 修复、修复包、本地 Runner、Diff 回传和审计日志能力。');


--
-- Data for Name: project_requirement; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (1, 'ADMIN-REQ-0001', '基础后台框架与工程化能力', 1, 1, 'technical', '历史基础能力', 'high', 90, 70, 'released', 8, 11, 13, 1, 1, 1, '2026-01-01 00:00:00', '2026-01-08 00:00:00', '2026-01-08 00:00:00', 'Vue 3、NestJS、Prisma、PostgreSQL、Redis、Docker 和统一工程脚本构成后台系统基础。', '系统可启动，前后端基础链路可用，数据库模型和权限基础完整。', '来自开发状态文档，核心功能已完成。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (2, 'ADMIN-REQ-0002', '认证授权与安全加固', 1, 14, 'security', '历史基础能力', 'urgent', 95, 80, 'released', 8, 11, 13, 1, 1, 1, '2026-01-01 00:00:00', '2026-01-08 00:00:00', '2026-01-08 00:00:00', '实现 JWT、验证码、两步验证、Token 黑名单、权限守卫、敏感配置隔离和基础安全审计。', '登录、退出、权限校验、安全审计和生产部署安全项通过检查。', '对应安全审计和角色权限基础。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (3, 'ADMIN-REQ-0003', '用户、角色、部门、菜单和字典管理', 1, 14, 'feature', '历史基础能力', 'high', 92, 65, 'released', 9, 11, 13, 1, 1, 1, '2026-01-01 00:00:00', '2026-01-08 00:00:00', '2026-01-08 00:00:00', '支持后台用户、角色、部门、岗位、菜单、字典、参数配置和按钮权限管理。', '管理员可完成基础系统配置，动态菜单和按钮权限生效。', 'RBAC Admin Pro 基础功能。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (4, 'ADMIN-REQ-0004', '系统监控、日志、定时任务和通知公告', 1, 18, 'feature', '历史基础能力', 'medium', 80, 60, 'released', 8, 12, 13, 1, 1, 1, '2026-01-01 00:00:00', '2026-01-08 00:00:00', '2026-01-08 00:00:00', '提供在线用户、操作日志、登录日志、服务器监控、缓存监控、定时任务和富文本通知公告。', '监控页面和日志查询可用，通知公告支持富文本内容。', '用于后台管理系统运维。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (5, 'ADMIN-REQ-0005', '文件上传、富文本编辑和上传大小配置', 1, 17, 'improvement', '历史基础能力', 'medium', 78, 55, 'released', 9, 12, 13, 1, 1, 1, '2026-01-05 00:00:00', '2026-01-08 00:00:00', '2026-01-08 00:00:00', '富文本编辑器支持表格、图片、视频，上传大小通过参数配置动态控制。', '图片、视频、头像和系统文件上传限制可配置，弹窗滚动问题已修复。', '来自开发任务清单最近更新。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (6, 'ADMIN-REQ-0006', 'Bug 项目、模块、版本和成员基础配置', 1, 15, 'feature', '需求分析', 'high', 90, 65, 'accepted', 9, 11, 13, 1, 1, 12, '2026-05-14 00:00:00', '2026-05-15 00:00:00', '2026-05-15 00:00:00', '维护多个项目、项目模块、版本和项目成员，为 Bug 归属、分派和数据范围提供基础。', '项目、模块、版本、成员可维护，成员角色能影响 Bug 可见性和处理权限。', '一期 Bug 反馈系统范围内。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (7, 'ADMIN-REQ-0007', 'Bug 提交、列表、详情和筛选查询', 1, 15, 'feature', '需求分析', 'urgent', 96, 75, 'accepted', 9, 11, 13, 1, 1, 12, '2026-05-14 00:00:00', '2026-05-16 00:00:00', '2026-05-16 00:00:00', '内部用户登录后台后提交 Bug，列表支持项目、模块、状态、严重程度、优先级、提交人、负责人和时间范围筛选。', '提交后生成编号，详情可查看描述、复现步骤、期望结果、实际结果、附件、评论和历史。', '一期核心闭环入口。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (8, 'ADMIN-REQ-0008', 'Bug 状态流转、分派和角色权限闭环', 1, 15, 'feature', '需求分析', 'urgent', 98, 85, 'accepted', 10, 11, 13, 1, 1, 12, '2026-05-14 00:00:00', '2026-05-16 00:00:00', '2026-05-16 00:00:00', '支持待确认、已确认、已分配、修复中、待验证、已关闭，以及驳回、无法复现、重复、暂不处理、重新打开。', 'reviewer 分派前 developer 不泛发可见；开发只处理分派给自己的 Bug；测试或审核人员可验证。', '状态流转和快捷操作已按防重复清单修正。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (9, 'ADMIN-REQ-0009', '附件上传、截图标注和浏览器预览', 1, 17, 'feature', '需求分析', 'high', 88, 80, 'accepted', 9, 12, 13, 1, 1, 12, '2026-05-14 00:00:00', '2026-05-16 00:00:00', '2026-05-16 00:00:00', 'Bug 支持截图、日志、录屏等附件，截图可在线标注编辑，详情页支持缩略图、主预览和全屏预览。', '上传后可继续上传，图片/视频可预览，标注结果可保存和展示。', '已纳入问题解决防重复规则。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (10, 'ADMIN-REQ-0010', '评论协作、操作历史和站内通知', 1, 17, 'feature', '需求分析', 'high', 86, 70, 'accepted', 10, 11, 13, 1, 1, 12, '2026-05-14 00:00:00', '2026-05-16 00:00:00', '2026-05-16 00:00:00', '围绕 Bug 处理过程记录评论、操作历史，并按下一步处理人精准发送站内通知。', '提交通知 reviewer/负责人，分派后通知 developer，状态变化有历史记录。', '第一版启用站内通知，外部通知暂缓。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (11, 'ADMIN-REQ-0011', '基础统计看板和我的待处理入口', 1, 13, 'feature', '需求分析', 'medium', 80, 65, 'accepted', 9, 12, 13, 1, 1, 12, '2026-05-15 00:00:00', '2026-05-16 00:00:00', '2026-05-16 00:00:00', '提供 Bug 基础统计、列表快捷按钮和我的 Bug 待处理数量徽标。', '用户能快速进入自己需要处理的 Bug，项目负责人能查看基础统计。', '一期基础统计。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (12, 'ADMIN-REQ-0012', '项目管理数据模型、接口和页面基础版', 1, 16, 'feature', '项目管理需求分析', 'urgent', 95, 85, 'accepted', 9, 11, 13, 2, 2, 12, '2026-05-15 00:00:00', '2026-05-17 00:00:00', '2026-05-17 00:00:00', '新增项目阶段、进度、风险、需求、迭代、里程碑、项目动态、项目仪表盘和项目概览相关模型、接口和页面。', '后端类型检查和前端类型检查已通过；基础页面已落地，可进入数据验收。', '当前正在写入后台管理系统项目数据。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (13, 'ADMIN-REQ-0013', '需求管理、评审、排期和验收流程', 1, 16, 'feature', '项目管理需求分析', 'high', 92, 78, 'testing', 9, 11, 13, 2, 2, 12, '2026-05-15 00:00:00', '2026-05-20 00:00:00', NULL, '支持需求创建、编辑、状态流转、关联项目、模块、版本、迭代、里程碑和 Bug。', '需求可按草稿、提交、评审、通过、排期、开发、测试、验收、发布、关闭流转，并在看板中展示。', '当前验收重点：字段、筛选、状态按钮和关联数据展示。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (14, 'ADMIN-REQ-0014', '项目仪表盘、项目概览和只读看板验收', 1, 13, 'feature', '项目管理需求分析', 'high', 90, 80, 'testing', 9, 12, 13, 2, 2, 12, '2026-05-15 00:00:00', '2026-05-20 00:00:00', NULL, '管理层查看项目进度、风险、延期、下阶段安排、当前处理、历史完成和未处理事项；负责人查看单项目概览。', '项目仪表盘、概览、需求/bug 只读看板均有数据可展示，空状态、loading 和权限控制表现正常。', '本次数据写入后进入页面验收。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (15, 'ADMIN-REQ-0015', '内测版发布、菜单权限 seed 和环境边界确认', 1, 18, 'operation', '部署运维约定', 'medium', 75, 60, 'planned', 8, 11, 13, 2, 3, 12, '2026-05-20 00:00:00', '2026-05-22 00:00:00', NULL, '本地验收通过后，确认是否执行菜单权限 seed、是否同步 Docker 内测分支和是否更新 18001 内测环境。', '所有发布或 Docker 操作均需用户明确授权；不主动重启、重建或覆盖内测数据。', '环境边界来自问题解决防重复清单。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');
INSERT INTO public.project_requirement (requirement_id, requirement_no, title, project_id, module_id, type, source, priority, value_score, difficulty_score, status, owner_id, developer_id, tester_id, iteration_id, milestone_id, version_id, planned_start_time, planned_end_time, actual_end_time, description, acceptance_criteria, remark, del_flag, create_by, create_time, update_by, update_time) VALUES (16, 'ADMIN-REQ-0016', '二期 AI 修复能力预研', 1, 16, 'technical', '二期AI修复规划', 'medium', 70, 90, 'approved', 8, 11, 13, 3, 4, 13, '2026-05-21 00:00:00', '2026-06-05 00:00:00', NULL, '规划 AI 分析、AI 修复、修复包、本地项目映射、本机 Runner、冲突检测、Diff 回传和审计日志。', '形成明确技术方案和安全边界；一期不实现代码修复自动化。', '来自二期 AI 修复规划和架构设计。', '0', 'admin', '2026-05-17 02:27:58.349803', 'admin', '2026-05-17 02:27:58.349803');


--
-- Data for Name: bug_ticket; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.bug_ticket (ticket_id, ticket_no, title, project_id, module_id, version_id, type, severity, priority, status, description, reproduce_steps, expected_result, actual_result, environment, device_info, submitter_id, assignee_id, verifier_id, due_time, fix_note, verify_note, duplicate_of_id, del_flag, create_by, create_time, update_by, update_time, requirement_id, iteration_id, milestone_id) VALUES (1, 'ADMIN-BUG-20260514-0001', '撒的', 1, 1, 1, 'function', 'major', 'medium', 'reopened', '', '', '', '', 'testing', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 1, 1, 5, NULL, '', '', NULL, '0', 'admin', '2026-05-14 13:25:31.602', 'admin', '2026-05-15 15:18:45.699', NULL, NULL, NULL);
INSERT INTO public.bug_ticket (ticket_id, ticket_no, title, project_id, module_id, version_id, type, severity, priority, status, description, reproduce_steps, expected_result, actual_result, environment, device_info, submitter_id, assignee_id, verifier_id, due_time, fix_note, verify_note, duplicate_of_id, del_flag, create_by, create_time, update_by, update_time, requirement_id, iteration_id, milestone_id) VALUES (2, 'ADMIN-BUG-20260515-0002', '12312', 1, NULL, 1, 'function', 'major', 'medium', 'assigned', '', '', '', '', 'testing', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 1, 6, NULL, NULL, NULL, NULL, NULL, '0', 'admin', '2026-05-15 15:18:56.019', 'admin', '2026-05-15 15:19:20.329', NULL, NULL, NULL);


--
-- Data for Name: project_activity; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.project_activity (activity_id, project_id, target_type, target_id, action, from_value, to_value, remark, operator_id, create_time) VALUES (1, 1, 'project', 1, 'update', 'requirement', 'internal_test', '根据项目管理需求文档和当前完成情况，初始化后台管理系统的需求、迭代、里程碑、版本和项目进度数据。', 1, '2026-05-17 02:27:58.349803');


--
-- Name: bug_project_module_module_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.bug_project_module_module_id_seq', 18, true);


--
-- Name: bug_project_project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.bug_project_project_id_seq', 10, true);


--
-- Name: bug_project_version_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.bug_project_version_version_id_seq', 13, true);


--
-- Name: bug_ticket_ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.bug_ticket_ticket_id_seq', 2, true);


--
-- Name: project_activity_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.project_activity_activity_id_seq', 1, true);


--
-- Name: project_iteration_iteration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.project_iteration_iteration_id_seq', 3, true);


--
-- Name: project_milestone_milestone_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.project_milestone_milestone_id_seq', 4, true);


--
-- Name: project_requirement_requirement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.project_requirement_requirement_id_seq', 16, true);


--
-- PostgreSQL database dump complete
--

\unrestrict nN1lRXa3BWT9sbG2emCAm1sAj5yCLLzyr7OksCT69of2KUU1uyavncWwXiqImeS


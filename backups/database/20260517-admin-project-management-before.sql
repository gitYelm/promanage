--
-- PostgreSQL database dump
--

\restrict e753qDzYdcSBOh7dDqcY7nrrbX842oZtvRfC67ncKamSLVjx2gzdyCRdXAo1CwN

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

INSERT INTO public.bug_project (project_id, project_name, project_key, owner_id, description, status, del_flag, create_by, create_time, update_by, update_time, project_stage, planned_start_time, planned_end_time, actual_start_time, actual_end_time, progress, risk_level, risk_note) VALUES (1, '后台管理系统', 'ADMIN', 1, 'Bug 反馈系统默认演示项目', '0', '0', 'admin', '2026-05-14 06:15:12.938409', '', '2026-05-16 12:26:22.935', 'requirement', NULL, NULL, NULL, NULL, 0, 'low', '');
INSERT INTO public.bug_project (project_id, project_name, project_key, owner_id, description, status, del_flag, create_by, create_time, update_by, update_time, project_stage, planned_start_time, planned_end_time, actual_start_time, actual_end_time, progress, risk_level, risk_note) VALUES (7, '青鸟探亲', 'FLYCARD', 8, '', '0', '0', '', '2026-05-14 08:26:51.333', '', '2026-05-16 17:29:50.24', 'requirement', NULL, NULL, NULL, NULL, 0, 'low', '');


--
-- Data for Name: bug_project_module; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (7, 7, '小程序端', NULL, 0, '0', '0', '2026-05-14 13:23:46.175', '2026-05-14 13:23:46.175');
INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (8, 7, '管理端', NULL, 0, '0', '0', '2026-05-14 13:23:59.008', '2026-05-14 13:24:16.474');
INSERT INTO public.bug_project_module (module_id, project_id, module_name, default_assignee_id, order_num, status, del_flag, create_time, update_time) VALUES (1, 1, '后端', 1, 1, '0', '0', '2026-05-14 06:15:12.938409', '2026-05-16 17:47:26.295');


--
-- Data for Name: project_iteration; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--



--
-- Data for Name: project_milestone; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--



--
-- Data for Name: bug_project_version; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.bug_project_version (version_id, project_id, version_no, version_name, release_date, status, del_flag, create_time, update_time, iteration_id, milestone_id, release_note) VALUES (7, 7, '0.1', '内测版本', NULL, 'testing', '0', '2026-05-14 14:18:03.057', '2026-05-14 14:18:03.057', NULL, NULL, '');
INSERT INTO public.bug_project_version (version_id, project_id, version_no, version_name, release_date, status, del_flag, create_time, update_time, iteration_id, milestone_id, release_note) VALUES (1, 1, 'v1.0.0', '初始版本', NULL, 'testing', '0', '2026-05-14 06:15:12.938409', '2026-05-16 12:26:22.942', NULL, NULL, '');


--
-- Data for Name: project_requirement; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--



--
-- Data for Name: bug_ticket; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--

INSERT INTO public.bug_ticket (ticket_id, ticket_no, title, project_id, module_id, version_id, type, severity, priority, status, description, reproduce_steps, expected_result, actual_result, environment, device_info, submitter_id, assignee_id, verifier_id, due_time, fix_note, verify_note, duplicate_of_id, del_flag, create_by, create_time, update_by, update_time, requirement_id, iteration_id, milestone_id) VALUES (1, 'ADMIN-BUG-20260514-0001', '撒的', 1, 1, 1, 'function', 'major', 'medium', 'reopened', '', '', '', '', 'testing', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 1, 1, 5, NULL, '', '', NULL, '0', 'admin', '2026-05-14 13:25:31.602', 'admin', '2026-05-15 15:18:45.699', NULL, NULL, NULL);
INSERT INTO public.bug_ticket (ticket_id, ticket_no, title, project_id, module_id, version_id, type, severity, priority, status, description, reproduce_steps, expected_result, actual_result, environment, device_info, submitter_id, assignee_id, verifier_id, due_time, fix_note, verify_note, duplicate_of_id, del_flag, create_by, create_time, update_by, update_time, requirement_id, iteration_id, milestone_id) VALUES (2, 'ADMIN-BUG-20260515-0002', '12312', 1, NULL, 1, 'function', 'major', 'medium', 'assigned', '', '', '', '', 'testing', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 1, 6, NULL, NULL, NULL, NULL, NULL, '0', 'admin', '2026-05-15 15:18:56.019', 'admin', '2026-05-15 15:19:20.329', NULL, NULL, NULL);


--
-- Data for Name: project_activity; Type: TABLE DATA; Schema: public; Owner: bug_feedback_admin
--



--
-- Name: bug_project_module_module_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.bug_project_module_module_id_seq', 11, true);


--
-- Name: bug_project_project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.bug_project_project_id_seq', 10, true);


--
-- Name: bug_project_version_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.bug_project_version_version_id_seq', 10, true);


--
-- Name: bug_ticket_ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.bug_ticket_ticket_id_seq', 2, true);


--
-- Name: project_activity_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.project_activity_activity_id_seq', 1, false);


--
-- Name: project_iteration_iteration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.project_iteration_iteration_id_seq', 1, false);


--
-- Name: project_milestone_milestone_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.project_milestone_milestone_id_seq', 1, false);


--
-- Name: project_requirement_requirement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bug_feedback_admin
--

SELECT pg_catalog.setval('public.project_requirement_requirement_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict e753qDzYdcSBOh7dDqcY7nrrbX842oZtvRfC67ncKamSLVjx2gzdyCRdXAo1CwN


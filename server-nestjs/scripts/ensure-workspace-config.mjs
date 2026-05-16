import 'dotenv/config'
import { Client } from 'pg'

const client = new Client({ connectionString: process.env.DATABASE_URL })

const configs = [
  ['admin', '/dashboard', '/dashboard', null, 'all', '0', '管理员保留系统首页'],
  ['tester', '/bug/my', '/bug/statistics', '/bug', 'business', '0', '测试人员默认进入我的缺陷'],
  ['developer', '/bug/my', '/bug/statistics', '/bug', 'business', '0', '开发人员默认进入我的缺陷'],
  ['reviewer', '/bug/statistics', '/bug/statistics', '/bug', 'business', '0', '审核人员默认进入缺陷看板'],
]

const workspacePerms = [
  ['工作台配置当前用户', 'system:workspace:current', 0],
  ['工作台配置查询', 'system:workspace:query', 1],
  ['工作台配置新增', 'system:workspace:add', 2],
  ['工作台配置修改', 'system:workspace:edit', 3],
  ['工作台配置删除', 'system:workspace:remove', 4],
]

async function ensureTable() {
  await client.query(`
    create table if not exists sys_role_workspace_config (
      config_id bigserial primary key,
      role_key varchar(100) not null,
      default_path varchar(200) not null,
      dashboard_path varchar(200),
      default_open_menu varchar(200),
      menu_scope varchar(30) not null default 'all',
      status char(1) not null default '0',
      create_by varchar(64) default '',
      create_time timestamp(6) default current_timestamp,
      update_by varchar(64) default '',
      update_time timestamp(6) default current_timestamp,
      remark varchar(500)
    )
  `)
  await client.query(`create unique index if not exists uk_role_workspace_role_key on sys_role_workspace_config(role_key)`)
  await client.query(`create index if not exists idx_role_workspace_status on sys_role_workspace_config(status)`)
}

async function ensureConfigs() {
  for (const item of configs) {
    await client.query(
      `insert into sys_role_workspace_config
       (role_key, default_path, dashboard_path, default_open_menu, menu_scope, status, remark, update_time)
       values ($1, $2, $3, $4, $5, $6, $7, now())
       on conflict (role_key) do update set
       default_path = excluded.default_path,
       dashboard_path = excluded.dashboard_path,
       default_open_menu = excluded.default_open_menu,
       menu_scope = excluded.menu_scope,
       status = excluded.status,
       remark = excluded.remark,
       update_time = now()`,
      item,
    )
  }
}

async function ensureMenu() {
  const system = await client.query(`select menu_id from sys_menu where path='/system' or menu_name='系统管理' order by menu_id limit 1`)
  if (!system.rows[0]) throw new Error('System menu not found')
  const parentId = system.rows[0].menu_id

  const existedMenu = await client.query(
    `select menu_id from sys_menu where parent_id=$1 and path='workspace-config' limit 1`,
    [parentId],
  )
  let workspaceMenuId = existedMenu.rows[0]?.menu_id
  if (!workspaceMenuId) {
    const menu = await client.query(
      `insert into sys_menu
       (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_time, update_time, remark)
       values ('工作台配置', $1, 9, 'workspace-config', 'system/workspace/index', 1, 0, 'C', '0', '0', 'system:workspace:list', 'layout-dashboard', now(), now(), '配置不同角色的默认首页与菜单体验')
       returning menu_id`,
      [parentId],
    )
    workspaceMenuId = menu.rows[0]?.menu_id
  }
  if (!workspaceMenuId) throw new Error('Workspace menu not found')

  await client.query(
    `update sys_menu set menu_name='工作台配置', component='system/workspace/index', perms='system:workspace:list', visible='0', status='0', update_time=now() where menu_id=$1`,
    [workspaceMenuId],
  )

  for (const [name, perms, orderNum] of workspacePerms) {
    const existedPerm = await client.query(
      `select menu_id from sys_menu where parent_id=$1 and perms=$2 limit 1`,
      [workspaceMenuId, perms],
    )
    if (!existedPerm.rows[0]) {
      await client.query(
        `insert into sys_menu
         (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_time, update_time)
         values ($1, $2, $3, '', '', 1, 0, 'F', '0', '0', $4, '#', now(), now())`,
        [name, workspaceMenuId, orderNum, perms],
      )
    } else {
      await client.query(
        `update sys_menu set menu_name=$1, order_num=$2, status='0', visible='0', update_time=now() where menu_id=$3`,
        [name, orderNum, existedPerm.rows[0].menu_id],
      )
    }
  }

  return workspaceMenuId
}

async function ensureRoleMenus() {
  const admin = await client.query(`select role_id from sys_role where role_key='admin' and del_flag='0' limit 1`)
  if (!admin.rows[0]) return
  const menuRows = await client.query(
    `select menu_id from sys_menu where perms in ('system:workspace:list','system:workspace:current','system:workspace:query','system:workspace:add','system:workspace:edit','system:workspace:remove')`,
  )
  for (const row of menuRows.rows) {
    await client.query(
      `insert into sys_role_menu(role_id, menu_id) values ($1, $2) on conflict do nothing`,
      [admin.rows[0].role_id, row.menu_id],
    )
  }
}

async function main() {
  await client.connect()
  await ensureTable()
  await ensureConfigs()
  await ensureMenu()
  await ensureRoleMenus()
  const result = await client.query(`select role_key, default_path, dashboard_path, default_open_menu, menu_scope, status from sys_role_workspace_config order by config_id`)
  console.table(result.rows)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await client.end()
  })

#!/usr/bin/env bash

# ============================================================
# RBAC Admin Pro - Prisma 数据库管理脚本
# 支持本地开发和 Docker 生产环境
# ============================================================

set -e

# 脚本位于 scripts/ 目录，ROOT 指向项目根目录
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$ROOT/server-nestjs"
BACKUP_DIR="$ROOT/backups"

# Docker 容器名称
POSTGRES_CONTAINER="rbac-postgres"
SERVER_CONTAINER="rbac-server"

# 颜色定义
ESC="$(printf '\033')"
BOLD="${ESC}[1m"
RESET="${ESC}[0m"
FG_GREEN="${ESC}[32m"
FG_RED="${ESC}[31m"
FG_YELLOW="${ESC}[33m"
FG_BLUE="${ESC}[34m"
FG_CYAN="${ESC}[36m"
FG_GRAY="${ESC}[90m"

if [ -n "$NO_COLOR" ] || [ ! -t 1 ]; then
  BOLD=""; RESET=""; FG_GREEN=""; FG_RED=""; FG_YELLOW=""; FG_BLUE=""; FG_CYAN=""; FG_GRAY=""
fi

# ============================================================
# 工具函数
# ============================================================

get_cols() {
  local c
  c=$(tput cols 2>/dev/null || echo 80)
  echo "$c"
}

repeat_char() {
  local ch="$1"; local n="$2"
  local out=""
  while [ ${#out} -lt "$n" ]; do out="$out$ch"; done
  echo "$out"
}

center_line() {
  local text="$1"; local cols
  cols=$(get_cols)
  local len=${#text}
  local pad=$(( (cols - len) / 2 ))
  [ "$pad" -lt 0 ] && pad=0
  printf "%*s%s\n" "$pad" "" "$text"
}

hr() {
  local cols
  cols=$(get_cols)
  printf "%s\n" "$(repeat_char '─' "$cols")"
}

print_success() {
  printf "${FG_GREEN}✓ %s${RESET}\n" "$1"
}

print_error() {
  printf "${FG_RED}✗ %s${RESET}\n" "$1"
}

print_warning() {
  printf "${FG_YELLOW}⚠ %s${RESET}\n" "$1"
}

print_info() {
  printf "${FG_BLUE}ℹ %s${RESET}\n" "$1"
}

confirm() {
  local message="$1"
  local default="${2:-n}"
  local response
  
  if [ "$default" = "y" ]; then
    read -rp "$(printf "${FG_YELLOW}%s [Y/n]: ${RESET}" "$message")" response
    response=${response:-y}
  else
    read -rp "$(printf "${FG_YELLOW}%s [y/N]: ${RESET}" "$message")" response
    response=${response:-n}
  fi
  
  [[ "$response" =~ ^[Yy]$ ]]
}

check_docker() {
  if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装"
    return 1
  fi
  
  if ! docker info &> /dev/null; then
    print_error "Docker 未运行"
    return 1
  fi
  
  return 0
}

check_container_running() {
  local container="$1"
  docker ps --format '{{.Names}}' | grep -q "^${container}$"
}

# ============================================================
# 本地开发命令
# ============================================================

cmd_generate() {
  print_info "执行: cd server-nestjs && pnpm prisma generate"
  cd "$SERVER_DIR"
  pnpm prisma generate
  print_success "Prisma Client 生成完成"
}

cmd_migrate_dev() {
  read -rp "$(printf "${FG_YELLOW}请输入迁移名称: ${RESET}")" migration_name
  if [ -z "$migration_name" ]; then
    print_error "迁移名称不能为空"
    return 1
  fi
  print_info "执行: cd server-nestjs && pnpm prisma migrate dev --name $migration_name"
  cd "$SERVER_DIR"
  pnpm prisma migrate dev --name "$migration_name"
  print_success "迁移创建完成: $migration_name"
}

cmd_migrate_status() {
  print_info "执行: cd server-nestjs && pnpm prisma migrate status"
  cd "$SERVER_DIR"
  pnpm prisma migrate status
}

cmd_migrate_reset() {
  print_warning "此操作将重置数据库，所有数据将丢失！"
  if confirm "确定要重置数据库吗？"; then
    print_info "执行: cd server-nestjs && pnpm prisma migrate reset"
    cd "$SERVER_DIR"
    pnpm prisma migrate reset
    print_success "数据库已重置"
  else
    print_info "操作已取消"
  fi
}

cmd_db_push() {
  print_warning "db push 会直接同步 schema 到数据库，不创建迁移记录"
  print_info "推荐仅在原型开发阶段使用"
  if confirm "确定要执行 db push 吗？"; then
    print_info "执行: cd server-nestjs && pnpm prisma db push"
    cd "$SERVER_DIR"
    pnpm prisma db push
    print_success "Schema 已同步到数据库"
  else
    print_info "操作已取消"
  fi
}

cmd_db_pull() {
  if confirm "这将覆盖当前的 schema.prisma，确定吗？"; then
    print_info "执行: cd server-nestjs && pnpm prisma db pull"
    cd "$SERVER_DIR"
    pnpm prisma db pull
    print_success "Schema 已从数据库拉取"
  else
    print_info "操作已取消"
  fi
}

cmd_seed() {
  print_info "执行: cd server-nestjs && pnpm prisma db seed"
  cd "$SERVER_DIR"
  pnpm prisma db seed
  print_success "种子数据已导入"
}

cmd_studio() {
  print_info "执行: cd server-nestjs && pnpm prisma studio"
  cd "$SERVER_DIR"
  pnpm prisma studio
}

cmd_format() {
  print_info "执行: cd server-nestjs && pnpm prisma format"
  cd "$SERVER_DIR"
  pnpm prisma format
  print_success "Schema 格式化完成"
}

cmd_validate() {
  print_info "执行: cd server-nestjs && pnpm prisma validate"
  cd "$SERVER_DIR"
  pnpm prisma validate
  print_success "Schema 验证通过"
}

# ============================================================
# Docker/生产环境命令
# ============================================================

docker_check_env() {
  if ! check_docker; then
    return 1
  fi
  
  if ! check_container_running "$POSTGRES_CONTAINER"; then
    print_error "PostgreSQL 容器 ($POSTGRES_CONTAINER) 未运行"
    print_info "请先执行: docker-compose up -d postgres"
    return 1
  fi
  
  return 0
}

docker_check_server() {
  if ! check_docker; then
    return 1
  fi
  
  if ! check_container_running "$SERVER_CONTAINER"; then
    print_error "Server 容器 ($SERVER_CONTAINER) 未运行"
    print_info "请先执行: docker-compose up -d server"
    return 1
  fi
  
  return 0
}

cmd_docker_migrate_deploy() {
  print_warning "此命令仅应用已有的迁移文件，不会创建新迁移"
  
  if ! docker_check_server; then
    return 1
  fi
  
  if confirm "确定要在生产环境执行迁移吗？"; then
    print_info "执行: docker exec $SERVER_CONTAINER npx prisma migrate deploy"
    docker exec "$SERVER_CONTAINER" npx prisma migrate deploy
    print_success "生产迁移执行完成"
  else
    print_info "操作已取消"
  fi
}

cmd_docker_migrate_status() {
  if ! docker_check_server; then
    return 1
  fi
  
  print_info "执行: docker exec $SERVER_CONTAINER npx prisma migrate status"
  docker exec "$SERVER_CONTAINER" npx prisma migrate status
}

cmd_docker_seed() {
  if ! docker_check_server; then
    return 1
  fi
  
  if confirm "确定要导入种子数据吗？"; then
    print_info "执行: docker exec $SERVER_CONTAINER npx prisma db seed"
    docker exec "$SERVER_CONTAINER" npx prisma db seed
    print_success "种子数据已导入"
  else
    print_info "操作已取消"
  fi
}

cmd_docker_reset() {
  if ! docker_check_env; then
    return 1
  fi
  
  if [ -f "$ROOT/.env" ]; then
    source "$ROOT/.env"
  fi
  
  print_warning "此操作将删除所有数据并重新初始化数据库！"
  print_warning "包括：删除所有表、重新执行迁移、导入种子数据"
  
  if ! confirm "确定要重置数据库吗？"; then
    print_info "操作已取消"
    return 0
  fi
  
  if ! confirm "再次确认：所有数据将丢失，是否继续？"; then
    print_info "操作已取消"
    return 0
  fi
  
  local db_name="${POSTGRES_DB:-rbac_admin}"
  local db_user="${POSTGRES_USER:-rbac_admin}"
  
  print_info "步骤 1/4: 断开所有连接..."
  docker exec "$POSTGRES_CONTAINER" psql -U "$db_user" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db_name' AND pid <> pg_backend_pid();" 2>/dev/null || true
  
  print_info "步骤 2/4: 删除并重建数据库..."
  docker exec "$POSTGRES_CONTAINER" psql -U "$db_user" -d postgres -c "DROP DATABASE IF EXISTS \"$db_name\";"
  docker exec "$POSTGRES_CONTAINER" psql -U "$db_user" -d postgres -c "CREATE DATABASE \"$db_name\" OWNER \"$db_user\";"
  
  if check_container_running "$SERVER_CONTAINER"; then
    print_info "步骤 3/4: 执行迁移..."
    docker exec "$SERVER_CONTAINER" npx prisma migrate deploy
    
    print_info "步骤 4/4: 导入种子数据..."
    docker exec "$SERVER_CONTAINER" npx prisma db seed
  else
    print_warning "Server 容器未运行，跳过迁移和种子数据"
    print_info "请启动 server 后手动执行: ./db.sh deploy && ./db.sh docker-seed"
  fi
  
  print_success "数据库重置完成"
}

cmd_docker_exec_sql() {
  if ! docker_check_env; then
    return 1
  fi
  
  read -rp "$(printf "${FG_YELLOW}请输入 SQL 文件路径 (相对于项目根目录): ${RESET}")" sql_file
  
  if [ ! -f "$ROOT/$sql_file" ]; then
    print_error "文件不存在: $sql_file"
    return 1
  fi
  
  if [ -f "$ROOT/.env" ]; then
    source "$ROOT/.env"
  fi
  
  print_warning "即将执行 SQL 文件: $sql_file"
  if confirm "确定要执行吗？"; then
    print_info "执行: docker exec -i $POSTGRES_CONTAINER psql -U ${POSTGRES_USER:-rbac_admin} -d ${POSTGRES_DB:-rbac_admin} < $sql_file"
    docker exec -i "$POSTGRES_CONTAINER" psql -U "${POSTGRES_USER:-rbac_admin}" -d "${POSTGRES_DB:-rbac_admin}" < "$ROOT/$sql_file"
    print_success "SQL 执行完成"
  else
    print_info "操作已取消"
  fi
}

cmd_docker_backup() {
  if ! docker_check_env; then
    return 1
  fi
  
  if [ -f "$ROOT/.env" ]; then
    source "$ROOT/.env"
  fi
  
  mkdir -p "$BACKUP_DIR"
  
  local timestamp backup_file
  timestamp=$(date +%Y%m%d_%H%M%S)
  backup_file="$BACKUP_DIR/rbac_backup_${timestamp}.sql"
  
  print_info "执行: docker exec $POSTGRES_CONTAINER pg_dump -U ${POSTGRES_USER:-rbac_admin} ${POSTGRES_DB:-rbac_admin} > $backup_file"
  docker exec "$POSTGRES_CONTAINER" pg_dump -U "${POSTGRES_USER:-rbac_admin}" "${POSTGRES_DB:-rbac_admin}" > "$backup_file"
  
  print_success "数据库备份完成: $backup_file"
}

cmd_docker_restore() {
  if ! docker_check_env; then
    return 1
  fi
  
  if [ ! -d "$BACKUP_DIR" ]; then
    print_error "备份目录不存在: $BACKUP_DIR"
    return 1
  fi
  
  # 获取备份文件列表
  local backup_files=()
  while IFS= read -r -d '' file; do
    backup_files+=("$file")
  done < <(find "$BACKUP_DIR" -maxdepth 1 -name "*.sql" -type f -print0 | sort -z -r)
  
  if [ ${#backup_files[@]} -eq 0 ]; then
    print_error "没有找到备份文件"
    return 1
  fi
  
  local backup_file
  
  if [ ${#backup_files[@]} -eq 1 ]; then
    # 只有一个备份文件，直接使用
    backup_file="${backup_files[0]}"
    print_info "找到备份文件: $(basename "$backup_file")"
  else
    # 多个备份文件，显示列表让用户选择
    echo ""
    echo "可用的备份文件:"
    local i=1
    for f in "${backup_files[@]}"; do
      local size
      size=$(ls -lh "$f" | awk '{print $5}')
      printf "${FG_CYAN}%d${RESET}. %s ${FG_GRAY}(%s)${RESET}\n" "$i" "$(basename "$f")" "$size"
      ((i++))
    done
    echo ""
    
    local choice
    read -rp "$(printf "${FG_YELLOW}请选择备份文件 [1-%d]: ${RESET}" "${#backup_files[@]}")" choice
    
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt ${#backup_files[@]} ]; then
      print_error "无效选择"
      return 1
    fi
    
    backup_file="${backup_files[$((choice-1))]}"
  fi
  
  if [ -f "$ROOT/.env" ]; then
    source "$ROOT/.env"
  fi
  
  print_warning "此操作将覆盖当前数据库！"
  print_info "备份文件: $(basename "$backup_file")"
  if confirm "确定要恢复数据库吗？"; then
    print_info "执行: docker exec -i $POSTGRES_CONTAINER psql -U ${POSTGRES_USER:-rbac_admin} -d ${POSTGRES_DB:-rbac_admin} < $backup_file"
    docker exec -i "$POSTGRES_CONTAINER" psql -U "${POSTGRES_USER:-rbac_admin}" -d "${POSTGRES_DB:-rbac_admin}" < "$backup_file"
    print_success "数据库恢复完成"
  else
    print_info "操作已取消"
  fi
}

cmd_docker_psql() {
  if ! docker_check_env; then
    return 1
  fi
  
  if [ -f "$ROOT/.env" ]; then
    source "$ROOT/.env"
  fi
  
  print_info "执行: docker exec -it $POSTGRES_CONTAINER psql -U ${POSTGRES_USER:-rbac_admin} -d ${POSTGRES_DB:-rbac_admin}"
  docker exec -it "$POSTGRES_CONTAINER" psql -U "${POSTGRES_USER:-rbac_admin}" -d "${POSTGRES_DB:-rbac_admin}"
}

# ============================================================
# 菜单显示
# ============================================================

print_menu() {
  echo ""
  center_line "${BOLD}${FG_CYAN}RBAC Admin Pro - Prisma 数据库管理${RESET}"
  hr
  
  printf "${FG_CYAN}[本地开发]${RESET}\n"
  printf "${FG_CYAN}1${RESET}.  生成 Prisma Client           ${FG_GRAY}pnpm prisma generate${RESET}\n"
  printf "${FG_CYAN}2${RESET}.  创建开发迁移                 ${FG_GRAY}pnpm prisma migrate dev --name xxx${RESET}\n"
  printf "${FG_CYAN}3${RESET}.  查看迁移状态                 ${FG_GRAY}pnpm prisma migrate status${RESET}\n"
  printf "${FG_RED}4${RESET}.  重置数据库 (危险)            ${FG_GRAY}pnpm prisma migrate reset${RESET}\n"
  printf "${FG_CYAN}5${RESET}.  推送 Schema (原型开发)       ${FG_GRAY}pnpm prisma db push${RESET}\n"
  printf "${FG_CYAN}6${RESET}.  拉取数据库 Schema            ${FG_GRAY}pnpm prisma db pull${RESET}\n"
  printf "${FG_CYAN}7${RESET}.  导入种子数据                 ${FG_GRAY}pnpm prisma db seed${RESET}\n"
  printf "${FG_CYAN}8${RESET}.  启动 Prisma Studio           ${FG_GRAY}pnpm prisma studio${RESET}\n"
  printf "${FG_CYAN}9${RESET}.  格式化 Schema                ${FG_GRAY}pnpm prisma format${RESET}\n"
  printf "${FG_CYAN}10${RESET}. 验证 Schema                  ${FG_GRAY}pnpm prisma validate${RESET}\n"
  
  hr
  printf "${FG_CYAN}[Docker / 生产环境]${RESET} ${FG_GRAY}(通过容器执行)${RESET}\n"
  printf "${FG_CYAN}11${RESET}. 执行生产迁移                 ${FG_GRAY}docker exec rbac-server npx prisma migrate deploy${RESET}\n"
  printf "${FG_CYAN}12${RESET}. 查看迁移状态 (Docker)        ${FG_GRAY}docker exec rbac-server npx prisma migrate status${RESET}\n"
  printf "${FG_CYAN}13${RESET}. 导入种子数据 (Docker)        ${FG_GRAY}docker exec rbac-server npx prisma db seed${RESET}\n"
  printf "${FG_RED}14${RESET}. 重置数据库 (危险)            ${FG_GRAY}DROP + CREATE + migrate + seed${RESET}\n"
  printf "${FG_CYAN}15${RESET}. 执行 SQL 文件                ${FG_GRAY}docker exec -i rbac-postgres psql < file.sql${RESET}\n"
  printf "${FG_CYAN}16${RESET}. 备份数据库                   ${FG_GRAY}docker exec rbac-postgres pg_dump > backup.sql${RESET}\n"
  printf "${FG_CYAN}17${RESET}. 恢复数据库                   ${FG_GRAY}docker exec -i rbac-postgres psql < backup.sql${RESET}\n"
  printf "${FG_CYAN}18${RESET}. 连接 PostgreSQL              ${FG_GRAY}docker exec -it rbac-postgres psql${RESET}\n"
  
  hr
  printf "${FG_CYAN}0${RESET}.  退出\n"
  hr
  echo ""
}

run_by_id() {
  case "$1" in
    1)  cmd_generate ;;
    2)  cmd_migrate_dev ;;
    3)  cmd_migrate_status ;;
    4)  cmd_migrate_reset ;;
    5)  cmd_db_push ;;
    6)  cmd_db_pull ;;
    7)  cmd_seed ;;
    8)  cmd_studio ;;
    9)  cmd_format ;;
    10) cmd_validate ;;
    11) cmd_docker_migrate_deploy ;;
    12) cmd_docker_migrate_status ;;
    13) cmd_docker_seed ;;
    14) cmd_docker_reset ;;
    15) cmd_docker_exec_sql ;;
    16) cmd_docker_backup ;;
    17) cmd_docker_restore ;;
    18) cmd_docker_psql ;;
    0)  exit 0 ;;
    *)  print_error "无效选项: $1" ;;
  esac
}

interactive() {
  print_menu
  while true; do
    read -rp "请输入数字选择: " num
    run_by_id "$num"
    [ "$num" = "0" ] && break
    echo ""
    read -rp "$(printf "${FG_CYAN}按 Enter 键继续...${RESET}")"
    print_menu
  done
}

print_help() {
  echo "用法: $0 [命令]"
  echo ""
  echo "本地开发命令:"
  echo "  generate        生成 Prisma Client"
  echo "  migrate-dev     创建开发迁移"
  echo "  migrate-status  查看迁移状态"
  echo "  migrate-reset   重置数据库"
  echo "  db-push         推送 Schema"
  echo "  db-pull         拉取数据库 Schema"
  echo "  seed            导入种子数据"
  echo "  studio          启动 Prisma Studio"
  echo "  format          格式化 Schema"
  echo "  validate        验证 Schema"
  echo ""
  echo "Docker/生产命令:"
  echo "  deploy          执行生产迁移"
  echo "  docker-status   查看迁移状态 (Docker)"
  echo "  docker-seed     导入种子数据 (Docker)"
  echo "  docker-reset    重置数据库 (Docker)"
  echo "  docker-sql      执行 SQL 文件"
  echo "  backup          备份数据库"
  echo "  restore         恢复数据库"
  echo "  psql            连接 PostgreSQL"
  echo ""
  echo "不带参数运行将进入交互式菜单"
}

main() {
  if [ "$1" = "--list" ]; then
    print_menu
    exit 0
  fi
  
  if [ "$1" = "--action" ] && [ -n "$2" ]; then
    run_by_id "$2"
    exit 0
  fi
  
  if [ $# -gt 0 ]; then
    case $1 in
      generate)       cmd_generate ;;
      migrate-dev)    cmd_migrate_dev ;;
      migrate-status) cmd_migrate_status ;;
      migrate-reset)  cmd_migrate_reset ;;
      db-push)        cmd_db_push ;;
      db-pull)        cmd_db_pull ;;
      seed)           cmd_seed ;;
      studio)         cmd_studio ;;
      format)         cmd_format ;;
      validate)       cmd_validate ;;
      deploy)         cmd_docker_migrate_deploy ;;
      docker-status)  cmd_docker_migrate_status ;;
      docker-seed)    cmd_docker_seed ;;
      docker-reset)   cmd_docker_reset ;;
      docker-sql)     cmd_docker_exec_sql ;;
      backup)         cmd_docker_backup ;;
      restore)        cmd_docker_restore ;;
      psql)           cmd_docker_psql ;;
      help|--help|-h) print_help ;;
      *)
        print_error "未知命令: $1"
        echo "运行 '$0 --help' 查看帮助"
        exit 1
        ;;
    esac
  else
    interactive
  fi
}

main "$@"

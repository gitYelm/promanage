#!/usr/bin/env bash

# ============================================================
# RBAC Admin Pro - 统一管理入口
# 支持两种模式：
#   - 交互模式：方向键选择（完整 TTY 终端）
#   - 简单模式：数字输入（宝塔等 Web 终端）
# 用法:
#   ./admin.sh           自动检测模式
#   ./admin.sh -s        强制简单模式
#   ./admin.sh --simple  强制简单模式
#   ./admin.sh 1         直接进入服务管理
#   ./admin.sh 2         直接进入数据库管理
# ============================================================

# 注意：不使用 set -e，因为某些终端环境下会导致意外退出

ROOT="$(cd "$(dirname "$0")" && pwd)"
SCRIPTS_DIR="$ROOT/scripts"

# 颜色定义
ESC="$(printf '\033')"
BOLD="${ESC}[1m"
RESET="${ESC}[0m"
FG_GREEN="${ESC}[32m"
FG_CYAN="${ESC}[36m"
FG_GRAY="${ESC}[90m"

if [ -n "$NO_COLOR" ] || [ ! -t 1 ]; then
  BOLD=""; RESET=""; FG_GREEN=""; FG_CYAN=""; FG_GRAY=""
fi

# 菜单选项
OPTIONS=(
  "服务管理|启停服务、构建部署、Docker 管理"
  "数据库管理|Prisma 迁移、备份恢复、种子数据"
)

# 对应的脚本
SCRIPTS=(
  "$SCRIPTS_DIR/monorepo.sh"
  "$SCRIPTS_DIR/db.sh"
)

# 当前选中项
SELECTED=0

# 全局变量：使用简单模式
USE_SIMPLE_MODE=false

# 检测终端是否支持交互模式
check_interactive_support() {
  # 宝塔服务器直接用简单模式（最可靠的检测）
  [ -d "/www/server/panel" ] && return 1
  
  # 非 TTY 不支持
  [ ! -t 0 ] && return 1
  [ ! -t 1 ] && return 1
  
  # 检查 TERM 变量
  case "$TERM" in
    dumb|unknown|"") return 1 ;;
  esac
  
  # 检测宝塔环境变量
  [ -n "$BT_PANEL" ] && return 1
  [ -n "$BT_TASK" ] && return 1
  
  return 0
}

# 隐藏光标
hide_cursor() { printf '\033[?25l'; }

# 显示光标
show_cursor() { printf '\033[?25h'; }

# 清理并退出
cleanup() {
  show_cursor
  exit 0
}

trap cleanup EXIT INT TERM

# 交互模式菜单
draw_menu() {
  clear
  echo ""
  echo "  ${BOLD}${FG_CYAN}┌──────────────────────────────────────────┐${RESET}"
  echo "  ${BOLD}${FG_CYAN}│              RBAC Admin Pro              │${RESET}"
  echo "  ${BOLD}${FG_CYAN}├──────────────────────────────────────────┤${RESET}"
  echo "  ${BOLD}${FG_CYAN}│${RESET}    ${FG_CYAN}↑↓${RESET} 选择  ${FG_GREEN}1-2${RESET} 快捷  ${FG_CYAN}⏎${RESET} 确认  ${FG_GREEN}q${RESET} 退出  ${BOLD}${FG_CYAN}   │${RESET}"
  echo "  ${BOLD}${FG_CYAN}└──────────────────────────────────────────┘${RESET}"
  echo ""
  
  local i=0
  for opt in "${OPTIONS[@]}"; do
    local name="${opt%%|*}"
    local desc="${opt#*|}"
    local num=$((i + 1))
    
    if [ $i -eq $SELECTED ]; then
      echo "  ${FG_GREEN}▸ ${num}. ${BOLD}${name}${RESET}"
      echo "       ${FG_GRAY}${desc}${RESET}"
    else
      echo "    ${num}. ${name}"
      echo "       ${FG_GRAY}${desc}${RESET}"
    fi
    
    if [ $i -lt $((${#OPTIONS[@]} - 1)) ]; then
      echo ""
    fi
    ((i++))
  done
  
  echo ""
}

# 读取按键
read_key() {
  local key
  IFS= read -rsn1 key
  
  if [ "$key" = $'\033' ]; then
    read -rsn2 key
    case "$key" in
      '[A') echo "UP" ;;
      '[B') echo "DOWN" ;;
      *) echo "" ;;
    esac
  elif [ "$key" = "" ]; then
    echo "ENTER"
  elif [ "$key" = "q" ] || [ "$key" = "Q" ]; then
    echo "QUIT"
  elif [ "$key" = "j" ]; then
    echo "DOWN"
  elif [ "$key" = "k" ]; then
    echo "UP"
  elif [ "$key" = "1" ]; then
    echo "SELECT_1"
  elif [ "$key" = "2" ]; then
    echo "SELECT_2"
  else
    echo ""
  fi
}

# 简单模式菜单（数字输入）
draw_simple_menu() {
  clear
  echo ""
  echo "  ${BOLD}${FG_CYAN}┌──────────────────────────────────────────┐${RESET}"
  echo "  ${BOLD}${FG_CYAN}│              RBAC Admin Pro              │${RESET}"
  echo "  ${BOLD}${FG_CYAN}├──────────────────────────────────────────┤${RESET}"
  echo "  ${BOLD}${FG_CYAN}│${RESET}         输入数字选择，${FG_GREEN}0${RESET} 或 ${FG_GREEN}q${RESET} 退出         ${BOLD}${FG_CYAN}│${RESET}"
  echo "  ${BOLD}${FG_CYAN}└──────────────────────────────────────────┘${RESET}"
  echo ""
  
  local i=0
  for opt in "${OPTIONS[@]}"; do
    local name="${opt%%|*}"
    local desc="${opt#*|}"
    local num=$((i + 1))
    
    echo "  ${FG_GREEN}${num}.${RESET} ${BOLD}${name}${RESET}"
    echo "     ${FG_GRAY}${desc}${RESET}"
    
    if [ $i -lt $((${#OPTIONS[@]} - 1)) ]; then
      echo ""
    fi
    ((i++))
  done
  
  echo ""
  echo "  ${FG_GRAY}0. 退出${RESET}"
  echo ""
}

# 简单模式主循环
simple_main() {
  while true; do
    draw_simple_menu
    printf "  请输入数字选择: "
    read -r choice
    
    case "$choice" in
      1)
        clear
        exec "${SCRIPTS[0]}"
        ;;
      2)
        clear
        exec "${SCRIPTS[1]}"
        ;;
      0|q|Q)
        clear
        exit 0
        ;;
      *)
        echo ""
        echo "  ${FG_GRAY}无效选项，请重新输入${RESET}"
        sleep 1
        ;;
    esac
  done
}

# 交互模式主循环
interactive_main() {
  hide_cursor
  draw_menu
  
  while true; do
    local key
    key=$(read_key)
    
    case "$key" in
      UP)
        if [ $SELECTED -gt 0 ]; then
          ((SELECTED--))
        fi
        draw_menu
        ;;
      DOWN)
        if [ $SELECTED -lt $((${#OPTIONS[@]} - 1)) ]; then
          ((SELECTED++))
        fi
        draw_menu
        ;;
      SELECT_1)
        SELECTED=0
        show_cursor
        clear
        exec "${SCRIPTS[$SELECTED]}"
        ;;
      SELECT_2)
        SELECTED=1
        show_cursor
        clear
        exec "${SCRIPTS[$SELECTED]}"
        ;;
      ENTER)
        show_cursor
        clear
        exec "${SCRIPTS[$SELECTED]}"
        ;;
      QUIT)
        exit 0
        ;;
    esac
  done
}

# 显示帮助
show_help() {
  echo "用法: $0 [选项]"
  echo ""
  echo "选项:"
  echo "  1              服务管理"
  echo "  2              数据库管理"
  echo "  -s, --simple   强制使用简单模式（数字输入）"
  echo "  -h, --help     显示帮助"
  echo ""
  echo "不带参数运行将自动检测终端类型选择模式"
  echo "宝塔 Web 终端会自动使用简单模式"
}

# 主入口
main() {
  # 解析命令行参数
  while [ $# -gt 0 ]; do
    case "$1" in
      1)
        exec "${SCRIPTS[0]}"
        ;;
      2)
        exec "${SCRIPTS[1]}"
        ;;
      -s|--simple)
        USE_SIMPLE_MODE=true
        shift
        ;;
      -h|--help)
        show_help
        exit 0
        ;;
      *)
        echo "无效选项: $1"
        echo "运行 '$0 --help' 查看帮助"
        exit 1
        ;;
    esac
  done

  # 检查脚本是否存在
  for script in "${SCRIPTS[@]}"; do
    if [ ! -f "$script" ]; then
      echo "错误: 脚本不存在 - $script"
      exit 1
    fi
  done

  # 决定使用哪种模式
  if [ "$USE_SIMPLE_MODE" = true ]; then
    simple_main
  elif check_interactive_support; then
    interactive_main
  else
    simple_main
  fi
}

main "$@"

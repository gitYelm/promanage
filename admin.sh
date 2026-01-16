#!/usr/bin/env bash

# ============================================================
# RBAC Admin Pro - 统一管理入口
# 使用上下键选择，回车确认
# 支持命令行参数: ./admin.sh 1 (服务管理) ./admin.sh 2 (数据库管理)
# ============================================================

set -e

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

# 绘制菜单
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
    
    # 选项之间加空行分隔
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
  
  # 检测方向键（ESC 序列）
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

# 主循环
main() {
  # 支持命令行参数直接选择
  if [ -n "$1" ]; then
    case "$1" in
      1) exec "${SCRIPTS[0]}" ;;
      2) exec "${SCRIPTS[1]}" ;;
      -h|--help)
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  1          服务管理"
        echo "  2          数据库管理"
        echo "  -h, --help 显示帮助"
        echo ""
        echo "不带参数运行将进入交互式菜单"
        exit 0
        ;;
      *)
        echo "无效选项: $1"
        echo "运行 '$0 --help' 查看帮助"
        exit 1
        ;;
    esac
  fi

  # 检查脚本是否存在
  for script in "${SCRIPTS[@]}"; do
    if [ ! -f "$script" ]; then
      echo "错误: 脚本不存在 - $script"
      exit 1
    fi
  done

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

main "$@"

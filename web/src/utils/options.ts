/**
 * 下拉选项工具函数
 * 用于统一处理 Select 组件的选项，支持添加"全部"选项
 */

export interface SelectOption {
  label: string
  value: string
}

/**
 * 常用状态选项定义
 */
export const STATUS_OPTIONS = {
  /** 正常/停用 */
  normalDisable: [
    { label: '正常', value: '0' },
    { label: '停用', value: '1' },
  ],
  /** 显示/隐藏 */
  showHide: [
    { label: '显示', value: '0' },
    { label: '隐藏', value: '1' },
  ],
  /** 正常/关闭 */
  normalClose: [
    { label: '正常', value: '0' },
    { label: '关闭', value: '1' },
  ],
  /** 正常/暂停 (定时任务) */
  normalPause: [
    { label: '正常', value: '0' },
    { label: '暂停', value: '1' },
  ],
  /** 成功/失败 */
  successFail: [
    { label: '成功', value: '0' },
    { label: '失败', value: '1' },
  ],
} as const

/** "全部"选项的特殊值（shadcn-vue SelectItem 不支持空字符串） */
export const ALL_OPTION_VALUE = '__all__'

/**
 * 为选项列表添加"全部"选项
 * @param options 原始选项列表
 * @param allLabel "全部"选项的显示文本，默认为"全部"
 * @returns 包含"全部"选项的新列表
 */
export function withAllOption(
  options: readonly SelectOption[] | SelectOption[],
  allLabel = '全部'
): SelectOption[] {
  return [{ label: allLabel, value: ALL_OPTION_VALUE }, ...options]
}

/**
 * 转换查询参数值（将"全部"特殊值转为 undefined）
 * @param value 选项值
 * @returns 实际查询值
 */
export function toQueryValue(value: string | undefined): string | undefined {
  return value === ALL_OPTION_VALUE ? undefined : value
}

/**
 * 获取带"全部"选项的状态列表（用于搜索筛选）
 * @param type 状态类型
 * @returns 包含"全部"选项的状态列表
 */
export function getStatusOptionsWithAll(
  type: keyof typeof STATUS_OPTIONS = 'normalDisable'
): SelectOption[] {
  return withAllOption(STATUS_OPTIONS[type])
}

/**
 * 获取状态选项列表（不含"全部"，用于表单）
 * @param type 状态类型
 * @returns 状态选项列表
 */
export function getStatusOptions(
  type: keyof typeof STATUS_OPTIONS = 'normalDisable'
): SelectOption[] {
  return [...STATUS_OPTIONS[type]]
}

/**
 * 根据值获取选项标签
 * @param options 选项列表
 * @param value 值
 * @returns 对应的标签，未找到返回 value 本身
 */
export function getOptionLabel(
  options: readonly SelectOption[] | SelectOption[],
  value: string
): string {
  return options.find((opt) => opt.value === value)?.label ?? value
}

const BUSINESS_TYPE_LABELS: Record<number, string> = {
  0: '其它',
  1: '新增',
  2: '修改',
  3: '删除',
  4: '授权',
  5: '导出',
  6: '导入',
  7: '强退',
  8: '清空',
}

export function getBusinessTypeLabel(type: number) {
  return BUSINESS_TYPE_LABELS[type] || '未知'
}

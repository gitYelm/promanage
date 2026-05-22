import { ExcelColumn } from '../../common/excel/excel.service'

export const REQUIREMENT_EXPORT_MODULE = 'pm-requirement'

export const REQUIREMENT_EXPORT_COLUMNS: ExcelColumn[] = [
  { key: 'requirementNo', header: '需求编号', width: 22 },
  { key: 'title', header: '需求标题', width: 32 },
  { key: 'projectName', header: '所属项目', width: 20 },
  { key: 'moduleName', header: '所属模块', width: 18 },
  { key: 'type', header: '需求类型', width: 14 },
  { key: 'source', header: '需求来源', width: 16 },
  { key: 'priority', header: '优先级', width: 10 },
  { key: 'status', header: '状态', width: 12 },
  { key: 'valueScore', header: '业务价值分', width: 12 },
  { key: 'difficultyScore', header: '实现难度分', width: 12 },
  { key: 'ownerName', header: '需求负责人', width: 16 },
  { key: 'developerName', header: '开发负责人', width: 16 },
  { key: 'testerName', header: '测试负责人', width: 16 },
  { key: 'iterationName', header: '所属迭代', width: 18 },
  { key: 'milestoneName', header: '所属里程碑', width: 18 },
  { key: 'versionNo', header: '目标版本', width: 16 },
  { key: 'plannedStartTime', header: '计划开始时间', width: 18 },
  { key: 'plannedEndTime', header: '计划完成时间', width: 18 },
  { key: 'description', header: '需求描述', width: 36 },
  { key: 'acceptanceCriteria', header: '验收标准', width: 36 },
  { key: 'remark', header: '备注', width: 24 },
]

export const REQUIREMENT_IMPORT_COLUMNS = REQUIREMENT_EXPORT_COLUMNS.filter(
  (column) => !['requirementNo', 'status'].includes(column.key),
)

export const REQUIREMENT_IMPORT_COLUMN_MAP: Record<string, string> = {
  需求标题: 'title',
  所属项目: 'projectName',
  所属模块: 'moduleName',
  需求类型: 'type',
  需求来源: 'source',
  优先级: 'priority',
  业务价值分: 'valueScore',
  实现难度分: 'difficultyScore',
  需求负责人: 'ownerName',
  开发负责人: 'developerName',
  测试负责人: 'testerName',
  所属迭代: 'iterationName',
  所属里程碑: 'milestoneName',
  目标版本: 'versionNo',
  计划开始时间: 'plannedStartTime',
  计划完成时间: 'plannedEndTime',
  需求描述: 'description',
  验收标准: 'acceptanceCriteria',
  备注: 'remark',
}

export const REQUIREMENT_IMPORT_EXAMPLE = [
  {
    title: '后台管理系统新增批量导出能力',
    projectName: '飞鸟探亲',
    moduleName: '后台管理端',
    type: '新功能',
    source: '运营反馈',
    priority: '高',
    valueScore: 80,
    difficultyScore: 40,
    ownerName: 'product_owner',
    developerName: 'developer01',
    testerName: 'tester01',
    iterationName: '',
    milestoneName: '',
    versionNo: '',
    plannedStartTime: '2026-06-01',
    plannedEndTime: '2026-06-15',
    description: '支持按当前筛选条件导出需求数据。',
    acceptanceCriteria: '有权限用户可以下载需求导出文件。',
    remark: '示例行可删除',
  },
]

export const REQUIREMENT_TYPE_LABELS: Record<string, string> = {
  feature: '新功能',
  improvement: '优化改进',
  technical: '技术改造',
  ux: '体验优化',
  security: '安全需求',
}

export const REQUIREMENT_PRIORITY_LABELS: Record<string, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
}

export const REQUIREMENT_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  reviewing: '评审中',
  approved: '已通过',
  rejected: '已驳回',
  deferred: '已延期',
  planned: '已排期',
  developing: '开发中',
  testing: '测试中',
  accepted: '已验收',
  released: '已发布',
  closed: '已关闭',
  changed: '变更中',
}

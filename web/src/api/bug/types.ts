export interface PageResult<T> {
  rows: T[]
  total: number
}

export interface BugUserRef {
  userId: string
  userName: string
  nickName: string
}

export interface BugProject {
  projectId: string
  projectName: string
  projectKey: string
  ownerId?: string
  description?: string
  status?: string
  owner?: BugUserRef
}

export interface BugModule {
  moduleId: string
  projectId: string
  moduleName: string
  defaultAssigneeId?: string
  orderNum?: number
  status?: string
  project?: BugProject
  defaultAssignee?: BugUserRef
}


export interface BugMember {
  memberId: string
  projectId: string
  userId: string
  memberRole: string
  isDefault?: boolean
  status?: string
  user?: BugUserRef
}

export interface BugVersion {
  versionId: string
  projectId: string
  versionNo: string
  versionName?: string
  status?: string
  project?: BugProject
}

export interface BugAttachment {
  attachmentId: string
  ticketId?: string
  fileName: string
  originalName: string
  fileUrl: string
  fileType: string
  fileSize: string
  attachmentType: string
  uploader?: BugUserRef
}

export interface BugTicket {
  ticketId: string
  ticketNo: string
  title: string
  projectId: string
  moduleId?: string
  versionId?: string
  type: string
  severity: string
  priority: string
  status: string
  description?: string
  reproduceSteps?: string
  expectedResult?: string
  actualResult?: string
  environment?: string
  deviceInfo?: string
  submitterId: string
  assigneeId?: string
  verifierId?: string
  dueTime?: string
  fixNote?: string
  verifyNote?: string
  createTime?: string
  updateTime?: string
  project?: BugProject
  module?: BugModule
  version?: BugVersion
  submitter?: BugUserRef
  assignee?: BugUserRef
  verifier?: BugUserRef
  attachments?: BugAttachment[]
  comments?: Array<{ commentId: string; content: string; user?: BugUserRef; createTime?: string }>
  histories?: Array<{ historyId: string; action: string; fromValue?: string; toValue?: string; remark?: string; createTime?: string; operator?: BugUserRef }>
  availableActions?: BugActionOption[]
}

export interface BugActionOption {
  action: string
  to: string
  remarkRequired?: boolean
  permissions: string[]
  label: string
}

export interface BugStatusStatisticsItem {
  status: string
  _count: { status: number }
}

export interface BugSeverityStatisticsItem {
  severity: string
  _count: { severity: number }
}

export interface BugProjectStatisticsItem {
  projectId: string
  projectName?: string
  _count: { projectId: number }
}

export interface BugAssigneeStatisticsItem {
  assigneeId?: string
  user?: BugUserRef | null
  _count: { assigneeId: number }
}

export interface BugStatisticsResult {
  total: number
  byStatus: BugStatusStatisticsItem[]
  bySeverity: BugSeverityStatisticsItem[]
  byProject: BugProjectStatisticsItem[]
  byAssignee: BugAssigneeStatisticsItem[]
}

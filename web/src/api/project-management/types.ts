export interface PageResult<T> { rows: T[]; total: number }
export interface UserRef { userId: string; userName: string; nickName: string }
export interface ProjectRef {
  projectId: string; projectName: string; projectKey: string; projectStage?: string; progress?: number
  plannedStartTime?: string; plannedEndTime?: string; actualStartTime?: string; actualEndTime?: string
  riskLevel?: string; riskNote?: string; status?: string; ownerId?: string; owner?: UserRef
}
export interface ModuleRef { moduleId: string; moduleName: string }

export interface Requirement {
  requirementId: string; requirementNo: string; title: string; projectId: string; moduleId?: string
  type: string; source?: string; priority: string; status: string; ownerId?: string; developerId?: string; testerId?: string
  iterationId?: string; milestoneId?: string; versionId?: string; plannedStartTime?: string; plannedEndTime?: string
  actualEndTime?: string; description?: string; acceptanceCriteria?: string; remark?: string; createTime?: string; updateTime?: string
  project?: ProjectRef; module?: ModuleRef; owner?: UserRef; developer?: UserRef; tester?: UserRef; iteration?: Iteration; milestone?: Milestone
}
export interface RequirementForm extends Partial<Requirement> {}
export interface RequirementQuery { pageNum?: number; pageSize?: number; keyword?: string; projectId?: string; moduleId?: string; status?: string; priority?: string; ownerId?: string; developerId?: string; iterationId?: string }

export interface Iteration { iterationId: string; projectId: string; iterationName: string; goal?: string; status: string; ownerId?: string; startDate?: string; endDate?: string; summary?: string; riskNote?: string; project?: ProjectRef; owner?: UserRef }
export interface IterationForm extends Partial<Iteration> {}
export interface IterationQuery { pageNum?: number; pageSize?: number; keyword?: string; projectId?: string; status?: string }

export interface Milestone { milestoneId: string; projectId: string; milestoneName: string; stage: string; status: string; ownerId?: string; targetDate?: string; completedTime?: string; completionCriteria?: string; remark?: string; project?: ProjectRef; owner?: UserRef }
export interface MilestoneForm extends Partial<Milestone> {}
export interface MilestoneQuery { pageNum?: number; pageSize?: number; keyword?: string; projectId?: string; status?: string }

export interface DashboardQuery { pageNum?: number; pageSize?: number; projectId?: string; projectStage?: string; ownerId?: string; riskLevel?: string; beginTime?: string; endTime?: string }
export interface WorkCountsSummary { currentRequirements: number; completedRequirements: number; pendingRequirements: number; currentBugs: number; completedBugs: number; pendingBugs: number; blockerBugs: number }
export interface DashboardSummary extends WorkCountsSummary { totalProjects: number; normalProjects: number; riskProjects: number; delayedProjects: number; upcomingMilestones: number; lastUpdatedAt: string }
export interface ProjectHealth { project: ProjectRef; progress: number; bugCloseRate: number; blockerBugs: number; delayedMilestones: number; health: string }
export interface ProjectProgressForm extends Pick<ProjectRef, 'projectStage' | 'plannedStartTime' | 'plannedEndTime' | 'actualStartTime' | 'actualEndTime' | 'progress' | 'riskLevel' | 'riskNote'> { remark?: string }
export interface WorkItems { requirements: Requirement[]; bugs: Array<Record<string, unknown>> }
export interface Activity { activityId: string; targetType: string; action: string; fromValue?: string; toValue?: string; remark?: string; createTime?: string; operator?: UserRef }
export interface RiskItems { blockingBugs: Array<Record<string, unknown>>; delayedMilestones: Milestone[]; pendingRequirements: Requirement[] }
export interface ActionAdvice { level: string; message: string }
export interface ProjectOverview { project: ProjectRef; progress: number; requirementTotal: number; requirementDone: number; bugTotal: number; bugClosed: number; bugCloseRate: number; counts: WorkCountsSummary; currentRequirements: Requirement[]; currentBugs: Array<Record<string, unknown>>; pendingRequirements: Requirement[]; pendingBugs: Array<Record<string, unknown>>; completedRequirements: Requirement[]; completedBugs: Array<Record<string, unknown>>; nextMilestone?: Milestone; activities: Activity[] }

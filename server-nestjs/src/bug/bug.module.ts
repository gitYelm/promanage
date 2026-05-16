import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { LoggerModule } from '../common/logger/logger.module'
import { UploadModule } from '../common/upload/upload.module'
import { BugAccessService } from './bug-access.service'
import { BugProjectController } from './project/bug-project.controller'
import { BugProjectService } from './project/bug-project.service'
import { BugProjectHelperService } from './project/bug-project-helper.service'
import { BugTicketController } from './ticket/bug-ticket.controller'
import { BugTicketService } from './ticket/bug-ticket.service'
import { BugAttachmentController } from './ticket/bug-attachment.controller'
import { BugAttachmentService } from './ticket/bug-attachment.service'
import { BugStatisticsService } from './ticket/bug-statistics.service'
import { BugStatisticsExportProvider } from './ticket/bug-statistics-export.provider'
import { NotificationModule } from '../system/notification/notification.module'
import { BugNotificationService } from './bug-notification.service'
import { ProjectManagementController } from './project-management/project-management.controller'
import { ProjectRequirementService } from './project-management/project-requirement.service'
import { ProjectIterationService } from './project-management/project-iteration.service'
import { ProjectMilestoneService } from './project-management/project-milestone.service'
import { ProjectActivityService } from './project-management/project-activity.service'
import { ProjectOverviewService } from './project-management/project-overview.service'
import { ExecutiveDashboardService } from './project-management/executive-dashboard.service'
import { ProjectDashboardQueryService } from './project-management/project-dashboard-query.service'

@Module({
  imports: [PrismaModule, LoggerModule, UploadModule, NotificationModule],
  controllers: [BugProjectController, BugTicketController, BugAttachmentController, ProjectManagementController],
  providers: [
    BugAccessService,
    BugProjectService,
    BugProjectHelperService,
    BugTicketService,
    BugAttachmentService,
    BugStatisticsService,
    BugStatisticsExportProvider,
    BugNotificationService,
    ProjectRequirementService,
    ProjectIterationService,
    ProjectMilestoneService,
    ProjectActivityService,
    ProjectOverviewService,
    ExecutiveDashboardService,
    ProjectDashboardQueryService,
  ],
})
export class BugModule {}

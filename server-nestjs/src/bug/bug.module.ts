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

@Module({
  imports: [PrismaModule, LoggerModule, UploadModule],
  controllers: [BugProjectController, BugTicketController, BugAttachmentController],
  providers: [
    BugAccessService,
    BugProjectService,
    BugProjectHelperService,
    BugTicketService,
    BugAttachmentService,
    BugStatisticsService,
    BugStatisticsExportProvider,
  ],
})
export class BugModule {}

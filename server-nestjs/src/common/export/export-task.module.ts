import { Module, Global } from '@nestjs/common'
import { ExportTaskController } from './export-task.controller'
import { ExportTaskService } from './export-task.service'
import { ExportPermissionService } from './export-permission.service'

@Global()
@Module({
  controllers: [ExportTaskController],
  providers: [ExportTaskService, ExportPermissionService],
  exports: [ExportTaskService],
})
export class ExportTaskModule {}

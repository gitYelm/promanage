import { Module, Global } from '@nestjs/common'
import { ExportTaskController } from './export-task.controller'
import { ExportTaskService } from './export-task.service'

@Global()
@Module({
  controllers: [ExportTaskController],
  providers: [ExportTaskService],
  exports: [ExportTaskService],
})
export class ExportTaskModule {}

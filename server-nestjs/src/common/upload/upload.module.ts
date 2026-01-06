import { Module } from '@nestjs/common'
import { UploadController } from './upload.controller'
import { StorageService } from './storage.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { LoggerModule } from '../logger/logger.module'

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [UploadController],
  providers: [StorageService],
  exports: [StorageService],
})
export class UploadModule {}

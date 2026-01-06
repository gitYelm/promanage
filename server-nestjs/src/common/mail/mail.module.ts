import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { MailController } from './mail.controller'
import { PrismaModule } from '../../prisma/prisma.module'
import { LoggerModule } from '../logger/logger.module'

@Module({
  imports: [PrismaModule, LoggerModule],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

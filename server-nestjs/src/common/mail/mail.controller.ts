import { Controller, Post, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { MailService } from './mail.service'

@ApiTags('邮件服务')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('system/mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  @ApiOperation({ summary: '测试邮件发送' })
  async testMail() {
    return this.mailService.testMail()
  }
}

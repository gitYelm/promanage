import { Body, Controller, Delete, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { Log, BusinessType } from '../../common/decorators/log.decorator'
import { UploadBugAttachmentDto } from '../dto/attachment.dto'
import { BugAttachmentService } from './bug-attachment.service'

type RequestWithUser = Request & { user: { userId: string; username: string } }

@ApiTags('Bug 附件')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('bug/attachments')
export class BugAttachmentController {
  constructor(private readonly service: BugAttachmentService) {}

  @Post('upload')
  @RequirePermission('bug:attachment:upload')
  @Log('Bug 附件', BusinessType.INSERT)
  @ApiOperation({ summary: '上传 Bug 附件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadBugAttachmentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.service.upload(file, dto, req.user)
  }

  @Delete(':attachmentId')
  @RequirePermission('bug:attachment:remove')
  @Log('Bug 附件', BusinessType.DELETE)
  @ApiOperation({ summary: '删除 Bug 附件' })
  remove(@Param('attachmentId') attachmentId: string, @Req() req: RequestWithUser) {
    return this.service.remove(attachmentId, req.user)
  }
}

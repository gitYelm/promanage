import { Injectable } from '@nestjs/common'
import { StorageService } from '../../common/upload/storage.service'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../../common/logger/logger.service'
import { BusinessException } from '../../common/exceptions/business.exception'
import { ErrorCode } from '../../common/enums/error-code.enum'
import { BUG_ACTION, BUG_ATTACHMENT_TYPE } from '../constants/bug.constants'
import { UploadBugAttachmentDto } from '../dto/attachment.dto'
import { BugAccessService } from '../bug-access.service'
import type { RequestUserLike } from '../bug-access.service'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
const LOG_TYPES = ['text/plain', 'application/json', 'application/octet-stream']
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES, ...LOG_TYPES]
const SAFE_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.mp4',
  '.webm',
  '.ogg',
  '.txt',
  '.log',
  '.json',
])

const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'video/webm': [[0x1a, 0x45, 0xdf, 0xa3]],
  'video/ogg': [[0x4f, 0x67, 0x67, 0x53]],
}

@Injectable()
export class BugAttachmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly logger: LoggerService,
    private readonly access: BugAccessService,
  ) {}

  async upload(file: Express.Multer.File, dto: UploadBugAttachmentDto, user: RequestUserLike) {
    if (!file) throw BusinessException.invalidParams('请选择要上传的文件')
    this.validateFile(file)
    const attachmentType = this.resolveAttachmentType(file.mimetype, dto.attachmentType)
    const filename = this.generateFilename(attachmentType, file.originalname)
    const result = await this.storage.upload(file.buffer, filename, file.mimetype, 'bug')
    const attachment = await this.prisma.bugAttachment.create({
      data: {
        ticketId: dto.ticketId ? BigInt(dto.ticketId) : undefined,
        uploaderId: BigInt(user.userId),
        fileName: result.filename,
        originalName: file.originalname,
        fileUrl: result.url,
        fileType: file.mimetype,
        fileSize: BigInt(file.size),
        attachmentType,
        originalAttachmentId: dto.originalAttachmentId
          ? BigInt(dto.originalAttachmentId)
          : undefined,
        annotationData: dto.annotationData,
      },
    })
    if (attachment.ticketId) {
      await this.addHistory(
        attachment.ticketId,
        BigInt(user.userId),
        '上传附件',
        attachment.originalName,
      )
    }
    this.logger.log(`上传 Bug 附件: ${result.filename}`, 'BugAttachmentService')
    return attachment
  }

  async remove(attachmentId: string, user: RequestUserLike) {
    const attachment = await this.prisma.bugAttachment.findFirst({
      where: { attachmentId: BigInt(attachmentId), delFlag: '0' },
    })
    if (!attachment) throw BusinessException.notFound('附件不存在')
    await this.access.assertCanRemoveAttachment(user.userId, attachment)
    await this.prisma.bugAttachment.update({
      where: { attachmentId: BigInt(attachmentId) },
      data: { delFlag: '2' },
    })
    if (attachment.ticketId) {
      await this.addHistory(
        attachment.ticketId,
        BigInt(user.userId),
        '删除附件',
        attachment.originalName,
      )
    }
    return {}
  }

  private async addHistory(
    ticketId: bigint,
    operatorId: bigint,
    actionName: string,
    fileName: string,
  ) {
    await this.prisma.bugHistory.create({
      data: {
        ticketId,
        operatorId,
        action: BUG_ACTION.ATTACHMENT,
        remark: `${actionName}: ${fileName}`,
      },
    })
  }

  private validateFile(file: Express.Multer.File) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BusinessException(ErrorCode.BUG_ATTACHMENT_TYPE_DENIED, '不支持的附件类型')
    }
    const maxSize = this.maxSize(file.mimetype)
    if (file.size > maxSize) {
      throw new BusinessException(
        ErrorCode.BUG_ATTACHMENT_SIZE_EXCEEDED,
        `附件大小不能超过 ${Math.floor(maxSize / 1024 / 1024)}MB`,
      )
    }
    if (
      (IMAGE_TYPES.includes(file.mimetype) || VIDEO_TYPES.includes(file.mimetype)) &&
      !this.validateMagic(file)
    ) {
      throw new BusinessException(ErrorCode.BUG_ATTACHMENT_INVALID_CONTENT, '文件内容与类型不匹配')
    }
  }

  private maxSize(mimetype: string) {
    if (IMAGE_TYPES.includes(mimetype)) return 10 * 1024 * 1024
    if (VIDEO_TYPES.includes(mimetype)) return 100 * 1024 * 1024
    return 20 * 1024 * 1024
  }

  private validateMagic(file: Express.Multer.File) {
    if (file.mimetype === 'video/mp4') {
      return file.buffer.subarray(0, 32).toString('ascii').includes('ftyp')
    }
    const signatures = FILE_SIGNATURES[file.mimetype]
    if (!signatures) return false
    const header = Array.from(file.buffer.subarray(0, 16))
    return signatures.some((signature) => signature.every((byte, index) => header[index] === byte))
  }

  private resolveAttachmentType(mimetype: string, type?: string): string {
    if (type === BUG_ATTACHMENT_TYPE.ANNOTATED_IMAGE) return type
    if (IMAGE_TYPES.includes(mimetype)) return BUG_ATTACHMENT_TYPE.IMAGE
    if (VIDEO_TYPES.includes(mimetype)) return BUG_ATTACHMENT_TYPE.VIDEO
    if (LOG_TYPES.includes(mimetype)) return BUG_ATTACHMENT_TYPE.LOG
    return BUG_ATTACHMENT_TYPE.FILE
  }

  private generateFilename(type: string, original: string): string {
    const safeOriginal = original.replace(/[\\/\0]/g, '')
    const rawExt = safeOriginal.includes('.')
      ? safeOriginal.slice(safeOriginal.lastIndexOf('.')).toLowerCase()
      : ''
    const ext = SAFE_EXTS.has(rawExt) ? rawExt : '.dat'
    return `${type}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
  }
}

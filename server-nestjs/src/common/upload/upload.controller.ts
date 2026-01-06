import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { extname } from 'path'
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { StorageService } from './storage.service'

// 文件魔数签名（用于校验真实文件类型）
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'image/x-icon': [
    [0x00, 0x00, 0x01, 0x00],
    [0x00, 0x00, 0x02, 0x00],
  ],
}

/**
 * 校验文件魔数
 */
function validateFileMagic(buffer: Buffer, allowedTypes: string[]): boolean {
  const header = Array.from(buffer.subarray(0, 16))

  for (const type of allowedTypes) {
    const signatures = FILE_SIGNATURES[type]
    if (!signatures) continue

    for (const sig of signatures) {
      const match = sig.every((byte, i) => header[i] === byte)
      if (match) return true
    }
  }

  // SVG 检查
  if (allowedTypes.includes('image/svg+xml')) {
    const content = buffer.toString('utf8', 0, 1000).trim()
    if (content.startsWith('<?xml') || content.startsWith('<svg') || content.includes('<svg')) {
      return true
    }
  }

  return false
}

/**
 * 清理 SVG 文件中的潜在恶意内容
 */
function sanitizeSvgBuffer(buffer: Buffer): Buffer {
  let content = buffer.toString('utf8')
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '')
  content = content.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  content = content.replace(/javascript:/gi, '')
  content = content.replace(/data:[^"'\s]*/gi, '')
  return Buffer.from(content, 'utf8')
}

/**
 * 清理文件名，防止路径遍历攻击
 */
function sanitizeFilename(filename: string): string {
  const ext = extname(filename).toLowerCase()
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico']
  if (!allowedExts.includes(ext)) {
    return '.png'
  }
  return ext
}

/**
 * 生成唯一文件名
 */
function generateFilename(prefix: string, originalname: string): string {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
  const ext = sanitizeFilename(originalname)
  return `${prefix}-${uniqueSuffix}${ext}`
}

@ApiTags('文件上传')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * 上传头像
   */
  @Post('avatar')
  @ApiOperation({ summary: '上传用户头像' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedMimes.includes(file.mimetype)) {
          cb(new BadRequestException('只支持图片格式 (jpg, png, gif, webp)'), false)
        } else {
          cb(null, true)
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件')
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validateFileMagic(file.buffer, allowedTypes)) {
      throw new BadRequestException('文件类型不合法，请上传真实的图片文件')
    }

    const filename = generateFilename('avatar', file.originalname)
    const result = await this.storageService.upload(file.buffer, filename, file.mimetype, 'avatars')

    return {
      url: result.url,
      filename: result.filename,
      size: result.size,
      mimetype: file.mimetype,
    }
  }

  /**
   * 上传系统文件（Logo/Favicon等）
   */
  @Post('system')
  @ApiOperation({ summary: '上传系统文件（Logo/Favicon）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'image/x-icon',
          'image/vnd.microsoft.icon',
        ]
        if (!allowedMimes.includes(file.mimetype)) {
          cb(new BadRequestException('只支持图片格式 (jpg, png, gif, webp, svg, ico)'), false)
        } else {
          cb(null, true)
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadSystem(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件')
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/x-icon',
    ]
    if (!validateFileMagic(file.buffer, allowedTypes)) {
      throw new BadRequestException('文件类型不合法，请上传真实的图片文件')
    }

    let buffer = file.buffer
    // SVG 安全处理
    if (file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg')) {
      buffer = sanitizeSvgBuffer(buffer)
    }

    const filename = generateFilename('sys', file.originalname)
    const result = await this.storageService.upload(buffer, filename, file.mimetype, 'system')

    return {
      url: result.url,
      filename: result.filename,
      size: result.size,
      mimetype: file.mimetype,
    }
  }
}

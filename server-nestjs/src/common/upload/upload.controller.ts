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
import { ConfigService } from '../../system/config/config.service'

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
  const allowedExts = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.ico',
    '.mp4',
    '.webm',
    '.ogg',
  ]
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

// 视频文件魔数签名
const VIDEO_SIGNATURES: Record<string, number[][]> = {
  'video/mp4': [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp
    [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70],
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
  ],
  'video/webm': [[0x1a, 0x45, 0xdf, 0xa3]],
  'video/ogg': [[0x4f, 0x67, 0x67, 0x53]],
}

/**
 * 校验视频文件魔数
 */
function validateVideoMagic(buffer: Buffer, allowedTypes: string[]): boolean {
  const header = Array.from(buffer.subarray(0, 32))

  for (const type of allowedTypes) {
    const signatures = VIDEO_SIGNATURES[type]
    if (!signatures) continue

    for (const sig of signatures) {
      const match = sig.every((byte, i) => header[i] === byte)
      if (match) return true
    }
  }

  // MP4 特殊检查：ftyp 可能在不同偏移位置
  if (allowedTypes.includes('video/mp4')) {
    const content = buffer.toString('ascii', 0, 32)
    if (content.includes('ftyp')) return true
  }

  return false
}

@ApiTags('文件上传')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

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
      limits: { fileSize: 20 * 1024 * 1024 }, // 最大 20MB，实际限制从配置读取
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件')
    }

    // 从配置读取文件大小限制
    const uploadConfig = await this.configService.getUploadConfig()
    const maxSize = uploadConfig.avatarMaxSize * 1024 * 1024
    if (file.size > maxSize) {
      throw new BadRequestException(`头像大小不能超过 ${uploadConfig.avatarMaxSize}MB`)
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
      limits: { fileSize: 20 * 1024 * 1024 }, // 最大 20MB，实际限制从配置读取
    }),
  )
  async uploadSystem(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件')
    }

    // 从配置读取文件大小限制
    const uploadConfig = await this.configService.getUploadConfig()
    const maxSize = uploadConfig.systemMaxSize * 1024 * 1024
    if (file.size > maxSize) {
      throw new BadRequestException(`系统文件大小不能超过 ${uploadConfig.systemMaxSize}MB`)
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

  /**
   * 上传富文本编辑器图片
   */
  @Post('editor/image')
  @ApiOperation({ summary: '上传富文本编辑器图片' })
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
      limits: { fileSize: 100 * 1024 * 1024 }, // 最大 100MB，实际限制从配置读取
    }),
  )
  async uploadEditorImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件')
    }

    // 从配置读取文件大小限制
    const uploadConfig = await this.configService.getUploadConfig()
    const maxSize = uploadConfig.editorImageMaxSize * 1024 * 1024
    if (file.size > maxSize) {
      throw new BadRequestException(`图片大小不能超过 ${uploadConfig.editorImageMaxSize}MB`)
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validateFileMagic(file.buffer, allowedTypes)) {
      throw new BadRequestException('文件类型不合法，请上传真实的图片文件')
    }

    const filename = generateFilename('editor', file.originalname)
    const result = await this.storageService.upload(file.buffer, filename, file.mimetype, 'editor')

    return {
      url: result.url,
      filename: result.filename,
      size: result.size,
      mimetype: file.mimetype,
    }
  }

  /**
   * 上传富文本编辑器视频
   */
  @Post('editor/video')
  @ApiOperation({ summary: '上传富文本编辑器视频' })
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
        const allowedMimes = ['video/mp4', 'video/webm', 'video/ogg']
        if (!allowedMimes.includes(file.mimetype)) {
          cb(new BadRequestException('只支持视频格式 (mp4, webm, ogg)'), false)
        } else {
          cb(null, true)
        }
      },
      limits: { fileSize: 500 * 1024 * 1024 }, // 最大 500MB，实际限制从配置读取
    }),
  )
  async uploadEditorVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件')
    }

    // 从配置读取文件大小限制
    const uploadConfig = await this.configService.getUploadConfig()
    const maxSize = uploadConfig.editorVideoMaxSize * 1024 * 1024
    if (file.size > maxSize) {
      throw new BadRequestException(`视频大小不能超过 ${uploadConfig.editorVideoMaxSize}MB`)
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
    if (!validateVideoMagic(file.buffer, allowedTypes)) {
      throw new BadRequestException('文件类型不合法，请上传真实的视频文件')
    }

    const filename = generateFilename('video', file.originalname)
    const result = await this.storageService.upload(file.buffer, filename, file.mimetype, 'editor')

    return {
      url: result.url,
      filename: result.filename,
      size: result.size,
      mimetype: file.mimetype,
    }
  }
}

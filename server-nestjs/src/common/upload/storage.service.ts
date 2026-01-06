import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../logger/logger.service'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs'

export type StorageType = 'local' | 's3' | 'gcs' | 'oss' | 'cos' | 'r2'

export interface StorageConfig {
  type: StorageType
  localPath: string
  endpoint: string
  bucket: string
  accessKey: string
  secretKey: string
  region?: string
  customDomain?: string
}

export interface UploadResult {
  url: string
  filename: string
  size: number
}

@Injectable()
export class StorageService {
  private s3Client: S3Client | null = null
  private cachedConfig: StorageConfig | null = null

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * 从数据库获取存储配置
   */
  async getStorageConfig(): Promise<StorageConfig> {
    const configs = await this.prisma.sysConfig.findMany({
      where: {
        configKey: { startsWith: 'sys.storage.' },
      },
    })

    const configMap: Record<string, string> = {}
    configs.forEach((c) => {
      if (c.configKey) {
        configMap[c.configKey] = c.configValue ?? ''
      }
    })

    return {
      type: (configMap['sys.storage.type'] as StorageType) || 'local',
      localPath: configMap['sys.storage.local.path'] || './uploads',
      endpoint: configMap['sys.storage.oss.endpoint'] || '',
      bucket: configMap['sys.storage.oss.bucket'] || '',
      accessKey: configMap['sys.storage.oss.accessKey'] || '',
      secretKey: configMap['sys.storage.oss.secretKey'] || '',
    }
  }

  /**
   * 获取 S3 客户端（兼容 OSS/COS/R2）
   */
  private async getS3Client(): Promise<S3Client> {
    const config = await this.getStorageConfig()

    // 配置变化时重新创建客户端
    if (
      this.s3Client &&
      this.cachedConfig?.endpoint === config.endpoint &&
      this.cachedConfig?.accessKey === config.accessKey
    ) {
      return this.s3Client
    }

    let endpoint = config.endpoint
    let region = 'auto'

    // 根据存储类型调整配置
    if (config.type === 's3') {
      // AWS S3
      if (!endpoint.startsWith('http')) {
        endpoint = `https://${endpoint}`
      }
      // 从 endpoint 提取 region，如 s3.us-east-1.amazonaws.com
      const match = endpoint.match(/s3\.([a-z0-9-]+)\.amazonaws/)
      if (match) {
        region = match[1]
      }
    } else if (config.type === 'gcs') {
      // Google Cloud Storage
      if (!endpoint.startsWith('http')) {
        endpoint = `https://${endpoint}`
      }
      region = 'auto'
    } else if (config.type === 'oss') {
      // 阿里云 OSS
      if (!endpoint.startsWith('http')) {
        endpoint = `https://${endpoint}`
      }
      // 从 endpoint 提取 region，如 oss-cn-hangzhou
      const match = endpoint.match(/oss-([a-z0-9-]+)\./)
      if (match) {
        region = match[1]
      }
    } else if (config.type === 'cos') {
      // 腾讯云 COS
      if (!endpoint.startsWith('http')) {
        endpoint = `https://${endpoint}`
      }
      // 从 endpoint 提取 region，如 ap-guangzhou
      const match = endpoint.match(/cos\.([a-z0-9-]+)\./)
      if (match) {
        region = match[1]
      }
    } else if (config.type === 'r2') {
      // Cloudflare R2
      if (!endpoint.startsWith('http')) {
        endpoint = `https://${endpoint}`
      }
      region = 'auto'
    }

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: config.type === 'r2', // R2 需要 path style
    })

    this.cachedConfig = config
    return this.s3Client
  }

  /**
   * 上传文件
   */
  async upload(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder: string = 'files',
  ): Promise<UploadResult> {
    const config = await this.getStorageConfig()

    if (config.type === 'local') {
      return this.uploadLocal(buffer, filename, folder, config)
    } else {
      return this.uploadToCloud(buffer, filename, mimetype, folder, config)
    }
  }

  /**
   * 本地存储上传
   */
  private uploadLocal(
    buffer: Buffer,
    filename: string,
    folder: string,
    config: StorageConfig,
  ): UploadResult {
    const basePath = config.localPath.startsWith('.')
      ? join(process.cwd(), config.localPath)
      : config.localPath

    const uploadPath = join(basePath, folder)
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true })
    }

    const filePath = join(uploadPath, filename)
    writeFileSync(filePath, buffer)

    this.logger.log(`本地存储上传成功: ${filePath}`, 'StorageService')

    return {
      url: `/uploads/${folder}/${filename}`,
      filename,
      size: buffer.length,
    }
  }

  /**
   * 云存储上传（OSS/COS/R2）
   */
  private async uploadToCloud(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder: string,
    config: StorageConfig,
  ): Promise<UploadResult> {
    const client = await this.getS3Client()
    const key = `${folder}/${filename}`

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    )

    // 构建访问 URL
    let url: string
    if (config.type === 's3') {
      // AWS S3 URL 格式
      url = `https://${config.bucket}.${config.endpoint.replace('https://', '')}/${key}`
    } else if (config.type === 'gcs') {
      // Google Cloud Storage URL 格式
      url = `https://storage.googleapis.com/${config.bucket}/${key}`
    } else if (config.type === 'oss') {
      // 阿里云 OSS URL 格式
      url = `https://${config.bucket}.${config.endpoint.replace('https://', '')}/${key}`
    } else if (config.type === 'cos') {
      // 腾讯云 COS URL 格式
      const endpoint = config.endpoint.replace('https://', '')
      url = `https://${config.bucket}.${endpoint}/${key}`
    } else if (config.type === 'r2') {
      // R2 需要配置自定义域名或使用 Workers
      url = config.customDomain
        ? `${config.customDomain}/${key}`
        : `https://${config.bucket}.${config.endpoint.replace('https://', '')}/${key}`
    } else {
      url = `https://${config.bucket}.${config.endpoint}/${key}`
    }

    this.logger.log(`云存储上传成功: ${config.type} - ${key}`, 'StorageService')

    return {
      url,
      filename,
      size: buffer.length,
    }
  }

  /**
   * 删除文件
   */
  async delete(fileUrl: string): Promise<void> {
    const config = await this.getStorageConfig()

    if (config.type === 'local') {
      this.deleteLocal(fileUrl, config)
    } else {
      await this.deleteFromCloud(fileUrl, config)
    }
  }

  /**
   * 本地删除
   */
  private deleteLocal(fileUrl: string, config: StorageConfig): void {
    const basePath = config.localPath.startsWith('.')
      ? join(process.cwd(), config.localPath)
      : config.localPath

    // 从 URL 提取相对路径
    const relativePath = fileUrl.replace('/uploads/', '')
    const filePath = join(basePath, relativePath)

    if (existsSync(filePath)) {
      unlinkSync(filePath)
      this.logger.log(`本地文件删除成功: ${filePath}`, 'StorageService')
    }
  }

  /**
   * 云存储删除
   */
  private async deleteFromCloud(fileUrl: string, config: StorageConfig): Promise<void> {
    const client = await this.getS3Client()

    // 从 URL 提取 key
    const urlObj = new URL(fileUrl)
    const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname

    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    )

    this.logger.log(`云存储文件删除成功: ${config.type} - ${key}`, 'StorageService')
  }
}

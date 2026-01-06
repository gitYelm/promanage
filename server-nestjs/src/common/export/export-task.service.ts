import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateExportTaskDto, ExportFormat, ExportScope } from './dto/create-export-task.dto'
import { QueryExportTaskDto } from './dto/query-export-task.dto'
import { ExcelColumn } from '../excel/excel.service'
import * as ExcelJS from 'exceljs'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'

export interface ExportDataProvider {
  /** 获取总数 */
  getTotal(query: Record<string, any>): Promise<number>
  /** 分批获取数据 */
  getData(query: Record<string, any>, skip: number, take: number): Promise<Record<string, any>[]>
  /** 获取默认列配置 */
  getDefaultColumns(): ExcelColumn[]
  /** 模块显示名称 */
  getModuleName(): string
}

@Injectable()
export class ExportTaskService implements OnModuleInit {
  private readonly logger = new Logger(ExportTaskService.name)
  private readonly exportDir = path.join(process.cwd(), 'exports')
  private readonly providers = new Map<string, ExportDataProvider>()
  private readonly BATCH_SIZE = 1000 // 每批处理数量
  private readonly DEFAULT_FILE_EXPIRE_HOURS = 2 // 默认文件过期时间（小时）

  constructor(private prisma: PrismaService) {
    // 确保导出目录存在
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true })
    }
  }

  /** 启动时清理一次过期任务 */
  async onModuleInit() {
    await this.cleanExpiredTasks()
  }

  /** 注册数据提供者 */
  registerProvider(module: string, provider: ExportDataProvider) {
    this.providers.set(module, provider)
  }

  /** 获取文件过期时间（小时） */
  async getFileExpireHours(): Promise<number> {
    const config = await this.prisma.sysConfig.findFirst({
      where: { configKey: 'sys.export.fileExpireHours' },
    })
    return config?.configValue ? Number(config.configValue) : this.DEFAULT_FILE_EXPIRE_HOURS
  }

  /** 创建导出任务 */
  async createTask(dto: CreateExportTaskDto, username: string) {
    const provider = this.providers.get(dto.module)
    if (!provider) {
      throw new NotFoundException(`未找到模块 ${dto.module} 的导出配置`)
    }

    const taskId = randomUUID()
    const taskName =
      dto.taskName || `${provider.getModuleName()}导出_${new Date().toLocaleString('zh-CN')}`
    const fileExpireHours = await this.getFileExpireHours()
    const expireTime = new Date(Date.now() + fileExpireHours * 60 * 60 * 1000)

    // 创建任务记录
    await this.prisma.sysExportTask.create({
      data: {
        taskId,
        taskName,
        module: dto.module,
        format: dto.format,
        status: 'pending',
        queryParams: JSON.stringify(dto.queryParams || {}),
        columns: dto.columns ? JSON.stringify(dto.columns) : null,
        createBy: username,
        expireTime,
      },
    })

    // 异步执行导出
    this.executeExport(taskId, dto, provider).catch((err) => {
      this.logger.error(`导出任务 ${taskId} 执行失败: ${err.message}`)
    })

    return { taskId, taskName }
  }

  /** 执行导出任务 */
  private async executeExport(
    taskId: string,
    dto: CreateExportTaskDto,
    provider: ExportDataProvider,
  ) {
    try {
      // 更新状态为处理中
      await this.updateTaskStatus(taskId, 'processing')

      const query = dto.queryParams || {}

      // 如果是选中导出，添加ID过滤
      if (dto.scope === ExportScope.SELECTED && dto.selectedIds?.length) {
        query.selectedIds = dto.selectedIds
      }

      // 获取总数
      const total = await provider.getTotal(query)
      await this.prisma.sysExportTask.update({
        where: { taskId },
        data: { totalRows: total },
      })

      if (total === 0) {
        await this.prisma.sysExportTask.update({
          where: { taskId },
          data: {
            status: 'failed',
            totalRows: 0,
            processedRows: 0,
            progress: 100,
            errorMsg: '没有符合条件的数据可导出',
            finishTime: new Date(),
          },
        })
        return
      }

      // 获取列配置
      const columns = dto.columns?.length ? dto.columns : provider.getDefaultColumns()

      // 生成友好的文件名: 模块名_日期时间.格式
      const now = new Date()
      const dateStr = now
        .toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        .replace(/\//g, '')
        .replace(/:/g, '')
        .replace(/ /g, '_')
      const moduleName = provider.getModuleName()
      const filename = `${moduleName}_${dateStr}.${dto.format}`
      const filePath = path.join(this.exportDir, filename)

      if (dto.format === ExportFormat.XLSX) {
        await this.exportToExcel(taskId, query, columns, filePath, total, provider)
      } else if (dto.format === ExportFormat.CSV) {
        await this.exportToCsv(taskId, query, columns, filePath, total, provider)
      } else if (dto.format === ExportFormat.JSON) {
        await this.exportToJson(taskId, query, columns, filePath, total, provider)
      }

      // 获取文件大小
      const stats = fs.statSync(filePath)

      // 更新任务完成
      await this.prisma.sysExportTask.update({
        where: { taskId },
        data: {
          status: 'completed',
          progress: 100,
          processedRows: total,
          filePath: filename,
          fileSize: BigInt(stats.size),
          finishTime: new Date(),
        },
      })

      this.logger.log(`导出任务 ${taskId} 完成`)
    } catch (error) {
      this.logger.error(`导出任务 ${taskId} 失败: ${error.message}`)
      await this.prisma.sysExportTask.update({
        where: { taskId },
        data: {
          status: 'failed',
          errorMsg: error.message?.substring(0, 500),
          finishTime: new Date(),
        },
      })
    }
  }

  /** 导出为 Excel (流式) */
  private async exportToExcel(
    taskId: string,
    query: Record<string, any>,
    columns: ExcelColumn[],
    filePath: string,
    total: number,
    provider: ExportDataProvider,
  ) {
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: filePath,
      useStyles: true,
    })

    const worksheet = workbook.addWorksheet('数据')

    // 设置列
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }))

    // 设置表头样式
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 25
    headerRow.commit()

    // 分批处理数据
    let processed = 0
    while (processed < total) {
      const data = await provider.getData(query, processed, this.BATCH_SIZE)

      for (const row of data) {
        const dataRow = worksheet.addRow(row)
        // 斑马纹
        if ((processed + data.indexOf(row) + 2) % 2 === 0) {
          dataRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' },
          }
        }
        dataRow.commit()
      }

      processed += data.length
      const progress = Math.floor((processed / total) * 100)
      await this.updateProgress(taskId, progress, processed)
    }

    await workbook.commit()
  }

  /** 导出为 CSV (流式) */
  private async exportToCsv(
    taskId: string,
    query: Record<string, any>,
    columns: ExcelColumn[],
    filePath: string,
    total: number,
    provider: ExportDataProvider,
  ) {
    const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' })

    // 写入 BOM (Excel 兼容)
    writeStream.write('\uFEFF')

    // 写入表头
    const headers = columns.map((c) => `"${c.header}"`).join(',')
    writeStream.write(headers + '\n')

    // 分批处理数据
    let processed = 0
    while (processed < total) {
      const data = await provider.getData(query, processed, this.BATCH_SIZE)

      for (const row of data) {
        const line = columns
          .map((col) => {
            const val = row[col.key]
            if (val === null || val === undefined) return ''
            const str = String(val).replace(/"/g, '""')
            return `"${str}"`
          })
          .join(',')
        writeStream.write(line + '\n')
      }

      processed += data.length
      const progress = Math.floor((processed / total) * 100)
      await this.updateProgress(taskId, progress, processed)
    }

    return new Promise<void>((resolve, reject) => {
      writeStream.end((err: Error | null) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /** 导出为 JSON */
  private async exportToJson(
    taskId: string,
    query: Record<string, any>,
    columns: ExcelColumn[],
    filePath: string,
    total: number,
    provider: ExportDataProvider,
  ) {
    const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' })
    writeStream.write('[\n')

    let processed = 0
    let isFirst = true

    while (processed < total) {
      const data = await provider.getData(query, processed, this.BATCH_SIZE)

      for (const row of data) {
        // 只保留选中的列
        const filteredRow: Record<string, any> = {}
        for (const col of columns) {
          filteredRow[col.key] = row[col.key]
        }

        if (!isFirst) writeStream.write(',\n')
        writeStream.write('  ' + JSON.stringify(filteredRow))
        isFirst = false
      }

      processed += data.length
      const progress = Math.floor((processed / total) * 100)
      await this.updateProgress(taskId, progress, processed)
    }

    writeStream.write('\n]')

    return new Promise<void>((resolve, reject) => {
      writeStream.end((err: Error | null) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /** 更新任务进度 */
  private async updateProgress(taskId: string, progress: number, processedRows: number) {
    await this.prisma.sysExportTask.update({
      where: { taskId },
      data: { progress, processedRows },
    })
  }

  /** 更新任务状态 */
  private async updateTaskStatus(taskId: string, status: string, extra?: Record<string, any>) {
    await this.prisma.sysExportTask.update({
      where: { taskId },
      data: { status, ...extra },
    })
  }

  /** 查询任务列表 */
  async findAll(query: QueryExportTaskDto, username: string) {
    const { pageNum = 1, pageSize = 10, module, status } = query
    const skip = (pageNum - 1) * pageSize

    const where: any = { createBy: username }
    if (module) where.module = module
    if (status) where.status = status

    const [rows, total] = await Promise.all([
      this.prisma.sysExportTask.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createTime: 'desc' },
      }),
      this.prisma.sysExportTask.count({ where }),
    ])

    return {
      rows: rows.map((r) => ({
        ...r,
        fileSize: r.fileSize ? Number(r.fileSize) : null,
      })),
      total,
    }
  }

  /** 获取任务详情 */
  async findOne(taskId: string) {
    const task = await this.prisma.sysExportTask.findUnique({
      where: { taskId },
    })
    if (!task) throw new NotFoundException('任务不存在')
    return {
      ...task,
      fileSize: task.fileSize ? Number(task.fileSize) : null,
    }
  }

  /** 获取下载文件路径 */
  async getDownloadPath(taskId: string, username: string) {
    const task = await this.prisma.sysExportTask.findUnique({
      where: { taskId },
    })

    if (!task) throw new NotFoundException('任务不存在')
    if (task.createBy !== username) throw new NotFoundException('无权访问')
    if (task.status !== 'completed') {
      throw new NotFoundException(`任务未完成 (当前状态: ${task.status})`)
    }
    if (!task.filePath) throw new NotFoundException('文件不存在')

    const fullPath = path.join(this.exportDir, task.filePath)
    if (!fs.existsSync(fullPath)) throw new NotFoundException('文件已过期')

    return { filePath: fullPath, filename: task.filePath }
  }

  /** 删除任务 */
  async remove(taskId: string, username: string) {
    const task = await this.prisma.sysExportTask.findUnique({
      where: { taskId },
    })

    if (!task) throw new NotFoundException('任务不存在')
    if (task.createBy !== username) throw new NotFoundException('无权删除')

    // 删除文件
    if (task.filePath) {
      const fullPath = path.join(this.exportDir, task.filePath)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    }

    await this.prisma.sysExportTask.delete({ where: { taskId } })
  }

  /** 清理过期任务 */
  async cleanExpiredTasks() {
    const expiredTasks = await this.prisma.sysExportTask.findMany({
      where: {
        expireTime: { lt: new Date() },
      },
    })

    for (const task of expiredTasks) {
      if (task.filePath) {
        const fullPath = path.join(this.exportDir, task.filePath)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }
      }
    }

    await this.prisma.sysExportTask.deleteMany({
      where: {
        expireTime: { lt: new Date() },
      },
    })

    this.logger.log(`清理了 ${expiredTasks.length} 个过期导出任务`)
  }

  /** 获取模块的可导出列 */
  getModuleColumns(module: string) {
    const provider = this.providers.get(module)
    if (!provider) throw new NotFoundException(`未找到模块 ${module} 的导出配置`)
    return provider.getDefaultColumns()
  }
}

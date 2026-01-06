import { Injectable } from '@nestjs/common'
import * as ExcelJS from 'exceljs'
import { Response } from 'express'

export interface ExcelColumn {
  header: string
  key: string
  width?: number
}

@Injectable()
export class ExcelService {
  /**
   * 导出 Excel 文件
   */
  async exportExcel(
    res: Response,
    data: Record<string, any>[],
    columns: ExcelColumn[],
    filename: string,
    sheetName = 'Sheet1',
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'RBAC Admin Pro'
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet(sheetName)

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

    // 添加数据
    data.forEach((row) => {
      worksheet.addRow(row)
    })

    // 设置数据行样式
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle' }
        // 斑马纹
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3F4F6' },
          }
        }
      }
      // 边框
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        }
      })
    })

    // 设置响应头
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${encodeURIComponent(filename)}.xlsx`,
    )

    await workbook.xlsx.write(res)
    res.end()
  }

  /**
   * 解析 Excel 文件
   */
  async parseExcel<T>(
    buffer: Buffer,
    columnMap: Record<string, string>, // Excel列名 -> 字段名
  ): Promise<T[]> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) {
      throw new Error('Excel 文件为空')
    }

    const result: T[] = []
    const headers: string[] = []

    // 读取表头
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell, colNumber) => {
      const val = cell.value
      headers[colNumber] = typeof val === 'string' ? val.trim() : val != null ? String(val) : ''
    })

    // 读取数据行
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // 跳过表头

      const rowData: Record<string, any> = {}
      let hasData = false

      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber]
        const fieldName = columnMap[header]
        if (fieldName) {
          let value = cell.value
          // 处理富文本
          if (value && typeof value === 'object' && 'richText' in value) {
            value = value.richText.map((rt) => rt.text).join('')
          }
          rowData[fieldName] = value
          if (value !== null && value !== undefined && value !== '') {
            hasData = true
          }
        }
      })

      if (hasData) {
        result.push(rowData as T)
      }
    })

    return result
  }

  /**
   * 生成导入模板
   */
  async generateTemplate(
    res: Response,
    columns: ExcelColumn[],
    filename: string,
    sheetName = 'Sheet1',
    exampleData?: Record<string, any>[],
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName)

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }))

    // 表头样式
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 25

    // 添加示例数据
    if (exampleData && exampleData.length > 0) {
      exampleData.forEach((row) => {
        const dataRow = worksheet.addRow(row)
        dataRow.font = { color: { argb: 'FF9CA3AF' } } // 灰色示例
      })
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${encodeURIComponent(filename)}.xlsx`,
    )

    await workbook.xlsx.write(res)
    res.end()
  }
}

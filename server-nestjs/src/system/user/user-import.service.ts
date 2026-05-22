import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../prisma/prisma.service'
import { LoggerService } from '../../common/logger/logger.service'
import { ConfigService } from '../config/config.service'

interface ImportUserRow {
  userName: string
  nickName: string
  deptName?: string
  phonenumber?: string
  email?: string
  sex?: string
  status?: string
}

@Injectable()
export class UserImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  async importUsers(
    users: ImportUserRow[],
    updateSupport: boolean,
  ): Promise<{ success: number; fail: number; errors: string[] }> {
    this.logger.log(`批量导入用户: ${users.length} 条`, 'UserImportService')

    let success = 0
    let fail = 0
    const errors: string[] = []
    const deptMap = await this.loadDeptMap()
    const hashedPassword = await this.initialPasswordHash()

    for (let i = 0; i < users.length; i++) {
      const result = await this.importOne(users[i], i + 2, updateSupport, deptMap, hashedPassword)
      if (result.ok) success++
      else {
        fail++
        errors.push(result.error)
      }
    }

    this.logger.log(`导入完成: 成功${success}条, 失败${fail}条`, 'UserImportService')
    return { success, fail, errors }
  }

  private async loadDeptMap() {
    const depts = await this.prisma.sysDept.findMany({
      where: { delFlag: '0' },
      select: { deptId: true, deptName: true },
    })
    return new Map(depts.map((dept) => [dept.deptName, dept.deptId]))
  }

  private async initialPasswordHash() {
    const initPassword = await this.configService.getInitPassword()
    const salt = await bcrypt.genSalt()
    return bcrypt.hash(initPassword, salt)
  }

  private async importOne(
    row: ImportUserRow,
    rowNum: number,
    updateSupport: boolean,
    deptMap: Map<string, bigint>,
    hashedPassword: string,
  ) {
    try {
      if (!row.userName || !row.nickName)
        return { ok: false, error: `第${rowNum}行: 用户名和昵称不能为空` }
      const deptId = this.resolveDeptId(row, rowNum, deptMap)
      if (deptId instanceof Error) return { ok: false, error: deptId.message }
      const existUser = await this.prisma.sysUser.findFirst({
        where: { userName: row.userName, delFlag: '0' },
      })
      if (existUser && !updateSupport) {
        return { ok: false, error: `第${rowNum}行: 用户"${row.userName}"已存在` }
      }

      const userData = this.toUserData(row, deptId)
      if (existUser) {
        await this.prisma.sysUser.update({
          where: { userId: existUser.userId },
          data: { ...userData, updateTime: new Date() },
        })
      } else {
        await this.prisma.sysUser.create({
          data: {
            userName: row.userName,
            ...userData,
            password: hashedPassword,
            createTime: new Date(),
          },
        })
      }
      return { ok: true, error: '' }
    } catch (e) {
      return { ok: false, error: `第${rowNum}行: ${(e as Error).message}` }
    }
  }

  private resolveDeptId(row: ImportUserRow, rowNum: number, deptMap: Map<string, bigint>) {
    if (!row.deptName) return null
    const deptId = deptMap.get(row.deptName)
    return deptId ?? new Error(`第${rowNum}行: 部门"${row.deptName}"不存在`)
  }

  private toUserData(row: ImportUserRow, deptId: bigint | null) {
    return {
      nickName: row.nickName,
      deptId,
      phonenumber: row.phonenumber || null,
      email: row.email || null,
      sex: row.sex === '男' ? '0' : row.sex === '女' ? '1' : '2',
      status: row.status === '停用' ? '1' : '0',
    }
  }
}

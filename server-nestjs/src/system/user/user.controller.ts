import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { PermissionGuard } from '../../common/guards/permission.guard'
import { RequirePermission } from '../../common/decorators/permission.decorator'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { QueryUserDto } from './dto/query-user.dto'
import { Log, BusinessType } from '../../common/decorators/log.decorator'
import { ExcelService } from '../../common/excel/excel.service'
import { SystemRoleSecurityService } from '../security/system-role-security.service'
import { UserInfoService } from './user-info.service'
import { UserImportService } from './user-import.service'

// 用户导出列配置
const USER_EXPORT_COLUMNS = [
  { header: '用户编号', key: 'userId', width: 12 },
  { header: '用户名', key: 'userName', width: 15 },
  { header: '用户昵称', key: 'nickName', width: 15 },
  { header: '部门', key: 'deptName', width: 20 },
  { header: '手机号码', key: 'phonenumber', width: 15 },
  { header: '邮箱', key: 'email', width: 25 },
  { header: '性别', key: 'sex', width: 8 },
  { header: '状态', key: 'status', width: 8 },
  { header: '创建时间', key: 'createTime', width: 20 },
]

// 用户导入列映射（Excel列名 -> 字段名）
const USER_IMPORT_COLUMN_MAP: Record<string, string> = {
  用户名: 'userName',
  用户昵称: 'nickName',
  部门: 'deptName',
  手机号码: 'phonenumber',
  邮箱: 'email',
  性别: 'sex',
  状态: 'status',
}

type RequestWithUser = { user: { userId: string; username: string } }

@ApiTags('用户管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('system/user')
export class UserController {
  constructor(
    private userService: UserService,
    private userInfoService: UserInfoService,
    private userImportService: UserImportService,
    private excelService: ExcelService,
    private roleSecurity: SystemRoleSecurityService,
  ) {}

  @Get('getInfo')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getInfo(@Request() req: RequestWithUser) {
    const userId = req.user.userId
    return this.userInfoService.getUserInfo(userId)
  }

  @Put('profile')
  @Log('个人中心', BusinessType.UPDATE)
  @ApiOperation({ summary: '更新个人信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body()
    body: {
      nickName?: string
      email?: string
      phonenumber?: string
      sex?: string
      avatar?: string
    },
  ) {
    const userId = req.user.userId
    return this.userService.updateProfile(userId, body)
  }

  @Put('profile/updatePwd')
  @Log('个人中心', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改个人密码' })
  @ApiResponse({ status: 200, description: '修改成功' })
  async updatePassword(
    @Request() req: RequestWithUser,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    const userId = req.user.userId
    return this.userService.updatePassword(userId, body.oldPassword, body.newPassword)
  }

  @Post()
  @RequirePermission('system:user:add')
  @Log('用户管理', BusinessType.INSERT)
  @ApiOperation({ summary: '新增用户' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Request() req: RequestWithUser, @Body() createUserDto: CreateUserDto) {
    await this.roleSecurity.assertCanAssignRoles(req.user.userId, createUserDto.roleIds)
    return this.userService.create(createUserDto)
  }

  @Get()
  @RequirePermission('system:user:list')
  @ApiOperation({ summary: '查询用户列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Request() req: RequestWithUser, @Query() query: QueryUserDto) {
    return this.roleSecurity.listAccessibleUsers(req.user.userId, query)
  }

  @Get(':userId')
  @RequirePermission('system:user:query')
  @ApiOperation({ summary: '查询用户详情' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findOne(@Request() req: RequestWithUser, @Param('userId') userId: string) {
    await this.roleSecurity.assertCanMaintainUser(req.user.userId, userId)
    return this.userService.findOne(userId)
  }

  @Put('resetPwd')
  @RequirePermission('system:user:resetPwd')
  @Log('用户管理', BusinessType.UPDATE)
  @ApiOperation({ summary: '重置用户密码' })
  @ApiResponse({ status: 200, description: '重置成功' })
  async resetPassword(
    @Request() req: RequestWithUser,
    @Body() body: { userId: string; password: string },
  ) {
    await this.roleSecurity.assertCanMaintainUser(req.user.userId, body.userId)
    return this.userService.resetPassword(body.userId, body.password)
  }

  @Put('changeStatus')
  @RequirePermission('system:user:edit')
  @Log('用户管理', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改用户状态' })
  @ApiResponse({ status: 200, description: '修改成功' })
  async changeStatus(
    @Request() req: RequestWithUser,
    @Body() body: { userId: string; status: string },
  ) {
    await this.roleSecurity.assertCanMaintainUser(req.user.userId, body.userId)
    return this.userService.changeStatus(body.userId, body.status)
  }

  @Put(':userId')
  @RequirePermission('system:user:edit')
  @Log('用户管理', BusinessType.UPDATE)
  @ApiOperation({ summary: '修改用户' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: '修改成功' })
  async update(
    @Request() req: RequestWithUser,
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    await this.roleSecurity.assertCanMaintainUser(req.user.userId, userId)
    await this.roleSecurity.assertCanAssignRoles(req.user.userId, updateUserDto.roleIds)
    return this.userService.update(userId, updateUserDto)
  }

  @Delete(':userId')
  @RequirePermission('system:user:remove')
  @Log('用户管理', BusinessType.DELETE)
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'userId', description: '用户ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Request() req: RequestWithUser, @Param('userId') userId: string) {
    await this.roleSecurity.assertCanMaintainUser(req.user.userId, userId)
    return this.userService.remove(userId)
  }

  @Get('export/excel')
  @RequirePermission('system:user:export')
  @Log('用户管理', BusinessType.EXPORT)
  @ApiOperation({ summary: '导出用户数据' })
  async exportExcel(
    @Request() req: RequestWithUser,
    @Query() query: QueryUserDto,
    @Res() res: Response,
  ) {
    const data = await this.roleSecurity.listAccessibleUsersForExport(req.user.userId, query)
    const filename = `用户数据_${Date.now()}`
    await this.excelService.exportExcel(res, data, USER_EXPORT_COLUMNS, filename, '用户列表')
  }

  @Get('import/template')
  @RequirePermission('system:user:import')
  @ApiOperation({ summary: '下载用户导入模板' })
  async downloadTemplate(@Res() res: Response) {
    const templateColumns = USER_EXPORT_COLUMNS.filter(
      (c) => c.key !== 'userId' && c.key !== 'createTime',
    )
    const exampleData = [
      {
        userName: 'zhangsan',
        nickName: '张三',
        deptName: '研发部门',
        phonenumber: '13800138000',
        email: 'zhangsan@example.com',
        sex: '男',
        status: '正常',
      },
    ]
    await this.excelService.generateTemplate(
      res,
      templateColumns,
      '用户导入模板',
      '用户列表',
      exampleData,
    )
  }

  @Post('import')
  @RequirePermission('system:user:import')
  @Log('用户管理', BusinessType.IMPORT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '导入用户数据' })
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @Query('updateSupport') updateSupport: string,
  ) {
    if (!file) {
      return { code: 400, msg: '请选择要导入的文件' }
    }
    const users = await this.excelService.parseExcel<{
      userName: string
      nickName: string
      deptName?: string
      phonenumber?: string
      email?: string
      sex?: string
      status?: string
    }>(file.buffer, USER_IMPORT_COLUMN_MAP)

    if (users.length === 0) {
      return { code: 400, msg: 'Excel 文件中没有数据' }
    }

    const result = await this.userImportService.importUsers(users, updateSupport === 'true')
    return result
  }
}

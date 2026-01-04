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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/permission.decorator';
import { PostService } from './post.service';
import { QueryPostDto } from './dto/query-post.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('岗位管理')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('system/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @RequirePermission('system:post:list')
  @ApiOperation({ summary: '查询岗位列表' })
  list(@Query() query: QueryPostDto) {
    return this.postService.findAll(query);
  }

  @Post()
  @RequirePermission('system:post:add')
  @ApiOperation({ summary: '新增岗位' })
  create(@Body() dto: CreatePostDto) {
    return this.postService.create(dto);
  }

  @Put('changeStatus')
  @RequirePermission('system:post:edit')
  @ApiOperation({ summary: '修改岗位状态' })
  changeStatus(@Body() body: { postId: string; status: string }) {
    return this.postService.changeStatus(body.postId, body.status);
  }

  @Get(':postId')
  @RequirePermission('system:post:query')
  @ApiOperation({ summary: '查询岗位详情' })
  get(@Param('postId') postId: string) {
    return this.postService.findOne(postId);
  }

  @Put(':postId')
  @RequirePermission('system:post:edit')
  @ApiOperation({ summary: '修改岗位' })
  update(@Param('postId') postId: string, @Body() dto: UpdatePostDto) {
    return this.postService.update(postId, dto);
  }

  @Delete()
  @RequirePermission('system:post:remove')
  @ApiOperation({ summary: '删除岗位' })
  remove(@Query('ids') ids: string) {
    const postIds = ids ? ids.split(',') : [];
    return this.postService.remove(postIds);
  }
}

/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Param,
  Post as HttpPost,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Put,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { Post } from './post.entity';

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  @ApiOperation({ summary: 'إنشاء بوست جديد (فقط للمطاعم)' })
  @ApiConsumes('multipart/form-data') // 👈 مهم
  @UseInterceptors(FileInterceptor('mediaUrl'))
  async create(@CurrentUser() user: User, @Body() dto: CreatePostDto,  @UploadedFile() file: Express.Multer.File,) {
    return this.postService.createPost(user, dto,file);
  }

  @Get()
  @ApiOperation({ summary: 'جلب كل البوستات' })
  @ApiOkResponse({ type: [Post] })
  async getAllPosts() {
    return await this.postService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':postId')
  @ApiOperation({ summary: 'تعديل بوست (فقط لصاحب المطعم)' })
  @ApiParam({ name: 'postId', description: 'معرّف البوست' })
  async update(
    @CurrentUser() user: User,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postService.updatePost(user, postId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':postId')
  @ApiOperation({ summary: 'حذف بوست (فقط لصاحب المطعم)' })
  @ApiParam({ name: 'postId', description: 'معرّف البوست' })
  async delete(@CurrentUser() user: User, @Param('postId') postId: string) {
    return this.postService.deletePost(user, postId);
  }
}

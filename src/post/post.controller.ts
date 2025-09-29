import {
  Controller,
  Post as HttpPost,
  Delete,
  Get,
  Body,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ReactToPostDto } from './dto/react-to-post.dto';
import { BusinessType } from 'src/common/business-type.enum';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a post (restaurant/store owners only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        text: { type: 'string' },
      },
    },
  })
  @HttpPost()
  @UseInterceptors(FileInterceptor('file'))
  @ApiQuery({ name: 'type', enum: BusinessType, required: true })
  async createPost(
    @CurrentUser() user: User,
    @Body() dto: CreatePostDto,
    @Query('type') type: BusinessType,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const fileUrl = file?.path;
    const thumbnailUrl = file ? `thumbnail-of-${file.filename}` : undefined;

    return this.postService.createPost(user, dto, type, fileUrl, thumbnailUrl);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a post (only restaurant owners)' })
  @ApiParam({ name: 'id', type: String, description: 'Post ID' })
  @Put(':id')
  async updatePost(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postService.updatePost(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a post (only restaurant owners)' })
  @ApiParam({ name: 'id', type: String, description: 'Post ID' })
  @Delete(':id')
  async deletePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postService.deletePost(user, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get posts by business type (restaurant/store)' })
  @Get('by-type/:type')
  async getPosts(@Param('type') type: BusinessType, @CurrentUser() user: User) {
    return this.postService.getPostsForUser(type, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'React to a post' })
  @ApiParam({ name: 'id', type: String, description: 'Post ID' })
  @HttpPost(':id/reactions')
  async reactToPost(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: ReactToPostDto,
  ) {
    return this.postService.reactToPost(user, id, dto.type);
  }
}

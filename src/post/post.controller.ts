/* eslint-disable prettier/prettier */
import { Controller, Post as PostReq, Get, Body, UseGuards, Param } from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';


@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // only authenticated users (restaurant owners) should create posts
  @UseGuards(JwtAuthGuard)
  @PostReq()
  @ApiOperation({ summary: 'Post endpoint' })
  @ApiBody({ schema: { example: {"content": "New seasonal menu available!", "imageUrl": "https://example.com/posts/post1.jpg"} } })
  @ApiResponse({ status: 201, description: 'Created', schema: { example: {"content": "New seasonal menu available!", "imageUrl": "https://example.com/posts/post1.jpg"} } })
  create(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.postService.createPost(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get endpoint' })
  @ApiResponse({ status: 200, description: 'Success', schema: { example: {"id": "88888888-8888-4888-8888-888888888888", "content": "New seasonal menu available!", "imageUrl": "https://example.com/posts/post1.jpg", "videoUrl": null, "ownerId": "33333333-3333-4333-8333-333333333333", "createdAt": "2025-09-13T10:15:00.000Z"} } })  getAll() {
    return this.postService.getAllPosts();
  }

  @Get('restaurant/:ownerId')
  @ApiOperation({ summary: 'Get endpoint' })
  @ApiResponse({ status: 200, description: 'Success', schema: { example: {"id": "88888888-8888-4888-8888-888888888888", "content": "New seasonal menu available!", "imageUrl": "https://example.com/posts/post1.jpg", "videoUrl": null, "ownerId": "33333333-3333-4333-8333-333333333333", "createdAt": "2025-09-13T10:15:00.000Z"} } })
  getByRestaurant(@Param('ownerId') ownerId: string) {
    return this.postService.getPostsByRestaurant(ownerId);
  }

@Get(':id')
  @ApiOperation({ summary: 'Get endpoint' })
  @ApiResponse({ status: 200, description: 'Success', schema: { example: {"id": "88888888-8888-4888-8888-888888888888", "content": "New seasonal menu available!", "imageUrl": "https://example.com/posts/post1.jpg", "videoUrl": null, "ownerId": "33333333-3333-4333-8333-333333333333", "createdAt": "2025-09-13T10:15:00.000Z"} } })
  getById(@Param('id') id: string) {
    return this.postService.getPostById(id);
  }
}

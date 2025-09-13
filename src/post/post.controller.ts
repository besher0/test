/* eslint-disable prettier/prettier */
import { Controller, Post as PostReq, Get, Body, UseGuards, Param } from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { User } from 'src/user/user.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // only authenticated users (restaurant owners) should create posts
  @UseGuards(JwtAuthGuard)
  @PostReq()
  create(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.postService.createPost(user, dto);
  }

  @Get()
  getAll() {
    return this.postService.getAllPosts();
  }

  @Get('restaurant/:ownerId')
  getByRestaurant(@Param('ownerId') ownerId: string) {
    return this.postService.getPostsByRestaurant(ownerId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.postService.getPostById(id);
  }
}

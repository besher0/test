import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PostReaction } from './post-reaction.entity';
import { Story } from 'src/story/story.entity';
import { Follow } from 'src/follow/follow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Restaurant, PostReaction, Story, Follow]),
    CloudinaryModule,
  ],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}

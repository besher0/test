import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Restaurant } from 'src/restaurant/restaurant.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PostReaction } from './post-reaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Restaurant, PostReaction]),
    CloudinaryModule,
  ],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}

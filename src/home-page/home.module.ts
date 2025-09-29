import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { User } from '../user/user.entity';
import { Meal } from '../meal/meal.entity';
import { Country } from '../country/county.entity';
import { Restaurant } from '../restaurant/restaurant.entity';
import { Rating } from '../rating/rating.entity';
import { Post } from '../post/post.entity';
import { PostReaction } from '../post/post-reaction.entity';
import { Story } from '../story/story.entity';
import { Follow } from '../follow/follow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Meal,
      Country,
      Restaurant,
      Rating,
      Post,
      PostReaction,
      Story,
      Follow,
    ]),
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
